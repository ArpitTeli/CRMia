import { Lead, LeadsResponse } from "@shared/types";

export async function listLeads(): Promise<LeadsResponse> {
  const result = await window.api.leads.list();
  return result as LeadsResponse;
}

export async function assignLead(payload: {
  name: string;
  website: string;
  assignedTo: string;
  pipelineStage: string;
  priority: string;
  dueDate: string;
  managerNotes: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.leads.assign(payload);
  return result as { success: boolean; error?: string };
}

export async function updatePipeline(payload: {
  name: string;
  website: string;
  pipelineStage: string;
  priority: string;
  managerNotes: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.leads.updatePipeline(payload);
  return result as { success: boolean; error?: string };
}
