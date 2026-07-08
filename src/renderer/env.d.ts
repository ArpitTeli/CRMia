declare global {
  interface Window {
    api: {
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
  }
}

export {};
