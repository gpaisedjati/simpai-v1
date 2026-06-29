import { Router } from "express";

const router = Router();

// Google Sheets Apps Script integration
// If GSHEETS_WEBAPP_URL is not set, uses demo/fallback mode
const GSHEETS_URL = process.env.GSHEETS_WEBAPP_URL;
const GSHEETS_KEY = process.env.GSHEETS_SECRET_KEY || "simpai_secret";

// Demo users when Google Sheets not connected yet
const DEMO_USERS: Record<string, { password: string; kuotaMaks: number; kuotaTerpakai: number; status: string }> = {
  admin: { password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
  ridwan: { password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
  demoguru: { password: "demo", kuotaMaks: 50, kuotaTerpakai: 10, status: "Aktif" },
};

async function getUserFromSheets(username: string): Promise<{ username: string; password: string; kuotaMaks: number; kuotaTerpakai: number; status: string } | null> {
  const normalized = username.trim().toLowerCase();

  // Admin and ridwan are hardcoded superadmins, never checked or stored in Google Sheets
  if (normalized === "admin" || normalized === "ridwan") {
    const u = DEMO_USERS[normalized];
    if (u) return { username: normalized, ...u };
  }

  // Always try GSheets first if URL is set
  if (GSHEETS_URL) {
    try {
      const url = `${GSHEETS_URL}?action=getUser&username=${encodeURIComponent(username)}&key=${GSHEETS_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json() as { username: string; password: string; kuotaMaks: number; kuotaTerpakai: number; status: string } | null;
        if (data) return data;
      }
    } catch { /* fall through to demo */ }
  }
  // Fallback to demo users
  const u = DEMO_USERS[normalized];
  if (!u) return null;
  return { username: normalized, ...u };
}

async function incrementQuotaInSheets(username: string): Promise<void> {
  const normalized = username.trim().toLowerCase();
  if (normalized === "admin" || normalized === "ridwan") {
    if (DEMO_USERS[normalized]) {
      DEMO_USERS[normalized].kuotaTerpakai++;
    }
    return;
  }
  if (DEMO_USERS[normalized] && !GSHEETS_URL) {
    DEMO_USERS[normalized].kuotaTerpakai++;
    return;
  }
  if (!GSHEETS_URL) return;
  try {
    await fetch(GSHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "incrementQuota", username, key: GSHEETS_KEY }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // best effort
  }
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi." });
    return;
  }

  const user = await getUserFromSheets(username.trim().toLowerCase());

  if (!user) {
    res.status(401).json({ error: "Username tidak ditemukan." });
    return;
  }
  if (user.status !== "Aktif") {
    res.status(403).json({ error: "Akun Anda tidak aktif. Hubungi administrator." });
    return;
  }
  
  if (user.password !== password) {
    res.status(401).json({ error: "Password salah." });
    return;
  }

  const kuotaSisa = Math.max(0, user.kuotaMaks - user.kuotaTerpakai);
  res.json({
    success: true,
    username: user.username,
    kuotaSisa,
    kuotaMaks: user.kuotaMaks,
  });
});

// GET /api/auth/quota?username=X
router.get("/quota", async (req, res) => {
  const { username } = req.query as { username?: string };
  if (!username) {
    res.status(400).json({ error: "Username wajib diisi." });
    return;
  }

  const user = await getUserFromSheets(username.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }

  const kuotaSisa = Math.max(0, user.kuotaMaks - user.kuotaTerpakai);
  res.json({ username: user.username, kuotaSisa, kuotaMaks: user.kuotaMaks });
});

// POST /api/auth/use-quota
router.post("/use-quota", async (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) {
    res.status(400).json({ error: "Username wajib diisi." });
    return;
  }
  const user = await getUserFromSheets(username.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }
  if (user.kuotaTerpakai >= user.kuotaMaks) {
    res.status(403).json({ error: "Kuota generate AI Anda sudah habis. Hubungi administrator untuk penambahan kuota." });
    return;
  }
  await incrementQuotaInSheets(username.trim().toLowerCase());
  const kuotaSisa = Math.max(0, user.kuotaMaks - user.kuotaTerpakai - 1);
  res.json({ success: true, kuotaSisa, kuotaMaks: user.kuotaMaks });
});

// GET /api/auth/gsheets-status
router.get("/gsheets-status", (_req, res) => {
  res.json({ connected: !!GSHEETS_URL });
});

export { router as authRouter, getUserFromSheets, incrementQuotaInSheets };
