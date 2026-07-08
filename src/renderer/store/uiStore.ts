import { create } from "zustand";

export type TabId = "dashboard" | "kanban" | "developers" | "history" | "settings";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface UIState {
  theme: "dark" | "light";
  activeTab: TabId;
  isFullscreen: boolean;
  toasts: Toast[];
  setTheme: (theme: "dark" | "light") => void;
  setActiveTab: (tab: TabId) => void;
  toggleFullscreen: () => void;
  exitFullscreen: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem("crm-theme") as "dark" | "light") || "dark",
  activeTab: "dashboard",
  isFullscreen: false,
  toasts: [],

  setTheme: (theme) => {
    localStorage.setItem("crm-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),

  exitFullscreen: () => set({ isFullscreen: false }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
