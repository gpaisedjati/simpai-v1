import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const GSHEETS_URL = process.env.GSHEETS_WEBAPP_URL;
const GSHEETS_KEY = process.env.GSHEETS_SECRET_KEY || "simpai_secret";

// ── HEALTH ───────────────────────────────────────────────────────────
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── AUTH HELPERS ─────────────────────────────────────────────────────
const DEMO_USERS = {
  admin:    { password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
  ridwan:   { password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
  demoguru: { password: "demo",        kuotaMaks: 50,  kuotaTerpakai: 10, status: "Aktif" },
};

async function getUserFromSheets(username) {
  const n = username.trim().toLowerCase();
  if (n === "admin" || n === "ridwan") {
    const u = DEMO_USERS[n];
    if (u) return { username: n, ...u };
  }
  if (GSHEETS_URL) {
    try {
      const url = `${GSHEETS_URL}?action=getUser&username=${encodeURIComponent(username)}&key=${GSHEETS_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data) return data;
      }
    } catch { /* fall through */ }
  }
  const u = DEMO_USERS[n];
  return u ? { username: n, ...u } : null;
}

async function incrementQuota(username) {
  const n = username.trim().toLowerCase();
  if (n === "admin" || n === "ridwan") { if (DEMO_USERS[n]) DEMO_USERS[n].kuotaTerpakai++; return; }
  if (DEMO_USERS[n] && !GSHEETS_URL) { DEMO_USERS[n].kuotaTerpakai++; return; }
  if (!GSHEETS_URL) return;
  try {
    await fetch(GSHEETS_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "incrementQuota", username, key: GSHEETS_KEY }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* best effort */ }
}

// ── AUTH ROUTES ──────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.status(400).json({ error: "Username dan password wajib diisi." }); return; }
  const user = await getUserFromSheets(username.trim().toLowerCase());
  if (!user) { res.status(401).json({ error: "Username tidak ditemukan." }); return; }
  if (user.status !== "Aktif") { res.status(403).json({ error: "Akun Anda tidak aktif. Hubungi administrator." }); return; }
  if (user.password !== password) { res.status(401).json({ error: "Password salah." }); return; }
  res.json({ success: true, username: user.username, kuotaSisa: Math.max(0, user.kuotaMaks - user.kuotaTerpakai), kuotaMaks: user.kuotaMaks });
});

app.get("/api/auth/quota", async (req, res) => {
  const username = req.query.username;
  if (!username) { res.status(400).json({ error: "Username wajib diisi." }); return; }
  const user = await getUserFromSheets(username.trim().toLowerCase());
  if (!user) { res.status(404).json({ error: "User tidak ditemukan." }); return; }
  res.json({ username: user.username, kuotaSisa: Math.max(0, user.kuotaMaks - user.kuotaTerpakai), kuotaMaks: user.kuotaMaks });
});

app.post("/api/auth/use-quota", async (req, res) => {
  const { username } = req.body;
  if (!username) { res.status(400).json({ error: "Username wajib diisi." }); return; }
  const user = await getUserFromSheets(username.trim().toLowerCase());
  if (!user) { res.status(404).json({ error: "User tidak ditemukan." }); return; }
  if (user.kuotaTerpakai >= user.kuotaMaks) { res.status(403).json({ error: "Kuota generate AI Anda sudah habis. Hubungi administrator untuk penambahan kuota." }); return; }
  await incrementQuota(username.trim().toLowerCase());
  res.json({ success: true, kuotaSisa: Math.max(0, user.kuotaMaks - user.kuotaTerpakai - 1), kuotaMaks: user.kuotaMaks });
});

app.get("/api/auth/gsheets-status", (_req, res) => {
  res.json({ connected: !!GSHEETS_URL });
});

// ── ADMIN HELPERS ─────────────────────────────────────────────────────
async function callSheets(params) {
  if (!GSHEETS_URL) return null;
  try {
    const qs = new URLSearchParams({ ...params, key: GSHEETS_KEY }).toString();
    const res = await fetch(`${GSHEETS_URL}?${qs}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function postSheets(body) {
  if (!GSHEETS_URL) return null;
  try {
    const res = await fetch(GSHEETS_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, key: GSHEETS_KEY }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function isAdmin(req) {
  const u = ((req.body?.adminUser || req.query?.adminUser) ?? "").toString().toLowerCase();
  return u === "admin" || u === "ridwan";
}

// ── ADMIN ROUTES ──────────────────────────────────────────────────────
app.get("/api/admin/users", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const superadmins = [
    { username: "ridwan", password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
    { username: "admin",  password: "javir.sabil", kuotaMaks: 999, kuotaTerpakai: 0, status: "Aktif" },
  ];
  if (!GSHEETS_URL) { res.json({ users: superadmins, source: "demo" }); return; }
  const data = await callSheets({ action: "getAllUsers" });
  if (!data) { res.status(502).json({ error: "Gagal mengambil data dari Google Sheets." }); return; }
  const filtered = (data.users || []).filter(u => u.username !== "admin" && u.username !== "ridwan");
  res.json({ users: [...superadmins, ...filtered], source: "gsheets" });
});

app.post("/api/admin/users", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const { username, password, kuotaMaks, status } = req.body;
  if (!username || !password) { res.status(400).json({ error: "Username dan password wajib diisi." }); return; }
  const target = username.trim().toLowerCase();
  if (target === "admin" || target === "ridwan") { res.status(400).json({ error: "Username ini dicadangkan." }); return; }
  if (!GSHEETS_URL) { res.status(400).json({ error: "Google Sheets belum terhubung." }); return; }
  const result = await postSheets({ action: "addUser", username: target, password, kuotaMaks: kuotaMaks ?? 50, status: status ?? "Aktif" });
  if (!result?.success) { res.status(500).json({ error: result?.error || "Gagal menambah user." }); return; }
  res.json({ success: true });
});

app.patch("/api/admin/users/:username", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const target = req.params.username.toLowerCase();
  if (target === "admin" || target === "ridwan") { res.status(400).json({ error: "Akun Superadmin tidak dapat diubah." }); return; }
  if (!GSHEETS_URL) { res.status(400).json({ error: "Google Sheets belum terhubung." }); return; }
  const { password, kuotaMaks, kuotaTerpakai, status } = req.body;
  const result = await postSheets({ action: "updateUser", username: target, ...(password !== undefined && { password }), ...(kuotaMaks !== undefined && { kuotaMaks }), ...(kuotaTerpakai !== undefined && { kuotaTerpakai }), ...(status !== undefined && { status }) });
  if (!result?.success) { res.status(500).json({ error: result?.error || "Gagal update user." }); return; }
  res.json({ success: true });
});

app.delete("/api/admin/users/:username", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const target = req.params.username.toLowerCase();
  if (target === "admin" || target === "ridwan") { res.status(400).json({ error: "Akun Superadmin tidak dapat dihapus." }); return; }
  if (!GSHEETS_URL) { res.status(400).json({ error: "Google Sheets belum terhubung." }); return; }
  const result = await postSheets({ action: "deleteUser", username: target });
  if (!result?.success) { res.status(500).json({ error: result?.error || "Gagal hapus user." }); return; }
  res.json({ success: true });
});

app.post("/api/admin/cp-tp", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const { data } = req.body;
  if (!data || !Array.isArray(data)) { res.status(400).json({ error: "Data CP TP tidak valid." }); return; }
  if (!GSHEETS_URL) { res.json({ success: true, message: "Demo mode." }); return; }
  const result = await postSheets({ action: "updateCPTP", data });
  if (!result?.success) { res.status(500).json({ error: result?.error || "Gagal menyimpan CP TP." }); return; }
  res.json({ success: true });
});

app.get("/api/admin/cp-tp", async (_req, res) => {
  if (!GSHEETS_URL) { res.json({ data: [] }); return; }
  const data = await postSheets({ action: "getCPTP" });
  if (!data) { res.status(502).json({ error: "Gagal mengambil data CP TP." }); return; }
  res.json({ data: data.data || [] });
});

app.get("/api/admin/kaldik", async (_req, res) => {
  if (!GSHEETS_URL) { res.json({ data: [] }); return; }
  const data = await postSheets({ action: "getKaldik" });
  if (!data) { res.status(502).json({ error: "Gagal mengambil Kaldik." }); return; }
  res.json({ data: data.data || [] });
});

app.post("/api/admin/kaldik", async (req, res) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Akses ditolak." }); return; }
  const { data } = req.body;
  if (!data || !Array.isArray(data)) { res.status(400).json({ error: "Data Kaldik tidak valid." }); return; }
  if (!GSHEETS_URL) { res.json({ success: true, message: "Demo mode." }); return; }
  const result = await postSheets({ action: "updateKaldik", data });
  if (!result?.success) { res.status(500).json({ error: result?.error || "Gagal menyimpan Kaldik." }); return; }
  res.json({ success: true });
});

// ── AI ROUTES ─────────────────────────────────────────────────────────
const MODELS = [
  "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite",
  "gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-flash", "gemini-1.5-pro",
];

async function generateWithRetry(prompt, clientKey) {
  const key = (clientKey || process.env.GEMINI_API_KEY || "").trim();
  if (!key) throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  const genai = new GoogleGenAI({ apiKey: key });
  let lastError = null;
  for (const model of MODELS) {
    try {
      const response = await genai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens: 8192 } });
      return response.text ?? "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("404") || msg.includes("NOT_FOUND");
      if (retryable) { lastError = err; continue; }
      throw err;
    }
  }
  throw new Error(`Semua model AI sedang penuh. Coba lagi dalam beberapa menit. (${lastError?.message ?? ""})`);
}

app.post("/api/ai/generate", async (req, res) => {
  try {
    const { prompt, clientKey } = req.body;
    if (!prompt) { res.status(400).json({ error: "Prompt wajib diisi." }); return; }
    const result = await generateWithRetry(prompt, clientKey);
    res.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada AI.";
    res.status(500).json({ error: msg });
  }
});

export default app;
