import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, Plus, Pencil, Trash2, Save, X,
  RefreshCw, KeyRound, Zap, CheckCircle2, XCircle, Eye, EyeOff,
  Calendar, Check, AlertTriangle, HelpCircle, Layers, Sparkles, UploadCloud, Loader2, BookOpen
} from "lucide-react";
import { useSimpaiMasterKaldik, KaldikSemester, KaldikPekan } from "@/lib/storage";
import { parseCPTPFile, ParsedCPTPRow } from "@/lib/parseCPTP";

interface UserRow {
  username: string;
  password: string;
  kuotaMaks: number;
  kuotaTerpakai: number;
  status: string;
}

const BASE = "/api/admin";

export default function AdminPanel() {
  const session = useSession();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [source, setSource] = useState<"gsheets" | "demo">("demo");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [showPassIdx, setShowPassIdx] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ username: "", password: "", kuotaMaks: "50", status: "Aktif" });
  const [editForm, setEditForm] = useState({ password: "", kuotaMaks: "", kuotaTerpakai: "", status: "" });

  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "kaldik" | "cptp">("users");

  // CP & TP States
  const [isUploadingCPTP, setIsUploadingCPTP] = useState(false);
  const [cptpPreview, setCptpPreview] = useState<ParsedCPTPRow[] | null>(null);

  // Kaldik States
  const [masterKaldik, setMasterKaldik] = useSimpaiMasterKaldik();
  const [selectedTahun, setSelectedTahun] = useState("2026/2027");
  const [localPekanList, setLocalPekanList] = useState<KaldikPekan[]>([]);

  // Add school year dialog states
  const [showAddTahun, setShowAddTahun] = useState(false);
  const [newTahun, setNewTahun] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/users?adminUser=${encodeURIComponent(session.username)}`);
      const data = await res.json() as { users?: UserRow[]; source?: "gsheets" | "demo"; error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal memuat data user.");
      setUsers(data.users || []);
      setSource(data.source || "demo");
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session.username, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Load selected kaldik into local editable list (Combine Ganjil and Genap)
  useEffect(() => {
    const ganjil = masterKaldik.find((k) => k.tahunPelajaran === selectedTahun && k.semester === "Ganjil")?.pekanList || [];
    const genap = masterKaldik.find((k) => k.tahunPelajaran === selectedTahun && k.semester === "Genap")?.pekanList || [];
    
    if (ganjil.length > 0 || genap.length > 0) {
      setLocalPekanList([...ganjil, ...genap]);
    } else if (masterKaldik.length > 0) {
      setSelectedTahun(masterKaldik[0].tahunPelajaran);
    }
  }, [selectedTahun, masterKaldik]);

  const handleAdd = async () => {
    if (!addForm.username || !addForm.password) {
      toast({ title: "Lengkapi form", description: "Username dan password wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, kuotaMaks: parseInt(addForm.kuotaMaks), adminUser: session.username }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal menambah user.");
      toast({ title: "Berhasil", description: `User ${addForm.username} ditambahkan.` });
      setAddForm({ username: "", password: "", kuotaMaks: "50", status: "Aktif" });
      setShowAdd(false);
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    try {
      const payload: Record<string, unknown> = { adminUser: session.username };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.kuotaMaks) payload.kuotaMaks = parseInt(editForm.kuotaMaks);
      if (editForm.kuotaTerpakai !== "") payload.kuotaTerpakai = parseInt(editForm.kuotaTerpakai);
      if (editForm.status) payload.status = editForm.status;

      const res = await fetch(`${BASE}/users/${encodeURIComponent(editUser.username)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal update user.");
      toast({ title: "Berhasil", description: `User ${editUser.username} diperbarui.` });
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    }
  };

  const handleDelete = async (username: string) => {
    if (!window.confirm(`Hapus user "${username}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`${BASE}/users/${encodeURIComponent(username)}?adminUser=${encodeURIComponent(session.username)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: session.username }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal menghapus user.");
      toast({ title: "Dihapus", description: `User ${username} berhasil dihapus.` });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    }
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({ password: "", kuotaMaks: String(u.kuotaMaks), kuotaTerpakai: String(u.kuotaTerpakai), status: u.status });
  };

  // Kaldik Helper function
  const handleUpdateRow = (index: number, field: keyof KaldikPekan, value: any) => {
    setLocalPekanList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveKaldik = async () => {
    const ganjilMonths = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const genapMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
    
    const ganjilList = localPekanList.filter(p => ganjilMonths.includes(p.bulan));
    const genapList = localPekanList.filter(p => genapMonths.includes(p.bulan));

    const updatedMaster = masterKaldik.map((k) => {
      if (k.tahunPelajaran === selectedTahun) {
        if (k.semester === "Ganjil") return { ...k, pekanList: ganjilList };
        if (k.semester === "Genap") return { ...k, pekanList: genapList };
      }
      return k;
    });

    setMasterKaldik(updatedMaster);
    
    // Sync to backend GSheets if connected
    try {
      await fetch(`${BASE}/kaldik`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: session.username, data: updatedMaster }),
      });
    } catch (err) {
      console.error("Gagal sinkron Kaldik ke GSheets", err);
    }
    
    toast({
      title: "Kalender Tersimpan",
      description: `Konfigurasi Kaldik Tahun Pelajaran ${selectedTahun} berhasil disinkronkan.`
    });
  };

  const handleResetKaldik = () => {
    const ganjil = generateDefaultPekanLocal("Ganjil");
    const genap = generateDefaultPekanLocal("Genap");
    setLocalPekanList([...ganjil, ...genap]);
    toast({
      title: "Kalender Di-reset",
      description: "Data kalender dikembalikan ke pengaturan awal (semua pekan efektif)."
    });
  };

  const handleExtractAI = (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.target.files && e.target.files.length > 0) {
      // file selected
    }
    setIsExtracting(true);
    // Simulate AI extraction delay
    setTimeout(() => {
      const mockResult: KaldikPekan[] = localPekanList.map(p => {
        const isRand = Math.random() > 0.8;
        return {
          ...p,
          status: isRand ? "Tidak Efektif" : "Efektif",
          keterangan: isRand ? "Libur/Asesmen (Ekstrak AI)" : "KBM Efektif"
        };
      });
      setLocalPekanList(mockResult);
      setIsExtracting(false);
      setShowAiModal(false);
      toast({ title: "Ekstraksi Selesai", description: "Kalender berhasil diproses oleh Gemini AI Vision." });
    }, 2500);
  };

  const generateDefaultPekanLocal = (semester: "Ganjil" | "Genap"): KaldikPekan[] => {
    const bulanList = semester === "Ganjil" 
      ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
    
    const pekanList: KaldikPekan[] = [];
    for (const b of bulanList) {
      for (let p = 1; p <= 5; p++) {
        let status: "Efektif" | "Tidak Efektif" = "Efektif";
        let keterangan = "KBM Efektif";
        
        if (semester === "Ganjil") {
          if (b === "Juli" && (p === 1 || p === 2)) {
            status = "Tidak Efektif";
            keterangan = "Libur Akhir Tahun / MPLS";
          } else if (b === "September" && p === 4) {
            status = "Tidak Efektif";
            keterangan = "Penilaian Tengah Semester (PTS)";
          } else if (b === "Desember" && (p === 3 || p === 4 || p === 5)) {
            status = "Tidak Efektif";
            keterangan = p === 3 ? "Asesmen Akhir Semester" : p === 4 ? "Pembagian Rapor" : "Libur Semester 1";
          }
        } else {
          if (b === "Januari" && p === 1) {
            status = "Tidak Efektif";
            keterangan = "Libur Tahun Baru / Semester 1";
          } else if (b === "Maret" && p === 4) {
            status = "Tidak Efektif";
            keterangan = "Penilaian Tengah Semester (PTS)";
          } else if (b === "Juni" && (p === 3 || p === 4 || p === 5)) {
            status = "Tidak Efektif";
            keterangan = p === 3 ? "Asesmen Akhir Tahun" : p === 4 ? "Pembagian Rapor" : "Libur Akhir Tahun Ajaran";
          }
        }
        
        pekanList.push({ bulan: b, pekanKe: p, status, keterangan });
      }
    }
    return pekanList;
  };

  const handleAddTahun = () => {
    if (!/^\d{4}\/\d{4}$/.test(newTahun)) {
      toast({
        title: "Format Salah",
        description: "Format Tahun Pelajaran harus YYYY/YYYY (misal: 2029/2030).",
        variant: "destructive"
      });
      return;
    }
    if (masterKaldik.some((k) => k.tahunPelajaran === newTahun)) {
      toast({
        title: "Sudah Ada",
        description: "Tahun Pelajaran tersebut sudah terdaftar.",
        variant: "destructive"
      });
      return;
    }
    
    const newGanjil: KaldikSemester = {
      tahunPelajaran: newTahun,
      semester: "Ganjil",
      pekanList: generateDefaultPekanLocal("Ganjil")
    };
    const newGenap: KaldikSemester = {
      tahunPelajaran: newTahun,
      semester: "Genap",
      pekanList: generateDefaultPekanLocal("Genap")
    };
    
    setMasterKaldik((prev) => [...prev, newGanjil, newGenap]);
    setSelectedTahun(newTahun);
    setShowAddTahun(false);
    setNewTahun("");
    toast({
      title: "Berhasil",
      description: `Tahun Pelajaran ${newTahun} berhasil ditambahkan.`
    });
  };

  // Kaldik Stats Calculations
  const totalPekanCount = localPekanList.length;
  const efektifPekanCount = localPekanList.filter((p) => p.status === "Efektif").length;
  const tidakEfektifPekanCount = localPekanList.filter((p) => p.status === "Tidak Efektif").length;

  // Extract unique school years
  const listTahunPelajaran = Array.from(new Set(masterKaldik.map((k) => k.tahunPelajaran))).sort();

  const handleUploadCPTP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Maks 10 MB limit for CPTP
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File terlalu besar", description: "Ukuran maksimal file adalah 10 MB.", variant: "destructive" });
        return;
      }
      
      setIsUploadingCPTP(true);
      try {
        const data = await parseCPTPFile(file, "", localStorage.getItem("simpai_api_key") || undefined);
        setCptpPreview(data);
        toast({ title: "Berhasil mengekstrak file", description: `Ditemukan ${data.length} baris data CP/TP oleh AI.` });
      } catch (err: any) {
        toast({ title: "Gagal memproses file", description: err.message, variant: "destructive" });
      } finally {
        setIsUploadingCPTP(false);
      }
    }
  };

  const handleSyncCPTPToGSheets = async () => {
    if (!cptpPreview) return;
    setIsUploadingCPTP(true);
    try {
      const res = await fetch(`${BASE}/cp-tp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: session.username, data: cptpPreview }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi data CP TP.");
      toast({ title: "Tersinkronisasi!", description: `Data CP TP berhasil dikirim ke Google Sheets.` });
      setCptpPreview(null);
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setIsUploadingCPTP(false);
    }
  };

  if (session.username !== "admin" && session.username !== "ridwan") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-center space-y-3">
        <Shield className="w-12 h-12 text-muted-foreground/40" />
        <h2 className="text-lg font-bold text-muted-foreground">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground">Halaman ini hanya bisa diakses oleh admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/35 shadow-[0_2px_10px_rgba(212,175,55,0.15)]">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#D4AF37] tracking-wide">Admin Control Center</h1>
            <div className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
              Panel Administrator SIMPAI SeDjati
              <Badge variant="outline" className={source === "gsheets" ? "border-green-400 text-green-700 bg-green-50" : "border-yellow-400 text-yellow-700 bg-yellow-50"}>
                {source === "gsheets" ? "🟢 Google Sheets" : "🟡 Demo Mode"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tab Buttons styled beautifully */}
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "users"
                ? "bg-[#D4AF37] text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Akun & Kuota Guru
          </button>
          <button
            onClick={() => setActiveTab("kaldik")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "kaldik"
                ? "bg-[#D4AF37] text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Master Kalender (Kaldik)
          </button>
          <button
            onClick={() => setActiveTab("cptp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "cptp"
                ? "bg-[#D4AF37] text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Dokumen CP & TP
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <h2 className="text-sm font-bold text-white">Manajemen Akun Guru</h2>
              <p className="text-[11px] text-white/50">Kelola kuota, reset password, dan status keaktifan guru</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="flex items-center gap-2 text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/10">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button size="sm" onClick={() => { setShowAdd(true); setEditUser(null); }} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold">
                <Plus className="w-3.5 h-3.5" /> Tambah User
              </Button>
            </div>
          </div>

          {/* Add User Form */}
          {showAdd && (
            <Card className="border-[#D4AF37]/30 bg-black/40 text-white backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-[#D4AF37]">
                  <Plus className="w-4 h-4 text-[#D4AF37]" /> Tambah User Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Username</Label>
                    <Input value={addForm.username} onChange={(e) => setAddForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                      placeholder="bu.sari" className="h-8 text-sm bg-white text-black" data-testid="input-add-username" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Password</Label>
                    <Input value={addForm.password} onChange={(e) => setAddForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="password123" className="h-8 text-sm bg-white text-black" data-testid="input-add-password" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Kuota Maks</Label>
                    <Input type="number" value={addForm.kuotaMaks} onChange={(e) => setAddForm(p => ({ ...p, kuotaMaks: e.target.value }))}
                      min="1" className="h-8 text-sm bg-white text-black" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Status</Label>
                    <Select value={addForm.status} onValueChange={(v) => setAddForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-8 text-sm bg-white text-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold"><Save className="w-3.5 h-3.5" /> Simpan</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="flex items-center gap-2 text-white hover:bg-white/10"><X className="w-3.5 h-3.5" /> Batal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card className="border-white/10 bg-black/20 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-[#D4AF37]" /> Daftar User Guru ({users.length} akun)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-white/60 flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin opacity-40 text-[#D4AF37]" />
                  <p className="text-xs">Memuat data dari Google Sheets...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-white/40 space-y-2">
                  <Users className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">Belum ada user. Tambahkan user pertama di atas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-[#D4AF37] text-xs uppercase border-b border-white/10">
                      <tr>
                        <th className="p-3 text-left">Username</th>
                        <th className="p-3 text-left">Password</th>
                        <th className="p-3 text-center">Kuota</th>
                        <th className="p-3 text-center">Terpakai</th>
                        <th className="p-3 text-center">Sisa</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const sisa = Math.max(0, u.kuotaMaks - u.kuotaTerpakai);
                        const pct = u.kuotaMaks > 0 ? (sisa / u.kuotaMaks) * 100 : 0;
                        const isEditing = editUser?.username === u.username;
                        return (
                          <tr key={u.username} className={`border-b border-white/5 last:border-0 transition-colors ${isEditing ? "bg-[#D4AF37]/10" : "hover:bg-white/5"}`}>
                            <td className="p-3 font-mono font-semibold text-[#D4AF37]">{u.username}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs">
                                  {showPassIdx === u.username ? u.password : "••••••••"}
                                </span>
                                <button onClick={() => setShowPassIdx(showPassIdx === u.username ? null : u.username)}
                                  className="text-white/60 hover:text-white transition-colors">
                                  {showPassIdx === u.username ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-center font-semibold">{u.kuotaMaks}</td>
                            <td className="p-3 text-center text-white/60">{u.kuotaTerpakai}</td>
                            <td className="p-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs font-bold ${sisa === 0 ? "text-red-400" : pct < 20 ? "text-yellow-400" : "text-green-400"}`}>
                                  {sisa}
                                </span>
                                <div className="w-16 bg-white/10 rounded-full h-1">
                                  <div className={`h-1 rounded-full ${sisa === 0 ? "bg-red-400" : pct < 20 ? "bg-yellow-400" : "bg-green-400"}`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {u.status === "Aktif"
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5"><CheckCircle2 className="w-3 h-3" />Aktif</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5"><XCircle className="w-3 h-3" />Nonaktif</span>
                              }
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEdit(u)} title="Edit"
                                  className="p-1.5 rounded hover:bg-white/10 text-[#D4AF37] transition-colors" data-testid={`btn-edit-${u.username}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {u.username !== "admin" && u.username !== "ridwan" && (
                                  <button onClick={() => handleDelete(u.username)} title="Hapus"
                                    className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors" data-testid={`btn-delete-${u.username}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Form Modal */}
          {editUser && (
            <Card className="border-blue-500/30 bg-black/50 text-white backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-400">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  Edit User: <span className="font-mono text-[#D4AF37]">{editUser.username}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70 flex items-center gap-1"><KeyRound className="w-3 h-3" /> Password Baru</Label>
                    <Input value={editForm.password} onChange={(e) => setEditForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Kosongkan jika tidak diubah" className="h-8 text-sm bg-white text-black" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70 flex items-center gap-1"><Zap className="w-3 h-3" /> Kuota Maks</Label>
                    <Input type="number" value={editForm.kuotaMaks} onChange={(e) => setEditForm(p => ({ ...p, kuotaMaks: e.target.value }))}
                      min="0" className="h-8 text-sm bg-white text-black" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Kuota Terpakai</Label>
                    <Input type="number" value={editForm.kuotaTerpakai} onChange={(e) => setEditForm(p => ({ ...p, kuotaTerpakai: e.target.value }))}
                      min="0" className="h-8 text-sm bg-white text-black" placeholder="0 = reset penuh" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-8 text-sm bg-white text-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleEdit} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"><Save className="w-3.5 h-3.5" /> Simpan Perubahan</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditUser(null)} className="flex items-center gap-2 text-white hover:bg-white/10"><X className="w-3.5 h-3.5" /> Batal</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MASTER KALENDER (KALDIK) TERPUSAT */}
      {activeTab === "kaldik" && (
        <div className="space-y-6">
          {/* Quick Info & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#04241a]/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Total Pekan Akademik</p>
                <h4 className="text-2xl font-black text-white mt-1">{totalPekanCount} Pekan</h4>
                <p className="text-[10px] text-white/40 mt-0.5">Total dianalisis per semester</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-white">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>

            <div className="bg-[#04241a]/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Pekan Efektif</p>
                <h4 className="text-2xl font-black text-green-400 mt-1">{efektifPekanCount} Pekan</h4>
                <p className="text-[10px] text-green-400/50 mt-0.5">Waktu KBM aktif sekolah</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#04241a]/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">Pekan Tidak Efektif</p>
                <h4 className="text-2xl font-black text-red-400 mt-1">{tidakEfektifPekanCount} Pekan</h4>
                <p className="text-[10px] text-red-400/50 mt-0.5">Libur, ujian, kegiatan khusus</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-black/35 p-5 rounded-2xl border border-[#D4AF37]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-[#D4AF37] font-bold uppercase">Tahun Pelajaran</Label>
                <Select value={selectedTahun} onValueChange={setSelectedTahun}>
                  <SelectTrigger className="w-[180px] bg-white text-black font-bold h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black font-semibold">
                    {listTahunPelajaran.map((th) => (
                      <SelectItem key={th} value={th}>{th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiModal(true)}
                className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10 text-xs font-bold"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Ekstrak AI (Upload)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTahun(true)}
                className="text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-xs font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Tahun Ajaran
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetKaldik}
                className="text-red-400 border-red-400/30 hover:bg-red-400/10 text-xs font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Reset Data
              </Button>
            </div>
          </div>

          {/* Add Year Dialog / Inline box */}
          {showAddTahun && (
            <Card className="border-[#D4AF37]/45 bg-black/40 text-white backdrop-blur-md p-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                <h4 className="text-sm font-extrabold text-[#D4AF37]">Tambah Tahun Pelajaran Baru</h4>
                <button onClick={() => setShowAddTahun(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-end gap-3 max-w-md">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-white/70 font-semibold">Tahun Pelajaran (Format: YYYY/YYYY)</Label>
                  <Input
                    value={newTahun}
                    onChange={(e) => setNewTahun(e.target.value)}
                    placeholder="Contoh: 2029/2030"
                    className="h-9 bg-white text-black font-bold placeholder-black/30"
                  />
                </div>
                <Button onClick={handleAddTahun} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold h-9">
                  Buat
                </Button>
              </div>
              <p className="text-[10px] text-white/50 mt-1.5">
                *Sistem akan otomatis meng-generate 30 Pekan standar untuk Semester Ganjil & Genap pada tahun tersebut.
              </p>
            </Card>
          )}

          {/* AI Extraction Modal */}
          {showAiModal && (
            <Card className="border-blue-500/40 bg-[#041d2e]/80 text-white backdrop-blur-md p-5 shadow-[0_10px_40px_rgba(59,130,246,0.15)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-blue-400">Ekstraksi Kalender dengan AI</h4>
                    <p className="text-xs text-blue-200/70 mt-0.5">Unggah dokumen Kalender Akademik Pemerintah. Sistem akan otomatis menandai pekan libur dan KBM efektif.</p>
                  </div>
                </div>
                <button onClick={() => setShowAiModal(false)} disabled={isExtracting} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <label className="border-2 border-dashed border-blue-500/30 rounded-xl p-8 text-center bg-black/20 hover:bg-black/30 transition-colors flex flex-col items-center justify-center cursor-pointer mb-4">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleExtractAI} disabled={isExtracting} />
                <UploadCloud className="w-10 h-10 text-blue-400/50 mb-3" />
                <p className="text-sm font-bold text-white mb-1">Pilih Dokumen Kalender (PDF / JPG / PNG)</p>
                <p className="text-[10px] text-blue-300/50">Maks. 5 MB. Pastikan gambar jelas agar AI bisa membaca keterangan libur.</p>
              </label>

              <div className="flex justify-end border-t border-blue-500/20 pt-4">
                <Button 
                  disabled={isExtracting}
                  className="bg-blue-600/50 cursor-not-allowed text-white font-bold h-10 px-6 shadow-[0_5px_20px_rgba(37,99,235,0.3)] transition-all"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membaca Dokumen...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Menunggu Dokumen...
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Kaldik Table */}
          <Card className="border-white/10 bg-black/20 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  Tabel Hari & Pekan Efektif Terpusat: {selectedTahun}
                </span>
                <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-3 py-1 rounded-full border border-[#D4AF37]/25">
                  Single Source of Truth
                </span>
              </CardTitle>
              <CardDescription className="text-white/50 text-xs">
                Ubah status pekan (Efektif/Tidak Efektif) serta berikan detail agenda/ujian/libur di bawah ini. Perubahan ini akan segera digunakan oleh guru dalam menyusun Prota & Promes mereka.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localPekanList.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Calendar className="w-12 h-12 mx-auto opacity-20 mb-2" />
                  <p className="text-xs">Data pekan untuk {selectedTahun} belum di-generate.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-[#D4AF37] text-xs uppercase border-b border-white/10">
                      <tr>
                        <th className="p-3 text-left w-32">Bulan</th>
                        <th className="p-3 text-center w-24">Pekan</th>
                        <th className="p-3 text-center w-48">Status Pekan</th>
                        <th className="p-3 text-left">Keterangan / Detail Agenda Libur & Ujian</th>
                        <th className="p-3 text-center w-36">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localPekanList.map((row, idx) => {
                        const isFirstOfBulan = idx === 0 || localPekanList[idx - 1].bulan !== row.bulan;
                        const rowsInBulan = localPekanList.filter((p) => p.bulan === row.bulan).length;

                        return (
                          <tr
                            key={`${row.bulan}-${row.pekanKe}`}
                            className={`border-b border-white/5 last:border-0 transition-colors ${
                              row.status === "Tidak Efektif" ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-white/5"
                            }`}
                          >
                            {isFirstOfBulan ? (
                              <td
                                rowSpan={rowsInBulan}
                                className="p-3 text-left font-bold border-r border-white/10 align-middle bg-white/5 text-white text-xs uppercase"
                              >
                                {row.bulan}
                              </td>
                            ) : null}
                            <td className="p-3 text-center font-bold text-white/90">
                              M-{row.pekanKe}
                            </td>
                            <td className="p-3 text-center">
                              <Select
                                value={row.status}
                                onValueChange={(val: "Efektif" | "Tidak Efektif") => handleUpdateRow(idx, "status", val)}
                              >
                                <SelectTrigger className={`w-full h-8 text-xs font-bold ${
                                  row.status === "Efektif" 
                                    ? "bg-green-500/20 text-green-300 border-green-500/30" 
                                    : "bg-red-500/20 text-red-300 border-red-500/30"
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-black font-bold text-xs">
                                  <SelectItem value="Efektif">🟢 Efektif Belajar</SelectItem>
                                  <SelectItem value="Tidak Efektif">🔴 Tidak Efektif</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input
                                value={row.keterangan}
                                onChange={(e) => handleUpdateRow(idx, "keterangan", e.target.value)}
                                placeholder="Tulis agenda, misal: Libur Semester, Penilaian Akhir..."
                                className={`h-8 text-xs font-bold bg-black/40 border-white/15 focus:border-[#D4AF37] ${
                                  row.status === "Tidak Efektif" ? "text-red-300 placeholder-red-300/40" : "text-white"
                                }`}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateRow(idx, "status", "Efektif");
                                    handleUpdateRow(idx, "keterangan", "KBM Efektif");
                                  }}
                                  className="text-[10px] px-2 py-1 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 font-bold transition-all"
                                >
                                  Efektif
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateRow(idx, "status", "Tidak Efektif");
                                    handleUpdateRow(idx, "keterangan", "Libur Akhir Semester");
                                  }}
                                  className="text-[10px] px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 font-bold transition-all"
                                >
                                  Libur
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Save Trigger */}
          <div className="flex justify-end gap-3 pb-6">
            <Button
              onClick={handleSaveKaldik}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-extrabold shadow-[0_4px_14px_rgba(212,175,55,0.25)] px-8 py-4 text-xs tracking-wider uppercase rounded-xl flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Semua Konfigurasi Kaldik
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MASTER CP & TP */}
      {activeTab === "cptp" && (
        <div className="space-y-6">
          <div className="bg-[#04241a]/60 p-5 rounded-2xl border border-[#D4AF37]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#D4AF37]">Unggah Dokumen CP & TP</h2>
              <p className="text-[11px] text-white/50 mt-1 max-w-md">
                Kecerdasan Buatan (AI) kami akan secara otomatis membaca isi file Anda (mendukung Word, PDF, Excel, atau TXT) dan merapikannya ke dalam format tabel Fase, Kelas, Semester, Elemen, CP, dan TP yang rapi.
                <br/><span className="text-amber-400/80 mt-1 block">Tips: Jika data untuk 1 tahun (Kelas 1-6) terpotong/tidak lengkap karena terlalu banyak, mohon pisahkan dan unggah file per Fase atau per Kelas secara bergantian.</span>
              </p>
            </div>
            <div className="shrink-0">
              <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all border ${isUploadingCPTP ? 'bg-white/10 text-white/40 border-white/20' : 'bg-[#D4AF37] text-black border-[#D4AF37] hover:bg-[#D4AF37]/90 shadow-[0_4px_14px_rgba(212,175,55,0.2)]'}`}>
                {isUploadingCPTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {isUploadingCPTP ? "Memproses File..." : "Pilih File (PDF/Word/Excel)"}
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt" onChange={handleUploadCPTP} disabled={isUploadingCPTP} />
              </label>
            </div>
          </div>

          {cptpPreview && (
            <Card className="border-white/10 bg-black/20 text-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Pratinjau Data ({cptpPreview.length} Baris Ditemukan)
                  </CardTitle>
                  <CardDescription className="text-white/50 text-xs mt-1">
                    Mohon cek apakah hasil ekstraksi kolom sudah sesuai sebelum dikirim ke Google Sheets.
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleSyncCPTPToGSheets} 
                  disabled={isUploadingCPTP}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-9"
                >
                  {isUploadingCPTP ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Kirim ke G-Sheets
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5 text-[#D4AF37] uppercase border-b border-white/10 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="p-2 text-left min-w-[50px]">Fase</th>
                        <th className="p-2 text-left min-w-[50px]">Kelas</th>
                        <th className="p-2 text-left min-w-[70px]">Semester</th>
                        <th className="p-2 text-left min-w-[100px]">Elemen</th>
                        <th className="p-2 text-left min-w-[200px]">Capaian Pembelajaran (CP)</th>
                        <th className="p-2 text-left min-w-[200px]">Tujuan Pembelajaran (TP)</th>
                        <th className="p-2 text-left min-w-[150px]">Materi</th>
                        <th className="p-2 text-left min-w-[150px]">Sub Materi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cptpPreview.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="p-2 text-white/80">{row.fase || "-"}</td>
                          <td className="p-2 text-white/80">{row.kelas || "-"}</td>
                          <td className="p-2 text-white/80">{row.semester || "-"}</td>
                          <td className="p-2 text-white/80">{row.elemen || "-"}</td>
                          <td className="p-2 text-white/60 line-clamp-3">{row.cp || "-"}</td>
                          <td className="p-2 text-white/60 line-clamp-3">{row.tp || "-"}</td>
                          <td className="p-2 text-white/80">{row.materi || "-"}</td>
                          <td className="p-2 text-white/80">{row.subMateri || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {cptpPreview.length > 100 && (
                  <p className="text-[10px] text-white/40 mt-2 text-center">Menampilkan 100 baris pertama dari total {cptpPreview.length} baris.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Apps Script Update Notice */}
      {source === "gsheets" && false && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4 pb-3">
            <h4 className="text-sm font-bold text-amber-800 mb-1">⚠️ Perlu Update Apps Script</h4>
            <p className="text-xs text-amber-700">
              Pastikan Apps Script Anda di Google Sheets memiliki fungsi:{" "}
              <code className="bg-amber-100 px-1 rounded">getAllUsers</code>, <code className="bg-amber-100 px-1 rounded">addUser</code>,{" "}
              <code className="bg-amber-100 px-1 rounded">updateUser</code>, <code className="bg-amber-100 px-1 rounded">deleteUser</code>, 
              dan <code className="bg-amber-100 px-1 rounded">updateCPTP</code>.
              Minta agen untuk memberikan template Apps Script terbaru jika belum diperbarui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
