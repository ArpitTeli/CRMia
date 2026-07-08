# Quali Auto-Update — Complete Guide

## Overview

Quali uses `electron-updater` (v6.8.9) with GitHub Releases as the update provider. When a new version is published, the installed app detects it on startup, downloads the new installer silently, and prompts the user to restart. No code signing — users accept SmartScreen warnings.

---

## Architecture

```
Developer Machine                    GitHub                       User Machine
─────────────────                    ──────                       ────────────
electron-builder                     Releases API                 electron-updater
  ↓                                    ↓                            ↓
vite build → dist/                 Quali-1.2.4.exe              checkForUpdates()
electron-builder                    latest.yml                    ↓
  ↓                                    ↓                         Download .exe
GH_TOKEN auth                      Assets uploaded               ↓
  ↓                                                              quitAndInstall()
Create Release v1.2.4                                        App restarts
Upload assets
```

---

## Publishing (Developer Side)

### Prerequisites
- GitHub repo: `ArpitTeli/Quali` (public)
- `GH_TOKEN` environment variable set (GitHub PAT with repo access)
- `electron-builder` v24.13.3 installed

### Version Bump
Edit `package.json`, change the `version` field:
```json
"version": "1.2.4"
```

### Build & Publish Command
```bash
# Clean previous build
Remove-Item dist -Recurse -Force

# Build Vite (renderer + main + preload)
npx vite build

# Build NSIS installer and publish to GitHub
# Must run as admin (electron-builder requires it on this machine)
$env:GH_TOKEN = "ghp_xxxxxxxxxxxxxxxx"
npx electron-builder --win --publish always
```

### What `--publish always` Does
1. Packages the Electron app into an NSIS installer (`Quali-1.2.4.exe`)
2. Generates `latest.yml` with SHA-512 hash of the installer
3. Creates a GitHub Release tagged `v1.2.4`
4. Uploads three assets to the release:
   - `Quali-1.2.4.exe` (the installer)
   - `latest.yml` (version metadata + hash)
   - `latest.yml.blockmap` (optional, for differential updates)

### GitHub Release Structure
```
https://github.com/ArpitTeli/Quali/releases/tag/v1.2.4
  ├── Quali-1.2.4.exe           ← NSIS installer (~80-120MB)
  ├── Quali-1.2.4.exe.blockmap  ← Differential update map
  ├── latest.yml                ← Version metadata
  └── latest.yml.blockmap       ← Blockmap for delta updates
```

### `latest.yml` Format
```yaml
version: 1.2.4
files:
  - url: Quali-1.2.4.exe
    sha512: <base64-encoded SHA-512 hash>
    size: 123456789
path: Quali-1.2.4.exe
sha512: <base64-encoded SHA-512 hash>
releaseDate: '2026-07-08T00:55:41.000Z'
```

> **Important:** SHA-512 hashes must be **base64-encoded**, not hex. `electron-builder` generates them correctly by default.

---

## Update Check (User Side)

### Initialization

All update logic runs **only in production** (`app.isPackaged === true`):

```js
// src/main/index.js
if (app.isPackaged) {
    autoUpdater.autoDownload = true;       // Download automatically
    autoUpdater.autoInstallOnAppQuit = true; // Install on quit if not restarted
}
```

### Three Check Triggers (Redundant by Design)

The app uses three independent mechanisms to call `checkForUpdates()`, ensuring at least one fires:

**Trigger 1: `did-finish-load`**
```js
mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch(() => {});
});
```
Fires when the renderer page finishes loading.

**Trigger 2: Immediate check if already loaded**
```js
if (!mainWindow.webContents.isLoading()) {
    autoUpdater.checkForUpdates().catch(() => {});
}
```
Race-condition guard: if the page loaded before the `did-finish-load` listener was registered.

**Trigger 3: 3-second fallback timer**
```js
setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
}, 3000);
```
Safety net: guarantees a check happens after 3 seconds, giving the renderer time to set up IPC listeners.

> All three can fire — `electron-updater` coalesces concurrent calls gracefully.

### What `checkForUpdates()` Does
1. Fetches `https://api.github.com/repos/ArpitTeli/Quali/releases/latest`
2. Downloads `latest.yml` from the release assets
3. Compares the version in `latest.yml` against the installed version using semver
4. If newer: starts automatic download (because `autoDownload = true`)
5. If same or older: fires `update-not-available`

---

## Event Flow

### Main Process → Renderer (via IPC)

| Event | IPC Channel | Payload | When |
|-------|-------------|---------|------|
| Checking | `update:checking` | none | `checkForUpdates()` called |
| Found | `update:available` | `{ version }` | New version detected on GitHub |
| Not found | `update:not-available` | none | Installed version is current |
| Progress | `update:progress` | `{ percent }` | During download (repeatedly) |
| Done | `update:downloaded` | `{ version }` | Download complete, ready to install |
| Error | (console only) | — | Network error, API failure, etc. |

### Renderer State Updates

```js
// src/renderer/src/App.jsx
useEffect(() => {
    window.electronAPI.onUpdateChecking(() => setUpdateStatus('checking'))
    window.electronAPI.onUpdateAvailable((data) => {
        setUpdateStatus('available')
        setUpdateVersion(data.version)
    })
    window.electronAPI.onUpdateNotAvailable(() => setUpdateStatus(null))
    window.electronAPI.onUpdateDownloaded((data) => {
        setUpdateStatus('downloaded')
        setUpdateVersion(data.version)
    })
}, [])
```

### Renderer → Main (on user action)

| Action | IPC Channel | Handler |
|--------|-------------|---------|
| Click "Restart Now" | `update:install` | `autoUpdater.quitAndInstall(false, true)` |

---

## UI: Update Banner

The banner appears on every view (landing, setup, batch, master) when an update is available.

### Visibility Logic

| `updateStatus` | Banner Shows | Content |
|----------------|-------------|---------|
| `null` | Hidden | — |
| `'checking'` | Hidden | — |
| `'available'` | Shown | "Update available (vX.Y.Z) — downloading..." |
| `'downloaded'` | Shown | "Update ready (vX.Y.Z)" + "Restart Now" button |

### Banner Elements
- **Text:** Shows version and status
- **"Restart Now" button:** Only visible when `updateStatus === 'downloaded'`
- **Close button (X):** Sets `updateDismissed = true`, hides banner for session

### Banner Styling
- Green color scheme (`#4ade80`)
- Glassmorphic background (`rgba(74, 222, 128, 0.1)`)
- Animated glow effect via pseudo-elements
- Button with inset shadows for depth

---

## Install Flow

When user clicks "Restart Now":

```
Renderer
  └─ onClick → window.electronAPI.installUpdate()
      └─ ipcRenderer.invoke('update:install')
          └─ Main: autoUpdater.quitAndInstall(false, true)
              ├─ false = not silent (shows installer UI)
              └─ true = force run after install
                  └─ App quits
                      └─ NSIS installer runs
                          └─ Replaces app files
                              └─ App restarts with new version
```

### Alternative: Auto-Install on Quit
If `autoInstallOnAppQuit = true` and the user closes the app without clicking "Restart Now":
- The downloaded installer runs silently on next quit
- App restarts with new version automatically

---

## Preload Bridge

```js
// src/preload.js
installUpdate: () => ipcRenderer.invoke('update:install'),

onUpdateChecking: (cb) => ipcRenderer.on('update:checking', () => cb()),
onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (e, d) => cb(d)),
onUpdateNotAvailable: (cb) => ipcRenderer.on('update:not-available', () => cb()),
onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (e, d) => cb(d)),
onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (e, d) => cb(d)),
```

---

## Configuration (package.json)

```json
{
  "name": "quali",
  "version": "1.2.4",
  "productName": "Quali",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArpitTeli/Quali.git"
  },
  "build": {
    "publish": {
      "provider": "github",
      "releaseType": "release"
    },
    "win": {
      "target": "nsis",
      "icon": "QualiLogo.ico",
      "artifactName": "${productName}-${version}.${ext}"
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `repository.url` | Tells `electron-updater` which GitHub repo to check |
| `build.publish.provider` | Uses GitHub Releases API |
| `build.publish.releaseType` | Only looks at full releases, not pre-releases |
| `build.win.target` | NSIS installer format |
| `build.win.artifactName` | Produces `Quali-1.2.4.exe` (dots, no spaces) |

---

## Edge Cases & Known Behaviors

1. **Errors are silent.** If the update check fails (no network, GitHub API rate limit), the error is only logged to console. The user sees nothing. There is no retry mechanism.

2. **`update:progress` is sent but unused.** The main process sends download progress percentages, but the renderer never registers `onUpdateProgress`. No progress bar exists in the UI.

3. **Listeners are never cleaned up.** The update IPC listeners are registered once on mount with no cleanup function. Safe in practice since the component never remounts.

4. **Dismiss is session-only.** Closing the banner sets a boolean. If a *different* version is found later, the banner reappears (the dismissed version isn't tracked).

5. **Triple check is safe.** `checkForUpdates()` can fire up to 3 times. `electron-updater` coalesces concurrent calls — no duplicate downloads.

6. **`update_forcer` is inert.** The file contains `force #7` and is not referenced in any code. It's a manual note/artifact.

7. **No `GH_TOKEN` in repo.** The token is an environment variable at build time, never committed.

8. **NSIS is a full installer.** The auto-updater downloads the complete NSIS installer (~80-120MB), not a delta patch. The installer replaces all app files.

9. **`autoInstallOnAppQuit`** ensures updates are eventually applied even if the user ignores the "Restart Now" button.

10. **Public repo required.** `electron-updater` fetches releases from the GitHub API. Private repos require additional auth configuration.

---

## Publishing Checklist

```bash
# 1. Bump version in package.json
# 2. Commit and push
git add -A && git commit -m "v1.2.4: description" && git push origin main

# 3. Clean dist
Remove-Item dist -Recurse -Force

# 4. Build Vite
npx vite build

# 5. Build + Publish (as admin)
$env:GH_TOKEN = "ghp_xxxxxxxx"
npx electron-builder --win --publish always

# 6. Verify release exists
# Check https://github.com/ArpitTeli/Quali/releases
# Should show: v1.2.4 with 3 assets (.exe, latest.yml, blockmap)
```
