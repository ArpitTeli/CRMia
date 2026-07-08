import { Developer, DevelopersResponse } from "@shared/types";

export async function listDevelopers(): Promise<DevelopersResponse> {
  const result = await window.api.developers.list();
  return result as DevelopersResponse;
}

export async function addDeveloper(payload: {
  uid: string;
  name: string;
  specialization: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.developers.add(payload);
  return result as { success: boolean; error?: string };
}

export async function updateDeveloper(payload: {
  uid: string;
  name?: string;
  specialization?: string;
  email?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.developers.update(payload);
  return result as { success: boolean; error?: string };
}

export async function removeDeveloper(uid: string): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.developers.remove(uid);
  return result as { success: boolean; error?: string };
}
