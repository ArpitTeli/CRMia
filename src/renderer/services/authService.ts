import { LoginResponse } from "@shared/types";

export async function login(uid: string, password: string): Promise<LoginResponse> {
  const result = await window.api.auth.login(uid, password);
  return result as LoginResponse;
}
