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
};
