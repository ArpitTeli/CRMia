import { create } from "zustand";
import { HistoryEntry } from "@shared/types";
import * as historyService from "../services/historyService";

interface HistoryState {
  entries: HistoryEntry[];
  isLoading: boolean;
  error: string | null;
  fetchHistory: (leadName: string, leadWebsite: string) => Promise<void>;
  logHistory: (payload: {
    actionType: string;
    leadName: string;
    leadWebsite: string;
    oldValue: string;
    newValue: string;
    notes: string;
  }) => Promise<boolean>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchHistory: async (leadName, leadWebsite) => {
    set({ isLoading: true, error: null });
    try {
      const result = await historyService.getHistory(leadName, leadWebsite);
      if (result.success) {
        set({ entries: result.history as HistoryEntry[], isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch history", isLoading: false });
      }
    } catch {
      set({ error: "Network error", isLoading: false });
    }
  },

  logHistory: async (payload) => {
    try {
      const user = JSON.parse(localStorage.getItem("crm-user") || "{}");
      const result = await historyService.logHistory({
        timestamp: new Date().toISOString(),
        userUid: user.uid || "",
        userName: user.displayName || "",
        ...payload,
      });
      return result.success;
    } catch {
      return false;
    }
  },
}));
