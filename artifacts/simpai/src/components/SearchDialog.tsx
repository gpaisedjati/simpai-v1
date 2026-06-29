import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSimpaiSiswa, useSimpaiArsip } from "@/lib/storage";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, BookOpen, ClipboardList, Home, Database, BarChart2, Archive, 
  Settings, Shield, User, FileText, FileSpreadsheet, Copy, Check, Eye, 
  ArrowLeft, Download, ExternalLink, Calendar, GraduationCap, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/session";
import { apiUseQuota } from "@/lib/api";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (menu: string, subMenu?: string) => void;
}

export default function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const session = useSession();
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setQuery("");
      setPreviewItem(null);
      setCopied(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [open]);

  // 1. Static Menu & Features Index
  const staticItems = useMemo(() => [
    { id: "beranda", title: "Beranda", category: "Fitur & Menu", description: "Halaman utama, ringkasan kuota AI, dan kutipan motivasi harian.", icon: Home, targetMenu: "beranda" },
    { id: "master_data_profil", title: "Profil Guru & Sekolah", category: "Fitur & Menu", description: "Kelola NPSN, alamat sekolah, nama guru, NIP, Kepala Sekolah, dan pangkat.", icon: Database, targetMenu: "master_data" },
    { id: "master_data_jadwal", title: "Jadwal Mengajar", category: "Fitur & Menu", description: "Atur hari mengajar per kelas untuk kalkulasi Hari Efektif Promes otomatis.", icon: Calendar, targetMenu: "master_data" },
    { id: "master_data_siswa", title: "Daftar Rombel Siswa", category: "Fitur & Menu", description: "Kelola rombongan belajar dan daftar nama siswa per kelas.", icon: GraduationCap, targetMenu: "master_data" },
    { id: "pembelajaran_atp", title: "Alur Tujuan Pembelajaran (ATP)", category: "Fitur & Menu", description: "Atur pemetaan fase belajar dan capaian kompetensi dasar.", icon: BookOpen, targetMenu: "pembelajaran", targetSubMenu: "pemetaan" },
    { id: "pembelajaran_promes", title: "Program Semester (Promes)", category: "Fitur & Menu", description: "Generasi jadwal alokasi pekan belajar dan JTM otomatis.", icon: BookOpen, targetMenu: "pembelajaran", targetSubMenu: "promes" },
    { id: "pembelajaran_rpp", title: "Generator Modul Ajar (RPP) AI", category: "Fitur & Menu", description: "Buat RPP lengkap dan Modul Ajar PAI interaktif dengan Gemini AI.", icon: BookOpen, targetMenu: "pembelajaran", targetSubMenu: "rpp" },
    { id: "pembelajaran_bahan", title: "Pembuat Bahan Ajar AI", category: "Fitur & Menu", description: "Susun ringkasan materi dan bahan ajar PAI berkualitas tinggi.", icon: BookOpen, targetMenu: "pembelajaran", targetSubMenu: "bahan" },
    { id: "asesmen_soal", title: "Pembuat Soal Ujian AI", category: "Fitur & Menu", description: "Buat bank soal PG dan Esai lengkap kunci jawaban via Gemini AI.", icon: ClipboardList, targetMenu: "asesmen", targetSubMenu: "banksoal" },
    { id: "asesmen_jurnal", title: "Penilaian Kelas & Jurnal Guru", category: "Fitur & Menu", description: "Input nilai harian kelas dan catat kemajuan akhlak/jurnal siswa.", icon: ClipboardList, targetMenu: "asesmen", targetSubMenu: "jurnal" },
    { id: "asesmen_sertifikat", title: "Apresiasi Siswa (Sertifikat)", category: "Fitur & Menu", description: "Desain piagam penghargaan prestasi atau akhlak mulia siswa.", icon: ClipboardList, targetMenu: "asesmen", targetSubMenu: "sertifikat" },
    { id: "analitik", title: "Analisis Hasil Belajar AI", category: "Fitur & Menu", description: "Grafik ketuntasan kelas, nilai rata-rata, dan rekomendasi bimbingan AI.", icon: BarChart2, targetMenu: "analitik" },
    { id: "arsip", title: "Arsip Dokumen E-Portofolio", category: "Fitur & Menu", description: "Akses riwayat download/print RPP, Promes, dan Soal yang pernah dibuat.", icon: Archive, targetMenu: "arsip" },
    { id: "pengaturan", title: "Pengaturan & Sinkronisasi", category: "Fitur & Menu", description: "Ganti tema, atur Google Sheets Web App, dan kelola API Key.", icon: Settings, targetMenu: "pengaturan" },
    ...(session?.username === "admin" || session?.username === "ridwan" ? [
      { id: "admin", title: "Admin Panel", category: "Fitur & Menu", description: "Kelola kuota AI para guru, sinkronisasi Google Sheets, dan akun pengguna.", icon: Shield, targetMenu: "admin" }
    ] : [])
  ], [session?.username]);

  // 2. Fetch Dynamic Students
  const [siswaData] = useSimpaiSiswa() as [Record<string, string>, any];
  const siswaItems = useMemo(() => {
    if (!siswaData) return [];
    const items: any[] = [];
    Object.entries(siswaData).forEach(([key, value]) => {
      if (!value) return;
      const kelasNum = key.replace("kls", "");
      const names = value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
      names.forEach((name, idx) => {
        items.push({
          id: `siswa-${key}-${idx}`,
          title: name,
          category: "Data Rombel Siswa",
          description: `Siswa Kelas ${kelasNum}`,
          icon: User,
          targetMenu: "master_data"
        });
      });
    });
    return items;
  }, [siswaData]);

  // 3. Fetch Dynamic Saved Documents (Arsip)
  const [arsipData] = useSimpaiArsip() as [any[], any];
  const arsipItems = useMemo(() => {
    if (!arsipData || !Array.isArray(arsipData)) return [];
    return arsipData.map((item) => {
      let previewText = "";
      try {
        if (item.tipe === "Promes") {
          const parsed = JSON.parse(item.konten);
          if (Array.isArray(parsed)) {
            previewText = parsed.map((r: any) => `${r.materi} (JP: ${r.jp})`).join(", ");
          }
        } else {
          previewText = item.konten || "";
        }
      } catch {
        previewText = item.konten || "";
      }
      return {
        id: `arsip-${item.id}`,
        title: item.judul,
        category: "Arsip E-Portofolio",
        description: `${item.tipe} • Dibuat pada ${item.tanggal}`,
        icon: item.tipe === "Promes" ? FileSpreadsheet : FileText,
        targetMenu: "arsip",
        rawContent: item.konten || "",
        previewText: previewText,
        tipe: item.tipe,
        originalItem: item
      };
    });
  }, [arsipData]);

  // Combined index
  const allItems = useMemo(() => {
    return [...staticItems, ...siswaItems, ...arsipItems];
  }, [staticItems, siswaItems, arsipItems]);

  // Filtered results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, show a few suggested menus
      return staticItems.slice(0, 8);
    }
    return allItems.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchContent = item.rawContent ? item.rawContent.toLowerCase().includes(q) : false;
      return matchTitle || matchDesc || matchCat || matchContent;
    });
  }, [allItems, query, staticItems]);

  // Grouped results
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Actions
  const handleItemClick = (item: any) => {
    if (item.category === "Arsip E-Portofolio") {
      // Automatically preview saved document
      setPreviewItem(item);
    } else {
      onNavigate(item.targetMenu, item.targetSubMenu);
      onOpenChange(false);
    }
  };

  const handleCopyContent = () => {
    if (!previewItem) return;
    try {
      let textToCopy = previewItem.rawContent;
      if (previewItem.tipe === "Promes") {
        try {
          const parsed = JSON.parse(previewItem.rawContent);
          if (Array.isArray(parsed)) {
            textToCopy = parsed.map((r, i) => `${i + 1}. Bulan: ${r.bulan}, Pekan Ke-${r.pekanKe}, Materi: ${r.materi}, JP: ${r.jp}, Status: ${r.status}`).join("\n");
          }
        } catch { /* fallback to raw */ }
      }
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({ title: "Konten Disalin", description: "Konten dokumen berhasil disalin ke papan klip." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Gagal Menyalin", variant: "destructive" });
    }
  };

  const downloadTxt = async (konten: string, judul: string) => {
    if (session.kuotaSisa <= 0) {
      toast({
        title: "Kuota Ekspor Habis",
        description: "Kuota ekspor dokumen Anda sudah habis. Silakan hubungi administrator.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await apiUseQuota(session.username);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);

      const blob = new Blob([konten], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${judul.replace(/[^a-z0-9]/gi, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Ekspor Berhasil",
        description: `Dokumen berhasil diekspor. Sisa kuota ekspor Anda: ${result.kuotaSisa}`,
      });
    } catch (err: unknown) {
      toast({
        title: "Gagal Mengekspor",
        description: err instanceof Error ? err.message : "Terjadi kesalahan saat memotong kuota.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-[#031d14] border border-[#D4AF37]/30 text-white rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Pencarian Global SeDjati</DialogTitle>
        <DialogDescription className="sr-only">Cari menu, data siswa, atau arsip dokumen</DialogDescription>
        {!previewItem ? (
          <div className="flex flex-col h-[520px]">
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D4AF37]/15 bg-[#02130d]">
              <Search className="w-5 h-5 text-[#D4AF37] animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari menu, nama siswa, atau isi dokumen RPP/Promes..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none border-none outline-none"
              />
              {query && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setQuery("")}
                  className="h-7 px-2 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  Bersihkan
                </Button>
              )}
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Archive className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-sm text-white/80 font-medium">Tidak ada hasil ditemukan</p>
                  <p className="text-xs text-white/50 mt-1">Cobalah mencari dengan kata kunci lain (contoh: rpp, budi, promes)</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-1.5">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] px-2.5">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer bg-white/[0.02] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/20 transition-all group"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-white/[0.04] group-hover:bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-white/60 truncate mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 pl-3">
                              {item.category === "Arsip E-Portofolio" ? (
                                <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-3 h-3" /> Pratinjau
                                </span>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#D4AF37] transition-colors translate-x-1 group-hover:translate-x-0 transition-transform" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#02130d] border-t border-[#D4AF37]/15 flex items-center justify-between text-[11px] text-white/40">
              <span className="flex items-center gap-1">
                Ketik kata kunci untuk mencari instan seluruh sistem
              </span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[#D4AF37]/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-[#D4AF37]">
                ESC
              </kbd>
            </div>
          </div>
        ) : (
          /* Preview View */
          <div className="flex flex-col h-[520px]">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/15 bg-[#02130d]">
              <button 
                onClick={() => setPreviewItem(null)}
                className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#e5c044] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Hasil
              </button>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCopyContent}
                  variant="outline" 
                  size="sm"
                  className="h-8 border-[#D4AF37]/35 bg-[#031d14] text-xs hover:bg-[#D4AF37]/10 text-white hover:text-[#D4AF37]"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-400 mr-1.5" /> Disalin</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 mr-1.5" /> Salin Teks</>
                  )}
                </Button>
                <Button 
                  onClick={() => downloadTxt(previewItem.rawContent, previewItem.title)}
                  variant="outline" 
                  size="sm"
                  className="h-8 border-[#D4AF37]/35 bg-[#031d14] text-xs hover:bg-[#D4AF37]/10 text-white hover:text-[#D4AF37]"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download TXT
                </Button>
                <Button 
                  onClick={() => {
                    onNavigate("arsip");
                    onOpenChange(false);
                  }}
                  variant="outline" 
                  size="sm"
                  className="h-8 border-[#D4AF37]/35 bg-[#031d14] text-xs hover:bg-[#D4AF37]/10 text-white hover:text-[#D4AF37]"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Lihat di Arsip
                </Button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#02130d]/30 font-sans text-xs text-white/90 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-white/10">
              <div className="mb-4 pb-3 border-b border-white/10">
                <h2 className="text-sm font-bold text-[#D4AF37]">{previewItem.title}</h2>
                <p className="text-[10px] text-white/50 mt-1">{previewItem.description}</p>
              </div>
              
              {previewItem.tipe === "Promes" ? (
                /* Beautiful Promes Table Preview */
                <div className="overflow-x-auto border border-[#D4AF37]/20 rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#02130d] text-[#D4AF37] uppercase font-bold border-b border-[#D4AF37]/25">
                      <tr>
                        <th className="p-2 border-r border-[#D4AF37]/15">Bulan</th>
                        <th className="p-2 border-r border-[#D4AF37]/15 text-center w-12">Pekan</th>
                        <th className="p-2 border-r border-[#D4AF37]/15">Materi Pembelajaran PAI</th>
                        <th className="p-2 border-r border-[#D4AF37]/15 text-center w-12">JP</th>
                        <th className="p-2 text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        try {
                          const rows = JSON.parse(previewItem.rawContent);
                          if (Array.isArray(rows)) {
                            return rows.map((row: any, i: number) => (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-2 border-r border-white/5 font-medium">{row.bulan}</td>
                                <td className="p-2 border-r border-white/5 text-center">{row.pekanKe}</td>
                                <td className="p-2 border-r border-white/5 truncate max-w-[200px]" title={row.materi}>{row.materi}</td>
                                <td className="p-2 border-r border-white/5 text-center">{row.jp}</td>
                                <td className="p-2 text-center">
                                  <Badge className={row.status === "Efektif" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                                    {row.status}
                                  </Badge>
                                </td>
                              </tr>
                            ));
                          }
                        } catch {}
                        return <tr><td colSpan={5} className="p-4 text-center text-white/55">Gagal membaca format tabel Promes. Gunakan "Download TXT" untuk membaca mentah.</td></tr>;
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Standard Markdown / Text Content Preview */
                <div className="font-mono text-[11px] p-3 rounded-lg bg-black/45 border border-white/5 leading-normal">
                  {previewItem.rawContent}
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="px-4 py-2.5 bg-[#02130d] border-t border-[#D4AF37]/15 flex items-center justify-between text-[11px] text-white/40">
              <span>Meninjau dokumen: {previewItem.title}</span>
              <span>Tekan Escape untuk tutup</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
