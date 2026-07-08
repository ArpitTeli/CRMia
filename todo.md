# Manager CRM — Phase 1 Todo

---

## 1. Project Setup & Tooling

### 1.1 Initialize Electron + React project
- [ ] Use Electron + Vite + React (TypeScript) — best DX, fast builds, modern stack
- [ ] Target Node.js 20 LTS
- [ ] Use latest stable Electron (v31+)
- [ ] Set up `electron-builder` for packaging/distribution
- [ ] Configure main process (background) + renderer process (UI) separation

### 1.2 Dev tooling
- [ ] ESLint + Prettier config (React + TypeScript rules)
- [ ] Husky + lint-staged for pre-commit hooks
- [ ] Commitlint (conventional commits)
- [ ] VS Code workspace settings / recommended extensions

### 1.3 Directory structure
```
crm/
├── src/
│   ├── main/          # Electron main process
│   │   ├── index.ts
│   │   ├── ipc/       # IPC handlers
│   │   └── updater/   # Phase 2 — updater
│   ├── preload/       # Preload script (context bridge)
│   │   └── index.ts
│   ├── renderer/      # React UI
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.html
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/  # API calls, Google Sheets logic
│   │   ├── store/     # State management (Zustand or Redux Toolkit)
│   │   ├── types/     # TypeScript types/interfaces
│   │   └── styles/    # Global styles, theme
│   └── shared/        # Types shared between main & renderer
│       └── types.ts
├── electron-builder.yml
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 2. Google Sheets / Apps Script Backend

### 2.1 Auth Sheet (`1HLBEiQ-tGaTdm4Lq6JltGcfBIWcgc528-JKSD4gON2Q`)
- [ ] **Login endpoint** — POST `{ action: "login", uid, password }` → returns `{ success, displayName, role }`
- [ ] **Role validation** — CRM rejects any role other than `manager`
- [ ] **Apps Script URL:** `https://script.google.com/macros/s/AKfycbyhkpWsu7OoZrYFdAZxJZ74h0HYp0EkzNP21iCID9UHQBGc-Ugchx3m6M60GkTgDv8dtQ/exec`

### 2.2 Shared Leads Sheet (`1LWsb7dfw5vQ3DZcLgmN523ALoys9hqYfmft6v-bA9kU`)
- [ ] **listLeads endpoint** — GET/POST all leads from shared sheet
  - Returns columns: `query`, `name`, `website`, `company_phone`, `email`, `pushed_by`, `Comments`, `Lead Status`, `Assigned To`, `Pipeline Stage`, `Priority`, `Manager Notes`, `Task Status`, `Developer Comments`, `Due Date`, `Created At`, `Updated At`
  - New leads from Quali have empty: `Assigned To`, `Pipeline Stage`, `Priority`, `Manager Notes`, `Task Status`, `Developer Comments`, `Due Date`
- [ ] **assignLead endpoint** — assigns lead to a developer
  - Request: `{ action: "assignLead", name, website, assignedTo, pipelineStage, priority, dueDate, managerNotes }`
  - Writes: `Assigned To`, `Pipeline Stage`, `Priority`, `Manager Notes`, `Due Date`, `Updated At`
  - Response: `{ success: true }` or `{ success: false, error }`
- [ ] **updatePipeline endpoint** — updates pipeline stage, priority, notes per lead
  - Request: `{ action: "updatePipeline", name, website, pipelineStage, priority, managerNotes }`
  - Writes: `Pipeline Stage`, `Priority`, `Manager Notes`, `Updated At`
  - Response: `{ success: true }`
- [ ] **Duplicate detection note** — CRM does NOT prevent duplicates; it displays whatever is in the sheet (same `name` + `website` combo allowed)
- [ ] **Handling Quali data edge cases:**
  - `company_phone` already has +91 stripped (starts with digits only)
  - `Lead Status` is empty on push (Qualifier tags locally)
  - `Comments` may be empty
  - `pushed_by` is qualifier's display name from auth
  - `Created At` is set when Quali pushes; CRM appends `Updated At` on any change

### 2.3 Developer Roster Sheet (separate file)
- [ ] Create new Google Sheet for developer roster
- [ ] Sheet ID and URL to be determined
- [ ] **Auto-populate headers** on first run if sheet is empty
- [ ] Columns: `UID`, `Display Name`, `Specialization`, `Email`, `IsActive`
- [ ] **listDevelopers endpoint** — returns all developers where `IsActive = true`
  - Request: `{ action: "listDevelopers" }`
  - Response: `{ success: true, developers: [{ uid, name, specialization, email }] }`
- [ ] **addDeveloper endpoint** — adds a new developer to roster
  - Request: `{ action: "addDeveloper", uid, name, specialization, email }`
  - Response: `{ success: true }`
- [ ] **updateDeveloper endpoint** — updates developer details
  - Request: `{ action: "updateDeveloper", uid, name?, specialization?, email?, isActive? }`
  - Response: `{ success: true }`
- [ ] **removeDeveloper endpoint** — sets `IsActive = false` (soft delete, never hard delete)
  - Request: `{ action: "removeDeveloper", uid }`
  - Response: `{ success: true }`

### 2.4 History Sheet (separate file)
- [ ] Create new Google Sheet for activity history
- [ ] Sheet ID and URL to be determined
- [ ] **Auto-populate headers** on first run if sheet is empty
- [ ] Columns: `Timestamp`, `User UID`, `User Name`, `Action Type`, `Lead Name`, `Lead Website`, `Old Value`, `New Value`, `Notes`
- [ ] **logHistory endpoint** — appends a row to the history sheet
  - Request: `{ action: "logHistory", timestamp, userUid, userName, actionType, leadName, leadWebsite, oldValue, newValue, notes }`
  - Response: `{ success: true }`
- [ ] **getHistory endpoint** — retrieves history for a specific lead
  - Request: `{ action: "getHistory", leadName, leadWebsite }`
  - Response: `{ success: true, history: [...] }`
- [ ] Actions that should trigger a history log:
  - Lead assigned to a developer → `actionType: "assign"`
  - Pipeline stage changed → `actionType: "stage_change"`
  - Priority changed → `actionType: "priority_change"`
  - Manager notes edited → `actionType: "notes_edit"`
  - Due date set/changed → `actionType: "due_date_change"`
  - Lead reassigned to different developer → `actionType: "reassign"`
  - Lead unassigned from developer → `actionType: "unassign"`

### 2.5 Apps Script Deployment
- [ ] All endpoints deployed as a single Google Apps Script project
- [ ] CORS headers set for Electron app origin
- [ ] Error handling: every endpoint returns `{ success: false, error: "message" }` on failure
- [ ] Logging within Apps Script for debugging
- [ ] Sheet IDs and API URLs are hardcoded in the apps script (not in frontend)

---

## 3. Authentication (Frontend)

### 3.1 Login Screen
- [ ] Dark themed login form (matching Quali style)
- [ ] Fields: UID (text input), Password (password input)
- [ ] "Login" button
- [ ] **On login:**
  - POST to auth Apps Script with `{ action: "login", uid, password }`
  - If `role !== "manager"`, show error: "Access denied. Only managers can use this app."
  - If credentials invalid, show error: "Invalid credentials."
  - On success, store session (displayName, uid) in app state
  - Redirect to Dashboard

### 3.2 Session Management
- [ ] Session persists in memory (no need for token storage on disk)
- [ ] Logout clears session and returns to login screen
- [ ] On app restart, user must log in again

---

## 4. App Shell / Layout

### 4.1 Left Navigation Bar
- [ ] Fixed left sidebar
- [ ] **Tabs:**
  - Dashboard (table icon)
  - Kanban (board icon)
  - Developers (people icon)
  - History (clock icon)
  - Settings (gear icon)
  - Logout (exit icon)
- [ ] Active tab is highlighted
- [ ] Icons for each tab
- [ ] App logo/name at top of sidebar

### 4.2 Main Content Area
- [ ] Renders the active tab's view
- [ ] Fullscreen mode: hides nav bar and any back buttons, shows only the content panel
- [ ] Exit fullscreen via Escape key or a small floating "exit fullscreen" button

### 4.3 Theme
- [ ] Dark mode as default (matching Quali)
- [ ] Light mode option in Settings
- [ ] Theme persisted in localStorage
- [ ] CSS custom properties (CSS variables) for theming:
  - Background colors (primary, secondary, surface)
  - Text colors (primary, secondary, muted)
  - Accent/highlight colors
  - Border colors
  - Shadow values

---

## 5. Dashboard — Main Table View

### 5.1 Lead Table
- [ ] Fetches all leads from shared sheet via `listLeads` endpoint on load
- [ ] Polling or manual refresh button to sync latest data
- [ ] **Default visible columns:** Query, Name, Website, Pipeline Stage, Assigned To, Priority, Lead Status, Due Date, Created At
- [ ] All columns from the sheet exist in the data model, but some are hidden by default:
  - Hidden by default: `company_phone`, `email`, `pushed_by`, `Comments`, `Manager Notes`, `Task Status`, `Developer Comments`, `Updated At`
- [ ] Column picker (gear icon or dropdown) to show/hide columns
- [ ] Column order can be rearranged via drag-and-drop (column headers)
- [ ] `Name` column is a clickable link → opens lead detail side panel
- [ ] `Website` column is a clickable link → opens URL in system browser
- [ ] `Name` + `Website` together form the unique lead identifier

### 5.2 Column Display Details
| Column | Display |
|--------|---------|
| Query | Plain text |
| Name | Clickable link (opens side panel) |
| Website | Clickable link (opens browser) |
| company_phone | Plain text |
| email | Plain text |
| pushed_by | Plain text |
| Comments | Plain text (truncated with tooltip) |
| Lead Status | Badge: Good (green), Maybe (yellow), Bad (red), empty (gray) |
| Assigned To | Developer name or "Unassigned" |
| Pipeline Stage | Badge/colored tag |
| Priority | Badge: High (red), Medium (yellow), Low (green) |
| Manager Notes | Plain text (truncated) |
| Task Status | Badge |
| Developer Comments | Plain text (truncated) |
| Due Date | Formatted date, overdue in red |
| Created At | Formatted date/time |
| Updated At | Formatted date/time |

### 5.3 Filters (Above Table)
- [ ] **Pipeline Stage filter** — dropdown with options: All, New, Contacted, Qualified, Closed, plus any custom stages
- [ ] **Assigned Developer filter** — dropdown: All, Unassigned, [developer names]
- [ ] **Priority filter** — dropdown: All, High, Medium, Low
- [ ] **Search bar** — free-text search across: Name, Website, Query, Comments
- [ ] Filters can be combined (AND logic)
- [ ] Clear all filters button

### 5.4 Sorting
- [ ] Click column header to sort ascending/descending
- [ ] Sort indicator arrow on active sort column
- [ ] Multi-column sort (hold Shift + click)

### 5.5 Pagination / Virtual Scrolling
- [ ] Use virtual scrolling (e.g., TanStack Virtual) for performance with large datasets
- [ ] If many leads, avoid DOM pollution

### 5.6 Refresh
- [ ] Manual "Refresh" button in toolbar
- [ ] Auto-refresh every 60 seconds (configurable later)

---

## 6. Lead Detail — Side Panel

### 6.1 Panel Behavior
- [ ] Slides in from the right side of the screen
- [ ] Overlays the main content (but nav bar remains visible)
- [ ] Width: ~500px default, resizable
- [ ] Close button (X) or click outside to close
- [ ] "Fullscreen" button → opens a full-window version (nav bar hidden, no back button)

### 6.2 Compact Header (always visible, no scroll)
- [ ] Lead name (large text)
- [ ] Website (clickable link)
- [ ] Current Pipeline Stage (badge)
- [ ] Assigned To (developer name or "Unassigned")
- [ ] Priority (badge)
- [ ] Lead Status (badge)
- [ ] Due Date (formatted)

### 6.3 Scrollable Content Below Header
- [ ] **Basic Info section:**
  - Query (read-only)
  - Company Phone (read-only)
  - Email (read-only, clickable mailto)
  - Pushed By (read-only)
  - Created At (read-only)
  - Updated At (read-only)
- [ ] **Comments section:**
  - Qualifier Comments (read-only, multi-line)
  - Developer Comments (read-only, multi-line)
- [ ] **Management section (editable by manager):**
  - Assigned To — dropdown of active developers + "Unassigned"
  - Pipeline Stage — dropdown (New, Contacted, Qualified, Closed, etc.)
  - Priority — dropdown (High, Medium, Low)
  - Due Date — date picker
  - Manager Notes — textarea (multi-line)
- [ ] **Save Changes button** — when any editable field is modified, enable save
  - On save: POST to `updatePipeline` or `assignLead` depending on what changed
  - Also POST to `logHistory` with relevant action type
  - Show success/error toast

### 6.4 Activity History Section (within panel)
- [ ] Fetches history from `getHistory` endpoint for this lead
- [ ] Chronological list (newest first or oldest first, toggleable)
- [ ] Each entry shows: timestamp, user name, action type, old value → new value
- [ ] Compact timeline UI

---

## 7. Kanban Board View

### 7.1 Layout
- [ ] Horizontal swimlanes for each pipeline stage (New, Contacted, Qualified, Closed, etc.)
- [ ] Each lane is a scrollable column
- [ ] Leads are cards within the columns
- [ ] Columns auto-size based on content, with horizontal scroll if needed

### 7.2 Lead Cards (on Kanban)
- [ ] Compact card showing:
  - Lead name
  - Website (truncated)
  - Assigned developer (or "Unassigned")
  - Priority badge
  - Due date (overdue highlighted in red)
- [ ] Click card → opens lead detail side panel
- [ ] Cards are sorted within column (by priority, then due date)

### 7.3 Drag and Drop
- [ ] Drag card from one stage column to another
- [ ] **Auto-save on drop** — immediately POST to `updatePipeline` with the new stage
- [ ] Optimistic update: move the card instantly, revert on API failure
- [ ] Log to history sheet via `logHistory` with `actionType: "stage_change"`
- [ ] Visual feedback during drag (ghost card, column highlight)
- [ ] Smooth animations

### 7.4 Column Management
- [ ] Pipeline stages are defined in the app config (not user-configurable for Phase 1)
- [ ] Default stages: New, Contacted, Qualified, Closed
- [ ] Each column shows a count of leads at top

---

## 8. Developer Portal

### 8.1 Developer Roster Panel (left side or top)
- [ ] List of all active developers (`IsActive = true`)
- [ ] Each developer shown as a card
- [ ] **Card content:**
  - Developer avatar (initials in circle if no profile pic)
  - Display name
  - Specialization (small text)
  - Assigned leads count (number badge)
  - Small circular icons of all assigned leads (name initials or first letter)
- [ ] "Add Developer" button → opens modal/form
- [ ] Click on a developer card → expands/drills into their assigned leads

### 8.2 Add/Edit Developer Modal
- [ ] Fields: UID, Display Name, Specialization, Email
- [ ] POST to `addDeveloper` or `updateDeveloper`
- [ ] Validation: UID is required and unique
- [ ] On success, refresh roster

### 8.3 Developer Detail View (when card is clicked)
- [ ] Shows full developer info
- [ ] List of all leads assigned to this developer in a mini-table
- [ ] Lead rows are draggable (see 8.4)
- [ ] "Remove Developer" button → soft delete (sets `IsActive = false`)

### 8.4 Drag-and-Drop: Lead Reassignment Between Developers
- [ ] Lead icons on developer cards are draggable
- [ ] Drop a lead icon onto another developer's card → reassigns that lead
- [ ] **Auto-save:** POST to `assignLead` with new `assignedTo`
- [ ] Log to history sheet with `actionType: "reassign"`
- [ ] Also log `Old Value` (previous dev UID) and `New Value` (new dev UID)

### 8.5 Right-Click Context Menu on Lead Icons
- [ ] **Option 1: "Remove from Developer"** → unassigns the lead (sets `Assigned To` to empty)
  - POST to `assignLead` with `assignedTo: ""`
  - Logs to history with `actionType: "unassign"`
- [ ] **Option 2: "Add to Another Developer"** → opens a submenu/dialog listing all active developers; selecting one reassigns the lead
  - Same auto-save + history logging as drag-and-drop

---

## 9. History View

### 9.1 History Table
- [ ] Fetches from history sheet via a dedicated endpoint (or reads the sheet directly)
- [ ] Columns: Timestamp, User Name, Action Type, Lead Name, Lead Website, Old Value, New Value, Notes
- [ ] Sortable by timestamp (default: newest first)
- [ ] Filters:
  - By Action Type (dropdown: All, assign, stage_change, priority_change, etc.)
  - By User Name (dropdown)
  - By Lead Name (search/autocomplete)
  - Date range picker (from/to)

### 9.2 History Detail (click a row)
- [ ] Opens a small panel/modal showing the full entry details
- [ ] "Jump to Lead" button → opens lead detail side panel for that lead

---

## 10. Settings View

### 10.1 Theme Switcher
- [ ] Toggle: Dark Mode / Light Mode
- [ ] Preview of each theme
- [ ] Changes apply immediately and persist in localStorage

### 10.2 Placeholder Sections (for Phase 2)
- [ ] "Updater" section — placeholder text: "Updater coming soon"
- [ ] "Google Sheets" section — displays hardcoded sheet IDs (read-only, informational)
- [ ] "About" section — app version, build info

---

## 11. State Management

### 11.1 Global State (Zustand recommended)
- [ ] **authStore:** currentUser (uid, displayName, role), isLoggedIn, login(), logout()
- [ ] **leadsStore:** leads[], filters, sort config, selectedLead, fetchLeads(), updateLead()
- [ ] **developersStore:** developers[], fetchDevelopers(), addDeveloper(), updateDeveloper(), removeDeveloper()
- [ ] **historyStore:** history[], filters, fetchHistory()
- [ ] **uiStore:** theme, sidebar open/closed, active tab, fullscreen mode, toasts

### 11.2 Side Effects
- [ ] Use React Query (TanStack Query) or SWR for server state (leads, developers, history)
- [ ] Automatic cache invalidation on mutations
- [ ] Optimistic updates for drag-and-drop operations
- [ ] Retry logic for API failures

---

## 12. API / Service Layer

### 12.1 API Client
- [ ] Single module that wraps all Apps Script POST requests
- [ ] Base URL for each deployment: auth, leads, roster, history (as separate Apps Script projects or combined)
- [ ] Error handling: parse response, throw typed errors
- [ ] Timeout handling (10s default)

### 12.2 Services
- [ ] `authService.ts` — login()
- [ ] `leadsService.ts` — listLeads(), assignLead(), updatePipeline()
- [ ] `developersService.ts` — listDevelopers(), addDeveloper(), updateDeveloper(), removeDeveloper()
- [ ] `historyService.ts` — getHistory(), logHistory()

### 12.3 IPC (Inter-Process Communication)
- [ ] Use Electron's contextBridge to expose API methods from main process to renderer
- [ ] preload.ts exposes a `window.api` object with all service methods
- [ ] Main process handles actual HTTP requests (avoids CORS issues in renderer)

---

## 13. Error Handling & UX

### 13.1 Toast Notifications
- [ ] Success toast (green) for: lead assigned, stage updated, developer added, etc.
- [ ] Error toast (red) for: API failures, network errors, validation errors
- [ ] Auto-dismiss after 4 seconds
- [ ] Stackable (multiple toasts visible)

### 13.2 Loading States
- [ ] Skeleton loaders for table, sidebar panels, developer cards
- [ ] Full-page spinner on initial login
- [ ] Inline spinner on save buttons

### 13.3 Empty States
- [ ] Empty leads table: "No leads found. They will appear here once qualifiers push them."
- [ ] No results after filtering: "No leads match your filters."
- [ ] No developers: "No developers added yet. Add one to get started."
- [ ] Empty history: "No activity recorded for this lead yet."

### 13.4 Confirmation Dialogs
- [ ] Confirmation before removing a developer (soft delete)
- [ ] Confirmation before discarding unsaved changes in lead detail panel
- [ ] Confirmation before logging out

---

## 14. Accessibility & UX Polish

- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Tooltips on icon-only buttons
- [ ] Truncated text with `title` attribute or tooltip
- [ ] Responsive minimum window size (1024x768)
- [ ] Electron window title: "Manager CRM"

---

## 15. Security

- [ ] All API requests go through Electron main process (not exposed to web renderer)
- [ ] Context isolation enabled (`contextIsolation: true`)
- [ ] Node.js integration disabled in renderer (`nodeIntegration: false`)
- [ ] No secrets/API keys in renderer code
- [ ] All external links open in system browser via `shell.openExternal`
- [ ] Content Security Policy (CSP) headers set

---

## 16. Testing

### 16.1 Unit Tests (Vitest)
- [ ] Service layer tests (API client, response parsing)
- [ ] Store tests (Zustand stores)
- [ ] Utility/helper function tests
- [ ] Component tests for critical UI (login, lead detail panel)

### 16.2 Integration Tests
- [ ] Test login flow
- [ ] Test lead fetch and display
- [ ] Test assign lead flow

### 16.3 E2E Tests (Playwright or Spectron)
- [ ] Login → Dashboard loads
- [ ] Click lead → side panel opens
- [ ] Edit & save lead → confirmation toast
- [ ] Drag lead on kanban → stage updates

---

## 17. Build & Distribution

### 17.1 electron-builder config
- [ ] Windows: NSIS installer or portable
- [ ] macOS: DMG
- [ ] Linux: AppImage
- [ ] Auto-update support (Phase 2)

### 17.2 CI/CD (future)
- [ ] GitHub Actions for build + release
- [ ] Code signing setup

---

## 18. Phase 2 (Future — Documented, Not Started)

- [ ] Auto-updater integration (following existing updater pattern from user's other project)
- [ ] Analytics dashboard (charts: leads by stage, conversion rates, developer workload distribution)
- [ ] Finances management (revenue tracking, invoicing, payment status per lead)
- [ ] Additional pipeline stages customization
- [ ] Notifications/alerts (overdue tasks, new leads)
- [ ] Excel/CSV export of leads
- [ ] Multi-language support
- [ ] Role-based permissions refinement
- [ ] Audit log improvements
- [ ] Performance: pagination on history, lazy loading
- [ ] Developer profile pictures
