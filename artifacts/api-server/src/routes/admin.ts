import { Router } from "express";

const router = Router();

const GSHEETS_URL = process.env.GSHEETS_WEBAPP_URL;
const GSHEETS_KEY = process.env.GSHEETS_SECRET_KEY || "simpai_secret";

type UserRow = {
  username: string;
  password: string;
  kuotaMaks: number;
  kuotaTerpakai: number;
  status: string;
};

async function callSheets<T>(params: Record<string, string>): Promise<T | null> {
  if (!GSHEETS_URL) return null;
  try {
    const qs = new URLSearchParams({ ...params, key: GSHEETS_KEY }).toString();
    const res = await fetch(`${GSHEETS_URL}?${qs}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function postSheets<T>(body: Record<string, unknown>): Promise<T | null> {
  if (!GSHEETS_URL) return null;
  try {
    const res = await fetch(GSHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, key: GSHEETS_KEY }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function requireAdmin(req: { body: { adminUser?: string }; query: { adminUser?: string } }, res: { status: (c: number) => { json: (d: unknown) => void } }, next: () => void) {
  const adminUser = (req.body?.adminUser || req.query?.adminUser || "").toString().toLowerCase();
  if (adminUser !== "admin" && adminUser !== "ridwan") {
    res.status(403).json({ error: "Akses ditolak. Hanya admin yang bisa mengakses fitur ini." });
    return;
  }
  next();
}

// GET /api/admin/users?adminUser=admin
router.get("/users", requireAdmin, async (_req, res) => {
  const superadmins = [
    { username: "ridwan", password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
    { username: "admin", password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" }
  ];

  if (!GSHEETS_URL) {
    res.json({
      users: superadmins,
      source: "demo"
    });
    return;
  }
  const data = await callSheets<{ users: UserRow[] }>({ action: "getAllUsers" });
  if (!data) {
    res.status(502).json({ error: "Gagal mengambil data dari Google Sheets. Pastikan Apps Script sudah diperbarui." });
    return;
  }
  const rawUsers = data.users || [];
  const filteredRaw = rawUsers.filter(u => u.username !== "admin" && u.username !== "ridwan");
  res.json({ users: [...superadmins, ...filteredRaw], source: "gsheets" });
});

// POST /api/admin/users
router.post("/users", requireAdmin, async (req, res) => {
  const { username, password, kuotaMaks, status } = req.body as { username?: string; password?: string; kuotaMaks?: number; status?: string; adminUser?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi." });
    return;
  }
  const target = username.trim().toLowerCase();
  if (target === "admin" || target === "ridwan") {
    res.status(400).json({ error: "Username ini dicadangkan untuk Superadmin dan tidak dapat diduplikasi." });
    return;
  }
  if (!GSHEETS_URL) {
    res.status(400).json({ error: "Google Sheets belum terhubung." });
    return;
  }
  const result = await postSheets<{ success: boolean; error?: string }>({
    action: "addUser",
    username: target,
    password,
    kuotaMaks: kuotaMaks ?? 50,
    status: status ?? "Aktif",
  });
  if (!result?.success) {
    res.status(500).json({ error: result?.error || "Gagal menambah user ke Google Sheets." });
    return;
  }
  res.json({ success: true });
});

// PATCH /api/admin/users/:username
router.patch("/users/:username", requireAdmin, async (req, res) => {
  const { username } = req.params;
  const target = username.toLowerCase();
  if (target === "admin" || target === "ridwan") {
    res.status(400).json({ error: "Akun Superadmin tidak dapat diubah karena tertanam di kode program." });
    return;
  }
  const { password, kuotaMaks, kuotaTerpakai, status } = req.body as { password?: string; kuotaMaks?: number; kuotaTerpakai?: number; status?: string; adminUser?: string };
  if (!GSHEETS_URL) {
    res.status(400).json({ error: "Google Sheets belum terhubung." });
    return;
  }
  const result = await postSheets<{ success: boolean; error?: string }>({
    action: "updateUser",
    username: target,
    ...(password !== undefined && { password }),
    ...(kuotaMaks !== undefined && { kuotaMaks }),
    ...(kuotaTerpakai !== undefined && { kuotaTerpakai }),
    ...(status !== undefined && { status }),
  });
  if (!result?.success) {
    res.status(500).json({ error: result?.error || "Gagal update user di Google Sheets." });
    return;
  }
  res.json({ success: true });
});

// DELETE /api/admin/users/:username
router.delete("/users/:username", requireAdmin, async (req, res) => {
  const { username } = req.params;
  const target = username.toLowerCase();
  if (target === "admin" || target === "ridwan") {
    res.status(400).json({ error: "Akun Superadmin tidak dapat dihapus." });
    return;
  }
  if (!GSHEETS_URL) {
    res.status(400).json({ error: "Google Sheets belum terhubung." });
    return;
  }
  const result = await postSheets<{ success: boolean; error?: string }>({
    action: "deleteUser",
    username: target,
  });
  if (!result?.success) {
    res.status(500).json({ error: result?.error || "Gagal hapus user dari Google Sheets." });
    return;
  }
  res.json({ success: true });
});

// POST /api/admin/cp-tp
router.post("/cp-tp", requireAdmin, async (req, res) => {
  const { data } = req.body as { adminUser?: string; data?: any[] };
  
  if (!data || !Array.isArray(data)) {
    res.status(400).json({ error: "Data CP TP tidak valid." });
    return;
  }
  
  if (!GSHEETS_URL) {
    // If running in demo mode, pretend it's successful
    res.json({ success: true, message: "Demo mode: Data CP TP tersimpan secara lokal." });
    return;
  }
  
  const result = await postSheets<{ success: boolean; error?: string }>({
    action: "updateCPTP",
    data: data,
  });
  
  if (!result?.success) {
    res.status(500).json({ error: result?.error || "Gagal menyimpan data CP TP ke Google Sheets." });
    return;
  }
  
  res.json({ success: true });
});

// GET /api/admin/cp-tp
router.get("/cp-tp", async (req, res) => {
  if (!GSHEETS_URL) {
    res.json({ data: [] });
    return;
  }
  const data = await postSheets<{ data: any[] }>({ action: "getCPTP" });
  if (!data) {
    res.status(502).json({ error: "Gagal mengambil data CP TP dari Google Sheets." });
    return;
  }
  res.json({ data: data.data || [] });
});

// GET /api/admin/kaldik
router.get("/kaldik", async (req, res) => {
  if (!GSHEETS_URL) {
    res.json({ data: [] });
    return;
  }
  const data = await postSheets<{ data: any[] }>({ action: "getKaldik" });
  if (!data) {
    res.status(502).json({ error: "Gagal mengambil Kaldik dari Google Sheets." });
    return;
  }
  res.json({ data: data.data || [] });
});

// POST /api/admin/kaldik
router.post("/kaldik", requireAdmin, async (req, res) => {
  const { data } = req.body as { adminUser?: string; data?: any[] };
  
  if (!data || !Array.isArray(data)) {
    res.status(400).json({ error: "Data Kaldik tidak valid." });
    return;
  }
  
  if (!GSHEETS_URL) {
    res.json({ success: true, message: "Demo mode: Data Kaldik tersimpan secara lokal." });
    return;
  }
  
  const result = await postSheets<{ success: boolean; error?: string }>({
    action: "updateKaldik",
    data: data,
  });
  
  if (!result?.success) {
    res.status(500).json({ error: result?.error || "Gagal menyimpan data Kaldik ke Google Sheets." });
    return;
  }
  
  res.json({ success: true });
});

export { router as adminRouter };
