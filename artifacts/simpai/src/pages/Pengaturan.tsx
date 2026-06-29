import { useState, useEffect } from "react";
import { useSimpaiTema, useSimpaiProfil } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, RotateCcw, Palette, Key, RefreshCw, Cpu } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const TEMA_OPTIONS = [
  { id: "hijau", label: "Hijau NU", desc: "Tema hijau khas Islam Nusantara", swatchBg: "bg-green-800", swatchAccent: "bg-green-500" },
  { id: "biru", label: "Biru Muhammadiyah", desc: "Tema biru formal profesional", swatchBg: "bg-blue-800", swatchAccent: "bg-blue-400" },
  { id: "gelap", label: "Mode Gelap", desc: "Dark mode nyaman untuk malam hari", swatchBg: "bg-slate-900", swatchAccent: "bg-slate-500" },
];

export default function Pengaturan() {
  const [tema, setTema] = useSimpaiTema();
  const [profil] = useSimpaiProfil();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("simpai_api_key") || "");
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("simpai_api_key", apiKey.trim());
      toast({ title: "Tersimpan", description: "API Key Gemini berhasil disimpan di browser Anda." });
    } else {
      localStorage.removeItem("simpai_api_key");
      toast({ title: "Dihapus", description: "API Key Gemini telah dihapus." });
    }
  };

  const eksporData = () => {
    const allData: Record<string, unknown> = {};
    const keys = ["simpai_profil", "simpai_jadwal", "simpai_siswa", "simpai_pemetaan", "simpai_promes", "simpai_arsip", "simpai_tema"];
    keys.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (item) allData[key] = JSON.parse(item);
      } catch (e) {}
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_simpai_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data diekspor", description: "File backup berhasil diunduh." });
  };

  const imporData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
          });
          toast({ title: "Data diimpor", description: "Halaman akan dimuat ulang." });
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast({ title: "Gagal mengimpor", description: "File JSON tidak valid.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetData = () => {
    const keys = ["simpai_profil", "simpai_jadwal", "simpai_siswa", "simpai_pemetaan", "simpai_promes", "simpai_arsip", "simpai_tema"];
    keys.forEach((key) => localStorage.removeItem(key));
    toast({ title: "Data direset", description: "Semua data telah dihapus." });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">Manajemen kunci aplikasi SIM-PAI SEDJATI.</p>
      </div>

      {/* Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Key className="w-4 h-4 text-primary" /> Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Nama Guru</Label>
            <Input value={profil.namaGuru || ""} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label>Instansi</Label>
            <Input value={profil.namaSekolah || ""} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label>Tahun Pelajaran / Semester</Label>
            <Input value={`${profil.tahunPelajaran || "-"} / ${profil.semester || "-"}`} readOnly className="bg-muted/50" />
          </div>
          <p className="text-xs text-muted-foreground">Untuk mengubah data, pergi ke menu Master Data.</p>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Palette className="w-4 h-4 text-primary" /> Personalisasi Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TEMA_OPTIONS.map((t) => (
              <button key={t.id} onClick={() => setTema(t.id)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${tema === t.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"}`}
                data-testid={`button-tema-${t.id}`}>
                {tema === t.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-md ${t.swatchBg}`}></div>
                  <div className={`w-4 h-8 rounded-md ${t.swatchAccent}`}></div>
                </div>
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Konfigurasi AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Cpu className="w-4 h-4 text-primary" /> Konfigurasi AI Pribadi</CardTitle>
          <CardDescription>Jika Anda tidak ingin berbagi kuota AI (atau kuota sudah habis), masukkan API Key Anda sendiri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Gemini API Key</Label>
            <div className="flex gap-2">
              <Input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
              <Button onClick={saveApiKey}>Simpan</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API Key ini hanya disimpan secara lokal di browser Anda (Local Storage) dan aman. Ini akan mencegah Anda menggunakan kuota administrator aplikasi. Anda bisa mendapatkannya di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">aistudio.google.com</a>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="w-4 h-4 text-primary" /> Backup & Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={eksporData} variant="outline" className="flex-1 flex items-center justify-center gap-2" data-testid="button-ekspor-data">
              <Download className="w-4 h-4" /> Export Data (JSON)
            </Button>
            <Button onClick={imporData} variant="outline" className="flex-1 flex items-center justify-center gap-2" data-testid="button-impor-data">
              <Upload className="w-4 h-4" /> Import Data (JSON)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Export untuk backup data Anda. Import untuk memulihkan data dari file backup sebelumnya.</p>

          <div className="border-t border-border pt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center gap-2" data-testid="button-reset-data">
                  <RotateCcw className="w-4 h-4" /> Reset Semua Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Semua Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus SEMUA data secara permanen termasuk profil, jadwal, daftar siswa, pemetaan, promes, dan arsip dokumen. Pastikan Anda sudah melakukan backup terlebih dahulu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={resetData} className="bg-destructive hover:bg-destructive/90">Ya, Hapus Semua</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">Hati-hati! Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pb-4">SIM-PAI SEDJATI &copy; 2026 — GPAI Jatiroto</p>
    </div>
  );
}
