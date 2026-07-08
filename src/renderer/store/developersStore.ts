import { create } from "zustand";
import { Developer } from "@shared/types";
import * as developersService from "../services/developersService";

interface DevelopersState {
  developers: Developer[];
  isLoading: boolean;
  error: string | null;
  fetchDevelopers: () => Promise<void>;
  addDeveloper: (payload: {
    uid: string;
    name: string;
    specialization: string;
    email: string;
  }) => Promise<boolean>;
  updateDeveloper: (payload: {
    uid: string;
    name?: string;
    specialization?: string;
    email?: string;
    isActive?: boolean;
  }) => Promise<boolean>;
  removeDeveloper: (uid: string) => Promise<boolean>;
}

export const useDevelopersStore = create<DevelopersState>((set, get) => ({
  developers: [],
  isLoading: false,
  error: null,

  fetchDevelopers: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await developersService.listDevelopers();
      if (result.success) {
        set({ developers: result.developers as Developer[], isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch developers", isLoading: false });
      }
    } catch {
      set({ error: "Network error", isLoading: false });
    }
  },

  addDeveloper: async (payload) => {
    try {
      const result = await developersService.addDeveloper(payload);
      if (result.success) {
        await get().fetchDevelopers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateDeveloper: async (payload) => {
    try {
      const result = await developersService.updateDeveloper(payload);
      if (result.success) {
        await get().fetchDevelopers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  removeDeveloper: async (uid) => {
    try {
      const result = await developersService.removeDeveloper(uid);
      if (result.success) {
        await get().fetchDevelopers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
