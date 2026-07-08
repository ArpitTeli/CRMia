import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "Manager CRM",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: "#0f172a",
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // ===== Auto-Updater (production only) =====
  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // Trigger 1: did-finish-load
    mainWindow.webContents.on("did-finish-load", () => {
      autoUpdater.checkForUpdates().catch(() => {});
    });

    // Trigger 2: immediate check if already loaded
    if (!mainWindow.webContents.isLoading()) {
      autoUpdater.checkForUpdates().catch(() => {});
    }

    // Trigger 3: 3-second fallback
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 3000);

    autoUpdater.on("checking-for-update", () => {
      mainWindow?.webContents.send("update:checking");
    });

    autoUpdater.on("update-available", (info) => {
      mainWindow?.webContents.send("update:available", {
        version: info.version,
      });
    });

    autoUpdater.on("update-not-available", () => {
      mainWindow?.webContents.send("update:not-available");
    });

    autoUpdater.on("download-progress", (progress) => {
      mainWindow?.webContents.send("update:progress", {
        percent: progress.percent,
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      mainWindow?.webContents.send("update:downloaded", {
        version: info.version,
      });
    });

    autoUpdater.on("error", (err) => {
      console.error("Auto-updater error:", err);
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ===== Update IPC Handler =====
ipcMain.handle("update:install", () => {
  autoUpdater.quitAndInstall(false, true);
});

// ===== Mock Data for Development =====

const MOCK_LEADS = [
  { query: "google search", name: "Acme Corp", website: "https://acme.com", company_phone: "9876543210", email: "contact@acme.com", pushed_by: "Qualifier A", Comments: "Interested in enterprise plan", "Lead Status": "Good", "Assigned To": "", "Pipeline Stage": "New", Priority: "", "Manager Notes": "", "Task Status": "", "Developer Comments": "", "Due Date": "", "Created At": "2026-07-01T10:00:00Z", "Updated At": "" },
  { query: "linkedin", name: "TechStart Inc", website: "https://techstart.io", company_phone: "9123456780", email: "hello@techstart.io", pushed_by: "Qualifier B", Comments: "Series A startup, looking for CRM", "Lead Status": "Maybe", "Assigned To": "Dev A", "Pipeline Stage": "Contacted", Priority: "High", "Manager Notes": "Follow up next week", "Task Status": "In Progress", "Developer Comments": "Sent proposal", "Due Date": "2026-07-15", "Created At": "2026-06-28T14:30:00Z", "Updated At": "2026-07-05T09:00:00Z" },
  { query: "cold email", name: "Global Solutions", website: "https://globalsolutions.co", company_phone: "9988776655", email: "info@globalsolutions.co", pushed_by: "Qualifier A", Comments: "Large team, needs custom integration", "Lead Status": "Good", "Assigned To": "Dev B", "Pipeline Stage": "Qualified", Priority: "Medium", "Manager Notes": "Budget approved", "Task Status": "Review", "Developer Comments": "Integration spec ready", "Due Date": "2026-07-20", "Created At": "2026-06-25T08:15:00Z", "Updated At": "2026-07-08T11:30:00Z" },
  { query: "referral", name: "Bright Minds", website: "https://brightminds.edu", company_phone: "9001122334", email: "admin@brightminds.edu", pushed_by: "Qualifier C", Comments: "Education sector, 500+ users", "Lead Status": "Good", "Assigned To": "", "Pipeline Stage": "New", Priority: "Low", "Manager Notes": "", "Task Status": "", "Developer Comments": "", "Due Date": "", "Created At": "2026-07-05T16:45:00Z", "Updated At": "" },
  { query: "website visit", name: "Nova Industries", website: "https://novaindustries.com", company_phone: "9776655443", email: "sales@novaindustries.com", pushed_by: "Qualifier B", Comments: "Visited pricing page multiple times", "Lead Status": "Maybe", "Assigned To": "Dev A", "Pipeline Stage": "Contacted", Priority: "High", "Manager Notes": "Hot lead, fast turnaround", "Task Status": "To Do", "Developer Comments": "", "Due Date": "2026-07-12", "Created At": "2026-07-02T11:20:00Z", "Updated At": "2026-07-06T14:00:00Z" },
  { query: "google ads", name: "Summit Analytics", website: "https://summitanalytics.io", company_phone: "9554433221", email: "team@summitanalytics.io", pushed_by: "Qualifier A", Comments: "Data analytics firm, 50 employees", "Lead Status": "Good", "Assigned To": "Dev B", "Pipeline Stage": "Closed", Priority: "Medium", "Manager Notes": "Deal closed, onboarding started", "Task Status": "Done", "Developer Comments": "Completed setup", "Due Date": "2026-07-01", "Created At": "2026-06-15T09:00:00Z", "Updated At": "2026-07-08T16:00:00Z" },
  { query: "social media", name: "Pixel Perfect", website: "https://pixelperfect.design", company_phone: "9332211009", email: "studio@pixelperfect.design", pushed_by: "Qualifier C", Comments: "Design agency, creative team", "Lead Status": "", "Assigned To": "", "Pipeline Stage": "New", Priority: "", "Manager Notes": "", "Task Status": "", "Developer Comments": "", "Due Date": "", "Created At": "2026-07-08T13:00:00Z", "Updated At": "" },
  { query: "trade show", name: "CloudFirst Systems", website: "https://cloudfirst.sys", company_phone: "9110099887", email: "enterprise@cloudfirst.sys", pushed_by: "Qualifier B", Comments: "Met at tech conference, very interested", "Lead Status": "Good", "Assigned To": "Dev A", "Pipeline Stage": "Qualified", Priority: "High", "Manager Notes": "Enterprise deal, high value", "Task Status": "In Progress", "Developer Comments": "Working on custom demo", "Due Date": "2026-07-18", "Created At": "2026-06-20T10:00:00Z", "Updated At": "2026-07-07T15:45:00Z" },
];

const MOCK_DEVELOPERS = [
  { uid: "dev-a", name: "Dev A", specialization: "Frontend", email: "deva@example.com", isActive: true },
  { uid: "dev-b", name: "Dev B", specialization: "Backend", email: "devb@example.com", isActive: true },
];

const MOCK_HISTORY = [
  { timestamp: "2026-07-05T09:00:00Z", userUid: "manager", userName: "Manager", actionType: "assign", leadName: "TechStart Inc", leadWebsite: "https://techstart.io", oldValue: "", newValue: "Dev A", notes: "Initial assignment" },
  { timestamp: "2026-07-06T14:00:00Z", userUid: "manager", userName: "Manager", actionType: "stage_change", leadName: "TechStart Inc", leadWebsite: "https://techstart.io", oldValue: "New", newValue: "Contacted", notes: "Reached out via email" },
  { timestamp: "2026-07-07T15:45:00Z", userUid: "manager", userName: "Manager", actionType: "priority_change", leadName: "CloudFirst Systems", leadWebsite: "https://cloudfirst.sys", oldValue: "Medium", newValue: "High", notes: "Escalated due to enterprise interest" },
];

// ===== IPC Handlers =====

ipcMain.handle("auth:login", async (_event, uid: string, password: string) => {
  return { success: true, displayName: "Manager", role: "manager" };
});

ipcMain.handle("leads:list", async () => {
  return { success: true, leads: MOCK_LEADS };
});

ipcMain.handle("leads:assign", async (_event, payload: Record<string, unknown>) => {
  return { success: true };
});

ipcMain.handle("leads:updatePipeline", async (_event, payload: Record<string, unknown>) => {
  return { success: true };
});

ipcMain.handle("developers:list", async () => {
  return { success: true, developers: MOCK_DEVELOPERS };
});

ipcMain.handle("developers:add", async (_event, payload: Record<string, unknown>) => {
  return { success: true };
});

ipcMain.handle("developers:update", async (_event, payload: Record<string, unknown>) => {
  return { success: true };
});

ipcMain.handle("developers:remove", async (_event, uid: string) => {
  return { success: true };
});

ipcMain.handle("history:get", async (_event, leadName: string, leadWebsite: string) => {
  const filtered = MOCK_HISTORY.filter(
    (h) => h.leadName === leadName && h.leadWebsite === leadWebsite
  );
  return { success: true, history: filtered };
});

ipcMain.handle("history:log", async (_event, payload: Record<string, unknown>) => {
  return { success: true };
});

ipcMain.handle("shell:openExternal", async (_event, url: string) => {
  await shell.openExternal(url);
});
