import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  useSimpaiProfil, useSimpaiJadwal, useSimpaiSiswa, useSimpaiArsip 
} from "@/lib/storage";
import { useSession } from "@/lib/session";
import { 
  Bell, CheckCircle, AlertCircle, AlertTriangle, Info, Check, 
  Calendar, Users, BookOpen, FileSpreadsheet, Settings, UserCheck, 
  Trash2, X, Sparkles, ExternalLink, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "danger";
  targetMenu: string;
  targetSubMenu?: string;
  icon: React.ComponentType<any>;
}

interface NotificationPopoverProps {
  onNavigate: (menu: string, subMenu?: string) => void;
  align?: "left" | "right";
}

export default function NotificationPopover({ onNavigate, align = "right" }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [profil] = useSimpaiProfil();
  const [jadwal] = useSimpaiJadwal();
  const [siswa] = useSimpaiSiswa() as [Record<string, string>, any];
  const [arsip] = useSimpaiArsip() as [any[], any];
  const session = useSession();

  const [lastJurnalSaved, setLastJurnalSaved] = useState<string>("");

  // Load journal flag from local storage on mount
  useEffect(() => {
    try {
      setLastJurnalSaved(localStorage.getItem("simpai_jurnal_last_saved") || "");
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Listen to storage and local-storage events to auto-dismiss when they complete tasks in other pages
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setLastJurnalSaved(localStorage.getItem("simpai_jurnal_last_saved") || "");
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Compute active notifications dynamically based on system state
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Profil belum lengkap
    const isProfilIncomplete = !profil.namaGuru || !profil.namaSekolah || !profil.npsn;
    if (isProfilIncomplete) {
      list.push({
        id: "profil-incomplete",
        title: "Lengkapi Profil Guru & Sekolah",
        message: "Lengkapi NIP, nama sekolah, NPSN, dan kepala sekolah di menu Master Data untuk legalitas dokumen.",
        type: "warning",
        targetMenu: "master_data",
        icon: UserCheck
      });
    }

    // 2. Jadwal mengajar kosong
    const isJadwalEmpty = !jadwal || Object.keys(jadwal).length === 0;
    if (isJadwalEmpty) {
      list.push({
        id: "jadwal-empty",
        title: "Atur Jadwal Mengajar",
        message: "Jadwal mengajar belum dikonfigurasi. Atur hari mengajar kelas untuk kalkulasi Program Semester (Promes) otomatis.",
        type: "warning",
        targetMenu: "master_data",
        icon: Calendar
      });
    }

    // 3. Rombel siswa belum diisi
    const isSiswaEmpty = !siswa || Object.keys(siswa).length === 0 || !Object.values(siswa).some(v => v && v.trim().length > 0);
    if (isSiswaEmpty) {
      list.push({
        id: "siswa-empty",
        title: "Isi Daftar Rombel Siswa",
        message: "Daftar siswa tiap kelas masih kosong. Masukkan nama siswa agar bisa melakukan Asesmen/Jurnal kelas.",
        type: "warning",
        targetMenu: "master_data",
        icon: Users
      });
    }

    // 4. Promes belum pernah dibuat
    const hasPromes = arsip && Array.isArray(arsip) && arsip.some(item => item.tipe === "Promes");
    if (!hasPromes) {
      list.push({
        id: "promes-missing",
        title: "Susun Program Semester (Promes)",
        message: "Program Semester semester ini belum disusun. Silakan buat alokasi pekan belajar efektif otomatis.",
        type: "info",
        targetMenu: "pembelajaran",
        targetSubMenu: "promes",
        icon: FileSpreadsheet
      });
    }

    // 5. RPP / Modul Ajar belum pernah dibuat
    const hasRpp = arsip && Array.isArray(arsip) && arsip.some(item => item.tipe === "RPP" || item.judul.toLowerCase().includes("rpp") || item.judul.toLowerCase().includes("modul ajar"));
    if (!hasRpp) {
      list.push({
        id: "rpp-missing",
        title: "Buat Modul Ajar (RPP) AI Pertama",
        message: "Belum ada arsip RPP. Gunakan Generator RPP berbasis AI untuk merancang modul belajar interaktif dalam sekejap.",
        type: "info",
        targetMenu: "pembelajaran",
        targetSubMenu: "rpp",
        icon: Sparkles
      });
    }

    // 6. Bank soal belum pernah dibuat
    const hasSoal = arsip && Array.isArray(arsip) && arsip.some(item => item.tipe === "Soal" || item.judul.toLowerCase().includes("soal") || item.judul.toLowerCase().includes("ujian"));
    if (!hasSoal) {
      list.push({
        id: "soal-missing",
        title: "Buat Bank Soal Evaluasi AI",
        message: "Belum ada paket soal ujian tersimpan. Rancang bank soal pilihan ganda & esai PAI instan via Gemini AI.",
        type: "info",
        targetMenu: "asesmen",
        targetSubMenu: "banksoal",
        icon: BookOpen
      });
    }

    // 7. Jurnal Kelas Harian (Selalu ada sebagai agenda harian guru, kecuali sudah diisi hari ini)
    const todayStr = new Date().toISOString().split("T")[0];
    if (lastJurnalSaved !== todayStr) {
      list.push({
        id: "jurnal-daily",
        title: "Agenda: Catat Jurnal & Akhlak Siswa",
        message: "Luangkan waktu 2 menit hari ini untuk mencatat perkembangan nilai perilaku dan ibadah siswa di menu Asesmen.",
        type: "success",
        targetMenu: "asesmen",
        targetSubMenu: "jurnal",
        icon: CheckCircle
      });
    }

    // 8. Kuota Ekspor Rendah / Habis
    if (session.kuotaSisa === 0) {
      list.push({
        id: "quota-exhausted",
        title: "Kuota Ekspor Dokumen Habis",
        message: "Kuota ekspor dokumen Anda sudah habis. Silakan hubungi administrator untuk menambah kuota.",
        type: "danger",
        targetMenu: "arsip",
        icon: AlertTriangle
      });
    } else if (session.kuotaSisa < 10) {
      list.push({
        id: "quota-low",
        title: "Kuota Ekspor Menipis",
        message: `Sisa kuota ekspor dokumen Anda tinggal ${session.kuotaSisa} kali. Hubungi administrator sebelum kuota habis.`,
        type: "danger",
        targetMenu: "arsip",
        icon: AlertCircle
      });
    }

    return list;
  }, [profil, jadwal, siswa, arsip, session.kuotaSisa, lastJurnalSaved]);

  const handleItemClick = (item: NotificationItem) => {
    onNavigate(item.targetMenu, item.targetSubMenu);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
        title="Lonceng Kegiatan & Notifikasi"
      >
        {notifications.length > 0 && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D4AF37] rounded-full border border-[#031c13] animate-pulse"></div>
        )}
        <Bell className="w-5 h-5 text-[#D4AF37] hover:scale-105 transition-transform" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2.5 w-80 sm:w-[380px] bg-[#031d14] border border-[#D4AF37]/30 text-white rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150
            ${align === "right" ? "right-0" : "left-0"}
          `}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#D4AF37]/15 bg-[#02130d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-xs font-bold tracking-wide uppercase text-white">
                Daftar Tindakan Guru
              </h3>
            </div>
            {notifications.length > 0 && (
              <span className="text-[10px] text-yellow-400 font-semibold bg-yellow-400/10 px-2 py-0.5 rounded-full">
                {notifications.length} Perlu Tindakan
              </span>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <CheckCircle className="w-10 h-10 text-green-400/40 mb-2" />
                <p className="text-xs font-semibold text-white/80">Sistem Berjalan Optimal</p>
                <p className="text-[11px] text-white/40 mt-1">Tidak ada tindakan atau kelengkapan data yang perlu diselesaikan.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <div className="py-1">
                  <div className="px-4 py-1 text-[9px] font-bold text-[#D4AF37] uppercase bg-white/[0.01]">
                    Agenda & Kelengkapan
                  </div>
                  {notifications.map((item) => {
                    const IconComponent = item.icon;
                    const typeColors = {
                      warning: "border-l-4 border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10",
                      danger: "border-l-4 border-l-red-500 bg-red-500/5 hover:bg-red-500/10",
                      info: "border-l-4 border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10",
                      success: "border-l-4 border-l-green-500 bg-green-500/5 hover:bg-green-500/10",
                    };
                    const iconColors = {
                      warning: "text-yellow-400 bg-yellow-500/10",
                      danger: "text-red-400 bg-red-500/10",
                      info: "text-blue-400 bg-blue-500/10",
                      success: "text-green-400 bg-green-500/10",
                    };

                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all duration-150 group relative ${typeColors[item.type]}`}
                      >
                        {/* Left Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconColors[item.type]}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        {/* Info Text */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-white/60 leading-normal mt-1">
                            {item.message}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 font-medium">
                            Klik untuk selesaikan tindakan →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-[#02130d] border-t border-[#D4AF37]/15 flex items-center justify-between text-[10px] text-white/50">
            <span>
              SeDjati • Solusi Pendidikan Agama Islam
            </span>
            <span className="font-semibold text-white/40">
              Otomatis & Real-time
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
