import { useState, useEffect } from "react";
import { useSimpaiProfil, useSimpaiSiswa, useSimpaiJadwal, useSimpaiArsip, useSimpaiKalender, useSimpaiPromes } from "@/lib/storage";
import { useSession } from "@/lib/session";
import { formatGuruName } from "@/lib/utils";
import { Building2, Users, BookOpen, Clock, Sparkles, Database, FileText, Activity, Lightbulb, CheckCircle2, ClipboardList, ChevronLeft, ChevronRight, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { AppBackground } from "../design-system/components/AppBackground";
import { GlassCard } from "../design-system/components/GlassCard";
import { DashboardCard } from "../design-system/components/DashboardCard";
import { SectionTitle } from "../design-system/components/SectionTitle";
import { PrimaryButton } from "../design-system/components/PrimaryButton";
import { SecondaryButton } from "../design-system/components/SecondaryButton";

const hadiths = [
  "\"Niscaya Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat.\" (QS. Al-Mujadilah: 11)",
  "\"Barangsiapa menempuh jalan untuk menuntut ilmu, Allah akan memudahkan baginya jalan menuju surga.\" (HR. Muslim)",
  "\"Pendidikan adalah tiket ke masa depan. Hari esok dimiliki oleh orang-orang yang mempersiapkan dirinya sejak hari ini.\"",
  "\"Ilmu itu lebih baik daripada harta, ilmu menjaga engkau dan engkau menjaga harta.\" (Ali bin Abi Thalib)",
  "\"Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.\" (HR. Bukhari)",
  "\"Seorang guru itu laksana pelita dalam kegelapan, menerangi tanpa lelah meski dirinya terbakar.\"",
  "\"Bukanlah ilmu itu apa yang dihafal, melainkan apa yang bermanfaat.\" (Imam Asy-Syafi'i)",
  "\"Didiklah anak-anakmu sesuai dengan zamannya, karena mereka diciptakan untuk hidup pada zaman yang bukan zamanmu.\" (Umar bin Khattab)",
  "\"Katakanlah: 'Adakah sama orang-orang yang mengetahui dengan orang-orang yang tidak mengetahui?' Sesungguhnya orang yang berakallah yang dapat menerima pelajaran.\" (QS. Az-Zumar: 9)",
  "\"Barangsiapa yang menginginkan dunia maka hendaknya dengan ilmu, barangsiapa yang menginginkan akhirat maka hendaknya dengan ilmu.\" (Imam Asy-Syafi'i)",
  "\"Tuntutlah ilmu sejak dari ayunan hingga liang lahad.\" (Ungkapan Hikmah)",
  "\"Sesungguhnya aku diutus tidak lain hanyalah untuk menyempurnakan akhlak yang mulia.\" (HR. Ahmad)",
  "\"Saling menasihatilah dalam kebenaran dan saling menasihatilah dalam kesabaran.\" (QS. Al-`Asr: 3)",
  "\"Mengajar bukanlah sekadar mentransfer pengetahuan, melainkan menyalakan api rasa ingin tahu dan membentuk akhlak mulia.\"",
  "\"Setiap anak lahir dalam keadaan fitrah. Orang tua dan gurunyalah yang membimbing arah tumbuh kembang fitrah tersebut.\" (Adaptasi HR. Bukhari)",
  "\"Ilmu tanpa amal bagaikan pohon yang tidak berbuah.\" (Pepatah Hikmah)"
];

export default function Beranda({ setMenu }: { setMenu: (menu: string) => void }) {
  const [profil] = useSimpaiProfil();
  const [siswa] = useSimpaiSiswa();
  const [jadwal] = useSimpaiJadwal();
  const [arsip] = useSimpaiArsip();
  const session = useSession();
  
  const [quote] = useState(() => hadiths[Math.floor(Math.random() * hadiths.length)]);
  
  // Stats calculation
  const totalArsip = arsip ? arsip.length : 0;
  const totalGenerate = 128 + totalArsip; // 128 base + dynamic count of newly created documents
  
  const todayStr = new Date().toLocaleDateString("id-ID");
  const aktivitasHariIni = (arsip || []).filter((item: any) => item.tanggal === todayStr).length;
  const totalSiswa = Object.values(siswa).reduce((acc: number, val: any) => {
    if (typeof val === 'string' && val.trim()) {
      return acc + val.trim().split('\n').filter(n => n.trim()).length;
    }
    return acc;
  }, 0);
  
  const totalRombel = Object.values(siswa).filter((val: any) => typeof val === 'string' && val.trim()).length;
  
  const totalJTM = Object.values(jadwal).reduce((acc: number, val: any) => {
    let count = 0;
    if (val && typeof val === 'object') {
      Object.values(val).forEach((isChecked) => {
        if (isChecked) count++;
      });
    }
    return acc + count;
  }, 0);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState({ title: "", content: "" });

  // Academic Calendar states & persistence
  const [kalender, setKalender] = useSimpaiKalender();
  const [promesData] = useSimpaiPromes() as [any, any];
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"ulangan" | "tugas" | "sikap" | "umum" | "libur">("umum");

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    
    const newEvent = {
      id: Date.now().toString(),
      tanggal: selectedDateStr,
      judul: newEventTitle.trim(),
      tipe: newEventType
    };
    
    setKalender(prev => [...(prev || []), newEvent]);
    setNewEventTitle("");
    setIsAddEventOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setKalender(prev => (prev || []).filter(evt => evt.id !== id));
  };

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Helper to parse saved promesData into calendar events
  const getPromesEvents = (): any[] => {
    if (!promesData) return [];
    const events: any[] = [];
    
    Object.entries(promesData).forEach(([key, rows]: [string, any]) => {
      if (!Array.isArray(rows)) return;
      
      const isGanjil = key.endsWith("Ganjil");
      const semMonths = isGanjil ? [
        { nama: "Juli", pekan: 4 },
        { nama: "Agustus", pekan: 5 },
        { nama: "September", pekan: 4 },
        { nama: "Oktober", pekan: 4 },
        { nama: "November", pekan: 5 },
        { nama: "Desember", pekan: 4 }
      ] : [
        { nama: "Januari", pekan: 4 },
        { nama: "Februari", pekan: 4 },
        { nama: "Maret", pekan: 5 },
        { nama: "April", pekan: 4 },
        { nama: "Mei", pekan: 5 },
        { nama: "Juni", pekan: 4 }
      ];
      
      let rowIndex = 0;
      semMonths.forEach((m) => {
        for (let w = 1; w <= m.pekan; w++) {
          const row = rows[rowIndex];
          if (row && row.status && row.status !== "Normal (KBM Aktif)") {
            const monthIndex = MONTH_NAMES.findIndex(mn => mn.toLowerCase() === m.nama.toLowerCase());
            if (monthIndex !== -1) {
              const day = w === 1 ? 7 : w === 2 ? 14 : w === 3 ? 21 : w === 4 ? 28 : 30;
              const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              let tipe = "umum";
              if (row.status.toLowerCase().includes("libur")) tipe = "libur";
              else if (row.status.toLowerCase().includes("sumatif") || row.status.toLowerCase().includes("raport")) tipe = "ulangan";
              else if (row.status.toLowerCase().includes("projek")) tipe = "tugas";
              
              events.push({
                id: `promes-${key}-${m.nama}-${w}`,
                tanggal: dateStr,
                judul: `${row.status}${row.materi ? `: ${row.materi}` : ""}`,
                tipe,
                isFromPromes: true
              });
            }
          }
          rowIndex++;
        }
      });
    });
    
    return events;
  };

  const formatIndoDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const openAiModal = (title: string, content: string) => {
    setAiModalContent({ title, content });
    setAiModalOpen(true);
  };

  const aiShortcuts = [
    {
      title: "Ice Breaking 5 Menit",
      content: "Tepuk Anak Sholeh: Tepuk 3x (Aku), Tepuk 3x (Anak Sholeh), Tepuk 3x (Rajin Sholat), Tepuk 3x (Rajin Ngaji), Tepuk 3x (Orang Tua), Tepuk 3x (Dihormati), Tepuk 3x (Cinta Islam), Tepuk 3x (Sampai Mati), Lailahaillallah Muhammadurrasulullah! Islam! Islam! Yes!"
    },
    {
      title: "Kuis Pemantik",
      content: "1. Siapa nama malaikat yang bertugas menyampaikan wahyu?\n2. Sebutkan rukun Islam yang ke-3!\n3. Apa arti dari sifat Wajib Allah 'Wujud'?"
    },
    {
      title: "Bahan Diskusi",
      content: "Diskusikan dalam kelompok: Mengapa kita harus berbuat baik kepada tetangga meskipun berbeda agama? Berikan contoh sikap baik yang bisa dilakukan sehari-hari."
    },
    {
      title: "Refleksi Akhir",
      content: "1. Apa hal baru yang kamu pelajari hari ini?\n2. Bagian mana dari pelajaran hari ini yang paling kamu sukai?\n3. Sikap baik apa yang akan kamu praktikkan setelah pulang sekolah?"
    }
  ];

  // Construct dynamic calendar days grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startDayIndex = firstDayOfMonth.getDay() - 1; // Convert Sunday(0) to index 6, Monday(1) to index 0
  if (startDayIndex < 0) startDayIndex = 6;
  
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const daysArray: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  
  // Previous month padding
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const prevDay = totalDaysInPrevMonth - i;
    let pMonth = currentMonth - 1;
    let pYear = currentYear;
    if (pMonth < 0) {
      pMonth = 11;
      pYear--;
    }
    const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
    daysArray.push({ day: prevDay, isCurrentMonth: false, dateStr });
  }
  
  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    daysArray.push({ day: i, isCurrentMonth: true, dateStr });
  }
  
  // Next month padding
  const remainingSlots = 42 - daysArray.length;
  for (let i = 1; i <= remainingSlots; i++) {
    let nMonth = currentMonth + 1;
    let nYear = currentYear;
    if (nMonth > 11) {
      nMonth = 0;
      nYear++;
    }
    const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    daysArray.push({ day: i, isCurrentMonth: false, dateStr });
  }

  // Merge custom events and promes events
  const customEvents = kalender || [];
  const promesEvents = getPromesEvents();
  const allMergedEvents = [...customEvents, ...promesEvents];

  // Today ISO String formatting
  const getTodayISOStr = () => {
    const todayObj = new Date();
    const y = todayObj.getFullYear();
    const m = String(todayObj.getMonth() + 1).padStart(2, '0');
    const d = String(todayObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayISOStr = getTodayISOStr();
  const targetMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Filter events of currently viewed month & year, which are not passed (>= today)
  const visibleMonthEvents = allMergedEvents
    .filter(evt => {
      const isInMonth = evt.tanggal.startsWith(targetMonthPrefix);
      const isNotPassed = evt.tanggal >= todayISOStr;
      return isInMonth && isNotPassed;
    })
    // Sort chronologically
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    // Max 5 items
    .slice(0, 5);

  return (
    <AppBackground className="p-4 md:px-8 md:pb-8 md:pt-4 space-y-8 md:space-y-10 !min-h-full">
      {/* Hero */}
      <GlassCard className="relative overflow-hidden pt-8 pb-6 px-6 md:pt-10 md:pb-8 md:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-l border-[#D4AF37]/30 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-8">
        
        {/* Soft Golden Glow on the left */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        {/* Elegant Glowing Mosque Silhouette on the Bottom Right */}
        <div className="absolute right-0 bottom-0 w-full md:w-[480px] h-48 opacity-[0.25] pointer-events-none flex justify-end items-end overflow-hidden z-0 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full stroke-[#D4AF37] opacity-80" fill="none" strokeWidth="1.5">
            <path d="M 80,200 L 80,120 C 80,85 110,50 160,50 C 210,50 240,85 240,120 L 240,200 M 160,50 L 160,20" />
            <path d="M 120,200 L 120,150 C 120,125 138,105 160,105 C 182,105 200,125 200,150 L 200,200" />
            <path d="M 280,200 L 280,100 L 295,100 L 295,40 L 300,40 L 300,100 L 315,100 L 315,200" />
            <path d="M 370,200 L 370,130 C 370,90 405,60 450,60 C 495,60 530,90 530,130 L 530,200" />
            <path d="M 570,200 L 570,90 L 580,90 L 580,20" />
            <path d="M 630,200 L 630,140 C 630,110 650,80 680,80 C 710,80 730,110 730,140 L 730,200" />
            <circle cx="160" cy="20" r="2.5" fill="#D4AF37" />
            <circle cx="297.5" cy="40" r="2" fill="#D4AF37" />
            <circle cx="580" cy="20" r="2" fill="#D4AF37" />
          </svg>
        </div>

        {/* Soft Ambient Sparkles */}
        <div className="absolute top-12 left-12 w-3 h-3 bg-[#D4AF37] rounded-full opacity-40 blur-[1px]"></div>
        <div className="absolute top-24 left-32 w-2 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>

        <div className="relative z-10 flex flex-col items-start gap-4">
          <h1 className="text-3xl md:text-5xl font-arabic font-bold tracking-wider text-[#D4AF37] pt-2 leading-relaxed drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">السَّلاَمُ عَلَيْكُمْ</h1>
          <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-md">
            Ahlan wa Sahlan, <span className="text-[#D4AF37]">{formatGuruName(session.username)}</span>
          </h2>
          <div className="flex gap-2 items-start max-w-2xl mt-2">
            <span className="text-[#D4AF37] text-2xl font-serif leading-none mt-1">"</span>
            <p className="text-sm md:text-base font-medium text-white/80 leading-relaxed italic pr-4">
              {quote}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        
        {/* Stat Card 1 - Kuota Ekspor */}
        <div 
          onClick={() => setMenu("pengaturan")}
          className="cursor-pointer relative bg-white text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-green-400 hover:border-green-500 shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1.5 duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[180px]"
          title="Klik untuk melihat detail kuota di Pengaturan"
        >
          <div>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 text-green-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-black mb-1 leading-tight">Kuota Ekspor</h3>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-2xl sm:text-4xl font-extrabold text-black leading-none">{session.kuotaSisa}</span>
            <span className="text-[9px] sm:text-[11px] text-black/40 font-bold tracking-wider uppercase">Detail</span>
          </div>
        </div>

        {/* Stat Card 2 - Total Generate */}
        <div 
          onClick={() => setMenu("pembelajaran")}
          className="cursor-pointer relative bg-white text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-400 hover:border-blue-500 shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1.5 duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[180px]"
          title="Klik untuk membuat dokumen pembelajaran baru"
        >
          <div>
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 text-blue-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-black mb-1 leading-tight">Total Generate</h3>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-2xl sm:text-4xl font-extrabold text-black leading-none">{totalGenerate}</span>
            <span className="text-[9px] sm:text-[11px] text-black/40 font-bold tracking-wider uppercase">Buka</span>
          </div>
        </div>

        {/* Stat Card 3 - Dokumen Tersimpan */}
        <div 
          onClick={() => setMenu("arsip")}
          className="cursor-pointer relative bg-white text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-purple-400 hover:border-purple-500 shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1.5 duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[180px]"
          title="Klik untuk membuka arsip dokumen"
        >
          <div>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 text-purple-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-black mb-1 leading-tight">Dokumen Simpan</h3>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-2xl sm:text-4xl font-extrabold text-black leading-none">{totalArsip}</span>
            <span className="text-[9px] sm:text-[11px] text-black/40 font-bold tracking-wider uppercase">Arsip</span>
          </div>
        </div>

        {/* Stat Card 4 - Aktivitas Hari Ini */}
        <div 
          onClick={() => setMenu("asesmen")}
          className="cursor-pointer relative bg-white text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-orange-400 hover:border-orange-500 shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1.5 duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[180px]"
          title="Klik untuk membuka modul evaluasi dan asesmen"
        >
          <div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 text-orange-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-black mb-1 leading-tight">Aktivitas Hari</h3>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-2xl sm:text-4xl font-extrabold text-black leading-none">{aktivitasHariIni}</span>
            <span className="text-[9px] sm:text-[11px] text-black/40 font-bold tracking-wider uppercase">Asesmen</span>
          </div>
        </div>

      </div>

      {/* Bottom Section: Kalender */}
      <div className="grid grid-cols-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 pb-8 mt-8">
        <GlassCard className="p-6 border-[#D4AF37]/35 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                Kalender Akademik
              </h3>
              <p className="text-xs text-white/60">Klik tanggal pada kalender untuk menambah atau mengelola agenda khusus</p>
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5 self-start sm:self-auto">
              <button 
                onClick={handlePrevMonth} 
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-[#D4AF37]"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-white min-w-[110px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button 
                onClick={handleNextMonth} 
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-[#D4AF37]"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Calendar Grid */}
            <div className="w-full md:w-1/2 lg:w-[55%]">
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3 text-[#D4AF37] font-semibold uppercase tracking-wider">
                <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div className="text-rose-400">Min</div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-white">
                {daysArray.map((cell, index) => {
                  const cellEvents = allMergedEvents.filter(evt => evt.tanggal === cell.dateStr);
                  const hasEvents = cellEvents.length > 0;
                  const isSelected = cell.dateStr === selectedDateStr;
                  
                  // Highlight today's date
                  const todayObj = new Date();
                  const isToday = cell.dateStr === `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedDateStr(cell.dateStr);
                        setIsAddEventOpen(true);
                      }}
                      className={`
                        relative p-2.5 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center min-h-[44px]
                        ${cell.isCurrentMonth ? "text-white hover:bg-white/10" : "text-white/30 hover:bg-white/5"}
                        ${isSelected ? "bg-[#D4AF37]/20 border border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)] text-[#D4AF37] font-bold" : "border border-transparent"}
                        ${isToday && !isSelected ? "border border-[#D4AF37]/50 bg-white/5 font-extrabold text-[#D4AF37]" : ""}
                      `}
                    >
                      <span>{cell.day}</span>
                      
                      {/* Dots/Badges for events */}
                      {hasEvents && (
                        <span className="absolute bottom-1.5 flex gap-0.5 justify-center">
                          {cellEvents.slice(0, 3).map((evt, idx) => {
                            let dotColor = "bg-amber-400";
                            if (evt.tipe === "ulangan") dotColor = "bg-rose-400";
                            else if (evt.tipe === "tugas") dotColor = "bg-blue-400";
                            else if (evt.tipe === "sikap") dotColor = "bg-emerald-400";
                            else if (evt.tipe === "libur") dotColor = "bg-purple-400";
                            return (
                              <span 
                                key={idx} 
                                className={`w-1 h-1 rounded-full ${dotColor}`} 
                              />
                            );
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Events detail & list */}
            <div className="w-full md:w-1/2 lg:w-[45%] md:border-l border-white/10 md:pl-8 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Agenda Kegiatan Khusus</span>
                  <h4 className="text-sm font-semibold text-white mt-1">
                    Bulan {MONTH_NAMES[currentMonth]} {currentYear}
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Menampilkan hingga 5 agenda khusus terdekat di bulan ini</p>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {(() => {
                    if (visibleMonthEvents.length === 0) {
                      return (
                        <div className="text-center py-8 px-4 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-xs text-white/50">Tidak ada agenda khusus di bulan ini.</p>
                          <p className="text-[10px] text-white/40 mt-1">Klik pada salah satu tanggal kalender untuk menambahkan agenda baru.</p>
                        </div>
                      );
                    }
                    return visibleMonthEvents.map((evt) => {
                      let iconBg = "bg-amber-500/10 border-amber-500/20";
                      let iconColor = "text-amber-400";
                      let IconComponent = Sparkles;
                      let typeLabel = "Umum";

                      if (evt.tipe === "ulangan") {
                        iconBg = "bg-rose-500/10 border-rose-500/20";
                        iconColor = "text-rose-400";
                        IconComponent = FileText;
                        typeLabel = "Ulangan / Asesmen";
                      } else if (evt.tipe === "tugas") {
                        iconBg = "bg-blue-500/10 border-blue-500/20";
                        iconColor = "text-blue-400";
                        IconComponent = ClipboardList;
                        typeLabel = "Tugas / Projek";
                      } else if (evt.tipe === "sikap") {
                        iconBg = "bg-emerald-500/10 border-emerald-500/20";
                        iconColor = "text-emerald-400";
                        IconComponent = CheckCircle2;
                        typeLabel = "Asesmen Sikap";
                      } else if (evt.tipe === "libur") {
                        iconBg = "bg-purple-500/10 border-purple-500/20";
                        iconColor = "text-purple-400";
                        IconComponent = Clock;
                        typeLabel = "Libur";
                      }

                      // Extract date parts to display inside list nicely
                      const parts = evt.tanggal.split("-");
                      const dateDisplay = parts.length === 3 ? `${parseInt(parts[2])} ${MONTH_NAMES[parseInt(parts[1]) - 1].slice(0, 3)}` : evt.tanggal;

                      return (
                        <div 
                          key={evt.id} 
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group animate-in fade-in duration-300"
                        >
                          <div className="flex gap-3 items-start mr-2 min-w-0">
                            <div className={`p-1.5 rounded-lg border ${iconBg} ${iconColor} shrink-0`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${iconColor}`}>
                                  {typeLabel}
                                </span>
                                <span className="text-[10px] text-white/40">•</span>
                                <span className="text-[10px] text-white/60 font-medium">
                                  {dateDisplay}
                                </span>
                                {evt.isFromPromes && (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/20 font-bold leading-none">
                                    Promes
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-white mt-0.5 line-clamp-2">{evt.judul}</p>
                            </div>
                          </div>
                          {!evt.isFromPromes && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(evt.id);
                              }}
                              className="p-1 text-white/40 hover:text-rose-400 rounded-md hover:bg-white/5 transition-colors shrink-0"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Modal / Dialog untuk Tambah & Kelola Agenda pada Tanggal yang diklik */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="bg-[#0f2e1f] border-white/10 text-white sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#D4AF37]">
              <Calendar className="w-5 h-5" />
              Kelola Agenda: {formatIndoDate(selectedDateStr)}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Lihat, tambah, atau hapus agenda khusus untuk tanggal terpilih di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* List Agenda yang sudah terdaftar pada tanggal tersebut */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Agenda Terdaftar</span>
              <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto pr-1">
                {(() => {
                  const selectedEvents = allMergedEvents.filter(evt => evt.tanggal === selectedDateStr);
                  if (selectedEvents.length === 0) {
                    return <p className="text-xs text-white/40 italic py-2">Belum ada agenda yang terdaftar pada tanggal ini.</p>;
                  }
                  return selectedEvents.map((evt) => {
                    let iconBg = "bg-amber-500/10 border-amber-500/20";
                    let iconColor = "text-amber-400";
                    if (evt.tipe === "ulangan") {
                      iconBg = "bg-rose-500/10 border-rose-500/20";
                      iconColor = "text-rose-400";
                    } else if (evt.tipe === "tugas") {
                      iconBg = "bg-blue-500/10 border-blue-500/20";
                      iconColor = "text-blue-400";
                    } else if (evt.tipe === "sikap") {
                      iconBg = "bg-emerald-500/10 border-emerald-500/20";
                      iconColor = "text-emerald-400";
                    } else if (evt.tipe === "libur") {
                      iconBg = "bg-purple-500/10 border-purple-500/20";
                      iconColor = "text-purple-400";
                    }

                    return (
                      <div key={evt.id} className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex gap-2 items-center mr-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${iconColor} shrink-0`} />
                          <p className="text-xs text-white truncate">{evt.judul}</p>
                          {evt.isFromPromes && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold shrink-0">
                              Promes
                            </span>
                          )}
                        </div>
                        {!evt.isFromPromes && (
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="text-white/40 hover:text-rose-400 transition-colors p-1 shrink-0"
                            title="Hapus Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Form Input Agenda Baru */}
            <form onSubmit={handleAddEvent} className="border-t border-white/10 pt-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Tambah Agenda Baru</span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kuis Akhir Bab I"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(["umum", "ulangan", "tugas", "sikap", "libur"] as const).map((type) => {
                    let label = "Umum";
                    let activeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                    if (type === "ulangan") {
                      label = "Ulangan";
                      activeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/30";
                    } else if (type === "tugas") {
                      label = "Tugas";
                      activeStyle = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                    } else if (type === "sikap") {
                      label = "Sikap";
                      activeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                    } else if (type === "libur") {
                      label = "Libur";
                      activeStyle = "bg-purple-500/20 text-purple-400 border-purple-500/30";
                    }

                    const isActive = newEventType === type;

                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setNewEventType(type)}
                        className={`
                          text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all
                          ${isActive ? activeStyle : "bg-white/5 text-white/50 border-white/5 hover:text-white/80"}
                        `}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <SecondaryButton type="button" onClick={() => setIsAddEventOpen(false)}>
                  Batal
                </SecondaryButton>
                <button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="bg-[#0f2e1f] border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#D4AF37]">
              <Sparkles className="w-6 h-6" />
              {aiModalContent.title}
            </DialogTitle>
            <DialogDescription className="sr-only">Detail konten rekomendasi atau insight dari AI</DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-5 bg-black/20 rounded-xl whitespace-pre-wrap leading-relaxed text-sm md:text-base border border-white/5 font-medium shadow-inner">
            {aiModalContent.content}
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={() => setAiModalOpen(false)}>
              Tutup
            </SecondaryButton>
          </div>
        </DialogContent>
      </Dialog>
    </AppBackground>
  );
}
