import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (uid: string, password: string) =>
      ipcRenderer.invoke("auth:login", uid, password),
  },
  leads: {
    list: () => ipcRenderer.invoke("leads:list"),
    assign: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke("leads:assign", payload),
    updatePipeline: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke("leads:updatePipeline", payload),
  },
  developers: {
    list: () => ipcRenderer.invoke("developers:list"),
    add: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke("developers:add", payload),
    update: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke("developers:update", payload),
    remove: (uid: string) => ipcRenderer.invoke("developers:remove", uid),
  },
  history: {
    get: (leadName: string, leadWebsite: string) =>
      ipcRenderer.invoke("history:get", leadName, leadWebsite),
    log: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke("history:log", payload),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  },
  update: {
    install: () => ipcRenderer.invoke("update:install"),
    onChecking: (cb: () => void) => ipcRenderer.on("update:checking", () => cb()),
    onAvailable: (cb: (data: { version: string }) => void) =>
      ipcRenderer.on("update:available", (_e, d) => cb(d)),
    onNotAvailable: (cb: () => void) =>
      ipcRenderer.on("update:not-available", () => cb()),
    onProgress: (cb: (data: { percent: number }) => void) =>
      ipcRenderer.on("update:progress", (_e, d) => cb(d)),
    onDownloaded: (cb: (data: { version: string }) => void) =>
      ipcRenderer.on("update:downloaded", (_e, d) => cb(d)),
  },
});

export type ElectronAPI = {
  auth: {
    login: (uid: string, password: string) => Promise<unknown>;
  };
  leads: {
    list: () => Promise<unknown>;
    assign: (payload: Record<string, unknown>) => Promise<unknown>;
    updatePipeline: (payload: Record<string, unknown>) => Promise<unknown>;
  };
  developers: {
    list: () => Promise<unknown>;
    add: (payload: Record<string, unknown>) => Promise<unknown>;
    update: (payload: Record<string, unknown>) => Promise<unknown>;
    remove: (uid: string) => Promise<unknown>;
  };
  history: {
    get: (leadName: string, leadWebsite: string) => Promise<unknown>;
    log: (payload: Record<string, unknown>) => Promise<unknown>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  update: {
    install: () => Promise<void>;
    onChecking: (cb: () => void) => void;
    onAvailable: (cb: (data: { version: string }) => void) => void;
    onNotAvailable: (cb: () => void) => void;
    onProgress: (cb: (data: { percent: number }) => void) => void;
    onDownloaded: (cb: (data: { version: string }) => void) => void;
  };
};
