import { create } from "zustand";
import { Lead } from "@shared/types";
import * as leadsService from "../services/leadsService";

interface LeadsState {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  selectedLead: Lead | null;
  filters: {
    pipelineStage: string;
    assignedTo: string;
    priority: string;
    search: string;
  };
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  fetchLeads: () => Promise<void>;
  assignLead: (payload: {
    name: string;
    website: string;
    assignedTo: string;
    pipelineStage: string;
    priority: string;
    dueDate: string;
    managerNotes: string;
  }) => Promise<boolean>;
  updatePipeline: (payload: {
    name: string;
    website: string;
    pipelineStage: string;
    priority: string;
    managerNotes: string;
  }) => Promise<boolean>;
  setSelectedLead: (lead: Lead | null) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  setSort: (key: string) => void;
  updateLeadInStore: (name: string, website: string, updates: Partial<Lead>) => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  isLoading: false,
  error: null,
  selectedLead: null,
  filters: {
    pipelineStage: "",
    assignedTo: "",
    priority: "",
    search: "",
  },
  sortConfig: {
    key: "Created At",
    direction: "desc",
  },

  fetchLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await leadsService.listLeads();
      if (result.success) {
        set({ leads: result.leads as Lead[], isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch leads", isLoading: false });
      }
    } catch {
      set({ error: "Network error", isLoading: false });
    }
  },

  assignLead: async (payload) => {
    try {
      const result = await leadsService.assignLead(payload);
      if (result.success) {
        get().updateLeadInStore(payload.name, payload.website, {
          "Assigned To": payload.assignedTo,
          "Pipeline Stage": payload.pipelineStage,
          Priority: payload.priority,
          "Due Date": payload.dueDate,
          "Manager Notes": payload.managerNotes,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updatePipeline: async (payload) => {
    try {
      const result = await leadsService.updatePipeline(payload);
      if (result.success) {
        get().updateLeadInStore(payload.name, payload.website, {
          "Pipeline Stage": payload.pipelineStage,
          Priority: payload.priority,
          "Manager Notes": payload.managerNotes,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setSelectedLead: (lead) => set({ selectedLead: lead }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () =>
    set({
      filters: { pipelineStage: "", assignedTo: "", priority: "", search: "" },
    }),

  setSort: (key) =>
    set((state) => ({
      sortConfig: {
        key,
        direction:
          state.sortConfig.key === key && state.sortConfig.direction === "asc"
            ? "desc"
            : "asc",
      },
    })),

  updateLeadInStore: (name, website, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.name === name && lead.website === website
          ? { ...lead, ...updates }
          : lead
      ),
      selectedLead:
        state.selectedLead?.name === name && state.selectedLead?.website === website
          ? { ...state.selectedLead, ...updates }
          : state.selectedLead,
    })),
}));
