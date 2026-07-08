import { create } from "zustand";
import { AuthUser } from "@shared/types";
import * as authService from "../services/authService";

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (uid: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,

  login: async (uid: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(uid, password);
      if (result.success && result.role === "manager") {
        set({
          user: { uid, displayName: result.displayName || uid, role: result.role },
          isLoggedIn: true,
          isLoading: false,
        });
        return true;
      } else if (result.success && result.role !== "manager") {
        set({
          error: "Access denied. Only managers can use this app.",
          isLoading: false,
        });
        return false;
      } else {
        set({
          error: result.error || "Invalid credentials.",
          isLoading: false,
        });
        return false;
      }
    } catch {
      set({
        error: "Network error. Please try again.",
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
