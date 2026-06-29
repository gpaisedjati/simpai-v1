const BASE = "/api";

export interface UserSession {
  username: string;
  kuotaSisa: number;
  kuotaMaks: number;
}

export async function apiLogin(username: string, password: string): Promise<UserSession> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
  });
  const data = await res.json() as { error?: string; username?: string; kuotaSisa?: number; kuotaMaks?: number };
  if (!res.ok) throw new Error(data.error || "Login gagal.");
  return { username: data.username!, kuotaSisa: data.kuotaSisa!, kuotaMaks: data.kuotaMaks! };
}

export async function apiGetQuota(username: string): Promise<{ kuotaSisa: number; kuotaMaks: number }> {
  const res = await fetch(`${BASE}/auth/quota?username=${encodeURIComponent(username)}`);
  const data = await res.json() as { error?: string; kuotaSisa?: number; kuotaMaks?: number };
  if (!res.ok) throw new Error(data.error || "Gagal cek kuota.");
  return { kuotaSisa: data.kuotaSisa!, kuotaMaks: data.kuotaMaks! };
}

export async function apiGenerate(
  username: string,
  tipe: string,
  params: Record<string, string>
): Promise<{ hasil: string; kuotaSisa: number; kuotaMaks: number }> {
  const customApiKey = localStorage.getItem("simpai_api_key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (customApiKey) headers["X-Gemini-API-Key"] = customApiKey;

  const res = await fetch(`${BASE}/ai/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ username, tipe, params }),
  });
  const data = await res.json() as { error?: string; hasil?: string; kuotaSisa?: number; kuotaMaks?: number };
  if (!res.ok) throw new Error(data.error || "Generate gagal.");
  return { hasil: data.hasil!, kuotaSisa: data.kuotaSisa!, kuotaMaks: data.kuotaMaks! };
}

export async function apiUseQuota(username: string): Promise<{ kuotaSisa: number; kuotaMaks: number }> {
  const res = await fetch(`${BASE}/auth/use-quota`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json() as { error?: string; kuotaSisa?: number; kuotaMaks?: number };
  if (!res.ok) throw new Error(data.error || "Gagal memotong kuota.");
  return { kuotaSisa: data.kuotaSisa!, kuotaMaks: data.kuotaMaks! };
}

export async function apiGsheetsStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/gsheets-status`);
    const data = await res.json() as { connected?: boolean };
    return !!data.connected;
  } catch {
    return false;
  }
}
