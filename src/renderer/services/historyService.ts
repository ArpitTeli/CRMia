import { HistoryEntry, HistoryResponse } from "@shared/types";

export async function getHistory(
  leadName: string,
  leadWebsite: string
): Promise<HistoryResponse> {
  const result = await window.api.history.get(leadName, leadWebsite);
  return result as HistoryResponse;
}

export async function logHistory(payload: {
  timestamp: string;
  userUid: string;
  userName: string;
  actionType: string;
  leadName: string;
  leadWebsite: string;
  oldValue: string;
  newValue: string;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.history.log(payload);
  return result as { success: boolean; error?: string };
}
