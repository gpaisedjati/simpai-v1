import { useState, useEffect, useMemo, useCallback } from "react";
import { useSimpaiProfil, useSimpaiPemetaan, useSimpaiPromes, useSimpaiArsip, getActiveKelasList } from "@/lib/storage";
import { useSession } from "@/lib/session";
import { apiGenerate, apiUseQuota } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, GitBranch, CalendarDays, FileSignature, BookOpen, Sparkles, Save, Printer, Zap, Image, Download, FileText, Loader2, Palette, Target, Settings, CheckCircle2 } from "lucide-react";
import { AppBackground } from "../design-system/components/AppBackground";
import { GlassCard } from "../design-system/components/GlassCard";
import PromesWizard from "@/components/PromesWizard";

type PemetaanType = Record<string, Record<string, string>>;
type PromesType = Record<string, any>;
type ArsipType = Array<{ id: string; judul: string; tipe: string; tanggal: string; konten: string }>;

const CP_DATA: Record<string, Record<string, string>> = {
  quran: {
    "A": "Peserta didik mampu membaca huruf hijaiyyah bersambung, menghafal surah-surah pendek dalam Juz Amma, memahami pesan pokok surah tersebut dengan baik dan benar, serta menyebutkan hadis tentang keutamaan belajar ilmu.",
    "B": "Peserta didik mampu membaca Al-Qur'an dengan tartil, memahami kandungan surah-surah pilihan, menghafalkan surah-surah pendek dan ayat-ayat pilihan, serta menerapkan kandungannya dalam kehidupan.",
    "C": "Peserta didik mampu membaca Al-Qur'an dengan tajwid yang benar, menghafal dan memahami kandungan surah-surah pilihan, serta mengkaji hadis-hadis pilihan tentang akhlak mulia.",
    "D": "Peserta didik mampu membaca Al-Qur'an secara tartil, makharijul huruf yang tepat, menguasai ilmu tajwid dasar, menghafal surah-surah pendek pilihan dengan fasih, serta memahami pesan dan korelasi nilai-nilai moral sosial dalam Al-Qur'an dan Hadis.",
    "E": "Peserta didik mampu menganalisis Al-Qur'an dan Hadis secara kritis, memahami kaidah tajwid tingkat lanjut, menghafal ayat-ayat pilihan tentang tanggung jawab manusia terhadap diri, keluarga, dan masyarakat, serta menerapkannya secara bijak.",
    "F": "Peserta didik mampu menganalisis, mengevaluasi, dan menyajikan gagasan konseptual berbasis Al-Qur'an dan Hadis tentang toleransi, etos kerja, serta penyelesaian masalah kehidupan modern secara ilmiah dan teologis."
  },
  aqidah: {
    "A": "Peserta didik mengenal Allah melalui Rukun Iman, meyakini adanya Allah, malaikat, kitab-kitab, rasul-rasul, hari akhir, dan qada-qadar sebagai landasan hidup beriman.",
    "B": "Peserta didik memahami dan meyakini Rukun Iman secara lebih mendalam, mengenal Asmaulhusna, serta memperkuat keyakinan melalui pengamalan dalam kehidupan sehari-hari.",
    "C": "Peserta didik menganalisis dan mengaplikasikan Rukun Iman dalam konteks kehidupan modern, memahami sifat-sifat wajib Allah, dan memperkokoh keimanan melalui kajian dalil naqli dan aqli.",
    "D": "Peserta didik mampu menganalisis cabang-cabang iman (Syu'abul Iman), meyakini eksistensi dan keadilan Allah melalui pemahaman akal sehat, serta menangkal pemikiran menyimpang dengan pembiasaan tauhid yang kokoh.",
    "E": "Peserta didik mampu mengevaluasi doktrin akidah Islamiyah, memahami hakikat tauhid rububiyah, uluhiyah, dan asma wa sifat, serta mengaitkannya dengan kesalehan sosial dan integritas kepribadian.",
    "F": "Peserta didik mampu merumuskan argumentasi logis-teologis tentang pilar-pilar keimanan, merespons tantangan ateisme and sekularisme secara kritis-konstruktif, serta membudayakan keyakinan yang mantap dalam tindakan keseharian."
  },
  akhlak: {
    "A": "Peserta didik terbiasa mempraktikkan nilai-nilai baik dalam kehidupan sehari-hari seperti jujur, amanah, disiplin, santun kepada guru and orang tua, serta peduli terhadap sesama.",
    "B": "Peserta didik memahami dan mempraktikkan akhlak mulia dalam berbagai situasi kehidupan, menghindari akhlak tercela, dan menjaga hubungan baik dengan Allah, sesama manusia, dan lingkungan.",
    "C": "Peserta didik menganalisis pentingnya akhlak mulia dalam kehidupan bermasyarakat, mampu memberi contoh konkret, dan mempraktikkan nilai-nilai Islam dalam konteks kehidupan modern yang kompleks.",
    "D": "Peserta didik mampu membiasakan akhlak mulia kepada diri sendiri, sesama manusia, alam sekitar, dan negara, serta menghindari akhlak mazmumah (tercela) seperti ghibah, fitnah, dan permusuhan.",
    "E": "Peserta didik mampu menginternalisasi nilai-nilai akhlak mulia, melakukan refleksi diri terhadap perilaku harian, serta menunjukkan sikap toleran, moderat, dan inklusif dalam masyarakat majemuk.",
    "F": "Peserta didik mampu memimpin gerakan moral dan keteladanan sosial berbasis akhlakul karimah, mengatasi konflik interpersonal/sosial dengan pendekatan damai, serta menjadi teladan integritas di era global."
  },
  fikih: {
    "A": "Peserta didik mampu melaksanakan tata cara bersuci (thaharah), mendirikan salat wajib dan salat sunah dengan baik dan benar sesuai tuntunan syariat Islam.",
    "B": "Peserta didik mampu melaksanakan ibadah salat, puasa, zakat, dan memahami ketentuan haji serta umrah sesuai syariat, serta memahami konsep halal-haram dalam kehidupan.",
    "C": "Peserta didik mampu menganalisis ketentuan fikih muamalah, ibadah mahdhah secara mendalam, dan memahami prinsip-prinsip fikih kontemporer dalam kehidupan bermasyarakat.",
    "D": "Peserta didik mampu menganalisis ketentuan bersuci, salat jama', qashar, jenazah, zakat, puasa, haji dan umrah secara komparatif sesuai mazhab-mazhab fikih utama, serta menerapkan prinsip-prinsip fikih ibadah dalam kehidupan.",
    "E": "Peserta didik mampu menganalisis ketentuan muamalah dalam Islam seperti jual beli, syirkah, perbankan syariah, dan asuransi syariah, serta menghindari praktik riba, gharar, dan maisir.",
    "F": "Peserta didik mampu mengevaluasi isu-isu fikih kontemporer (medis, teknologi, sosial-ekonomi), merumuskan pandangan hukum Islam secara dinamis, serta berkontribusi dalam harmoni syariat dan kemaslahatan publik."
  },
  spi: {
    "A": "Peserta didik mampu menceritakan sejarah Nabi Muhammad saw. pada masa kanak-kanak dan remaja, serta mengenal sahabat-sahabat utama dan perjuangan mereka dalam menyebarkan Islam.",
    "B": "Peserta didik mampu menceritakan perkembangan Islam pada masa Khulafaur Rasyidin, dinasti Umayyah, dan Abbasiyah, serta mengambil hikmah dari peristiwa sejarah tersebut.",
    "C": "Peserta didik mampu menganalisis perkembangan peradaban Islam dari masa kejayaan hingga masa kini, serta mengidentifikasi kontribusi ilmuwan Muslim bagi peradaban dunia.",
    "D": "Peserta didik mampu menganalisis sejarah dakwah Nabi Muhammad saw. di Makkah dan Madinah, kontribusi Khulafaur Rasyidin, serta masa kejayaan Dinasti Umayyah dan Abbasiyah dalam pengembangan ilmu pengetahuan dan peradaban.",
    "E": "Peserta didik mampu menganalisis sejarah masuk dan berkembangnya Islam di Nusantara, peran ulama, kerajaan Islam, serta proses adaptasi kultural yang melahirkan corak Islam damai dan toleran.",
    "F": "Peserta didik mampu mengevaluasi kontribusi peradaban Islam di pentas dunia, proses pembaharuan pemikiran Islam modern, serta mengambil inspirasi kejayaan masa lalu untuk membangun peradaban masa depan."
  }
};

const BULAN_GANJIL = [
  { nama: "Juli", pekan: 4 }, { nama: "Agustus", pekan: 5 }, { nama: "September", pekan: 4 },
  { nama: "Oktober", pekan: 4 }, { nama: "November", pekan: 5 }, { nama: "Desember", pekan: 4 }
];
const BULAN_GENAP = [
  { nama: "Januari", pekan: 4 }, { nama: "Februari", pekan: 4 }, { nama: "Maret", pekan: 5 },
  { nama: "April", pekan: 4 }, { nama: "Mei", pekan: 5 }, { nama: "Juni", pekan: 4 }
];

const STATUS_OPTIONS = ["Normal (KBM Aktif)", "Libur Semester / Awal Tahun", "Libur Hari Besar / Cuti Bersama", "Libur Ramadhan / Idul Fitri", "Kegiatan Jeda (Class Meeting)", "Projek P5", "Sumatif Tengah Semester (STS)", "Sumatif Akhir Semester (SAS)", "Pembagian Raport"];
const STATUS_COLOR: Record<string, string> = {
  "Normal (KBM Aktif)": "bg-green-100",
  "Libur Semester / Awal Tahun": "bg-gray-100",
  "Libur Hari Besar / Cuti Bersama": "bg-red-100",
  "Libur Ramadhan / Idul Fitri": "bg-yellow-100",
  "Kegiatan Jeda (Class Meeting)": "bg-orange-100",
  "Projek P5": "bg-emerald-100",
  "Sumatif Tengah Semester (STS)": "bg-rose-100",
  "Sumatif Akhir Semester (SAS)": "bg-rose-200",
  "Pembagian Raport": "bg-blue-100",
};

const FASE_OPTIONS = [
  { value: "A-1", label: "Fase A - Kelas 1" }, { value: "A-2", label: "Fase A - Kelas 2" },
  { value: "B-3", label: "Fase B - Kelas 3" }, { value: "B-4", label: "Fase B - Kelas 4" },
  { value: "C-5", label: "Fase C - Kelas 5" }, { value: "C-6", label: "Fase C - Kelas 6" }
];

const ELEMEN = ["quran", "aqidah", "akhlak", "fikih", "spi"] as const;
const ELEMEN_LABEL: Record<string, string> = { quran: "Al-Qur'an Hadis", aqidah: "Aqidah", akhlak: "Akhlak", fikih: "Fikih", spi: "SPI (Sejarah Peradaban Islam)" };

type SubMenu = "grid" | "pemetaan" | "promes" | "rpp" | "bahan";

export default function Pembelajaran({ initialSubMenu }: { initialSubMenu?: SubMenu }) {
  const [profil] = useSimpaiProfil();
  const [pemetaan, setPemetaan] = useSimpaiPemetaan() as [PemetaanType, (v: PemetaanType | ((prev: PemetaanType) => PemetaanType)) => void];
  const [promesData, setPromesData] = useSimpaiPromes() as [PromesType, (v: PromesType) => void];
  const [arsip, setArsip] = useSimpaiArsip() as [ArsipType, (v: ArsipType) => void];
  const [promesExportHtml, setPromesExportHtml] = useState("");
  const { toast } = useToast();
  const session = useSession();

  const [subMenu, setSubMenu] = useState<SubMenu>("grid");
  const [serverCPTP, setServerCPTP] = useState<any[]>([]);

  useEffect(() => {
    if (initialSubMenu) {
      setSubMenu(initialSubMenu);
    }
  }, [initialSubMenu]);

  useEffect(() => {
    // Fetch CPTP from server if available (e.g. from Google Sheets)
    fetch("/api/admin/cp-tp")
      .then(r => r.json())
      .then(d => {
        if (d && d.data && Array.isArray(d.data)) {
          setServerCPTP(d.data);
        }
      })
      .catch(e => console.error("Failed to load CPTP", e));
  }, []);

  const getFase = (f: string) => f.split("-")[0];
  const getSemester = useCallback(() => profil.semester || "Ganjil", [profil.semester]);

  const getVal = (row: any, key: string) => {
    if (!row || typeof row !== 'object') return "";
    const lowerKey = key.toLowerCase().trim();
    
    const altKeys: Record<string, string[]> = {
      "cp": ["cp", "capaian", "capaian pembelajaran", "capaianpembelajaran"],
      "tp": ["tp", "tujuan", "tujuan pembelajaran", "tujuanpembelajaran"],
      "elemen": ["elemen", "elemen pembelajaran", "mapel", "mata pelajaran"],
      "fase": ["fase"],
      "kelas": ["kelas"],
      "materi": ["materi", "topik", "materipokok"],
      "submateri": ["submateri", "subtopik", "sub materi", "sub topik"]
    };
    
    const possibleKeys = altKeys[lowerKey] || [lowerKey];

    for (const k in row) {
      const cleanK = k.toLowerCase().trim();
      const veryCleanK = cleanK.replace(/[^a-z0-9]/g, "");
      
      if (possibleKeys.includes(cleanK) || possibleKeys.some(pk => pk.replace(/[^a-z0-9]/g, "") === veryCleanK)) {
        return row[k];
      }
    }
    return "";
  };

  const getCpText = (elm: string, f: string, kls: string) => {
    const faseName = getFase(f);
    const semesterName = getSemester();
    const elemenName = ELEMEN_LABEL[elm] || elm;

    if (serverCPTP.length > 0) {
      // Find matching row with more robust text matching
      const row = serverCPTP.find(r => {
        const rFase = String(getVal(r, "fase")).toLowerCase().replace("fase", "").trim();
        const rKelas = String(getVal(r, "kelas")).toLowerCase().trim();
        const rElemen = String(getVal(r, "elemen")).toLowerCase().trim();
        const rSemester = String(getVal(r, "semester")).toLowerCase().trim();

        const matchFase = rFase === faseName.toLowerCase().replace("fase", "").trim() || rFase.endsWith(faseName.toLowerCase().replace("fase", "").trim());
        
        // If kelas is not specified in the sheet, assume it matches the whole fase
        const matchKelas = !rKelas || rKelas === "undefined" || rKelas === "null" || 
          rKelas === kls.toString() || 
          (new RegExp(`\\b${kls}\\b`).test(rKelas));

        // If semester is not specified in the sheet, assume it matches the whole year
        const matchSemester = !rSemester || rSemester === "undefined" || rSemester === "null" ||
          rSemester === semesterName.toLowerCase().trim();
        
        const cleanRElemen = rElemen.replace(/[^a-z0-9]/g, "");
        const cleanElemenName = elemenName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanElm = elm.toLowerCase().replace(/[^a-z0-9]/g, "");

        // Fallback checks for elm directly in case they typed "quran", "spi", etc.
        const matchElemen = cleanRElemen.includes(cleanElemenName) || cleanElemenName.includes(cleanRElemen) || 
                            cleanRElemen.includes(cleanElm) || cleanElm.includes(cleanRElemen) ||
                            (elm === 'quran' && cleanRElemen.includes('quran')) ||
                            (elm === 'spi' && cleanRElemen.includes('sejarah')) ||
                            (elm === 'aqidah' && (cleanRElemen.includes('akidah') || cleanRElemen.includes('aqidah')));

        return matchFase && matchKelas && matchSemester && matchElemen;
      });
      if (row && getVal(row, "cp")) {
        let cpStr = getVal(row, "cp");
        const prefixesToRemove = [
          "Al-Qur'an dan Hadis", "Al-Qur'an Hadis", "Al Qur'an dan Hadis", "Al-Qur’an dan Hadis",
          "Akidah", "Aqidah", 
          "Akhlak", 
          "Fikih", "Fiqih",
          "Sejarah Peradaban Islam", "SPI"
        ];
        
        for (const prefix of prefixesToRemove) {
          const regex = new RegExp(`^\\s*${prefix}\\s*[:\\-\\.]?\\s*`, 'i');
          cpStr = cpStr.replace(regex, '');
        }
        return cpStr.trim();
      }
    }
    return CP_DATA[elm]?.[faseName] || "Data Capaian Pembelajaran tidak tersedia untuk fase ini.";
  };

  const getOriginalTpText = (elm: string, f: string, kls: string) => {
    if (serverCPTP.length > 0) {
      const faseName = getFase(f);
      const elemenName = ELEMEN_LABEL[elm] || elm;
      
      const rows = serverCPTP.filter(r => {
        const rFase = String(getVal(r, "fase")).toLowerCase().replace("fase", "").trim();
        const rKelas = String(getVal(r, "kelas")).toLowerCase().trim();
        const rElemen = String(getVal(r, "elemen")).toLowerCase().trim();
        const rSemester = String(getVal(r, "semester")).toLowerCase().trim();

        const matchFase = rFase === faseName.toLowerCase().replace("fase", "").trim() || rFase.endsWith(faseName.toLowerCase().replace("fase", "").trim());
        const matchKelas = !rKelas || rKelas === "undefined" || rKelas === "null" || 
          rKelas === kls.toString() || 
          (new RegExp(`\\b${kls}\\b`).test(rKelas));

        // If semester is not specified in the sheet, assume it matches the whole year
        const matchSemester = !rSemester || rSemester === "undefined" || rSemester === "null" ||
          rSemester === getSemester().toLowerCase().trim();

        const cleanRElemen = rElemen.replace(/[^a-z0-9]/g, "");
        const cleanElemenName = elemenName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanElm = elm.toLowerCase().replace(/[^a-z0-9]/g, "");

        const matchElemen = cleanRElemen.includes(cleanElemenName) || cleanElemenName.includes(cleanRElemen) || 
                            cleanRElemen.includes(cleanElm) || cleanElm.includes(cleanRElemen) ||
                            (elm === 'quran' && cleanRElemen.includes('quran')) ||
                            (elm === 'spi' && cleanRElemen.includes('sejarah')) ||
                            (elm === 'aqidah' && (cleanRElemen.includes('akidah') || cleanRElemen.includes('aqidah')));

        return matchFase && matchKelas && matchSemester && matchElemen;
      });
      if (rows.length > 0) {
        const tps = rows.map(r => getVal(r, "tp")).filter(t => !!t);
        if (tps.length > 0) {
          return tps.map(t => `- ${t}`).join("\n");
        }
      }
    }
    return "";
  };

  const getMateriInfo = (elm: string, kls: string) => {
    const elemenName = ELEMEN_LABEL[elm] || elm;
    if (serverCPTP.length > 0) {
      const row = serverCPTP.find(r => {
        const rKelas = String(getVal(r, "kelas")).toLowerCase().trim();
        const rElemen = String(getVal(r, "elemen")).toLowerCase().trim();
        const rSemester = String(getVal(r, "semester")).toLowerCase().trim();

        const matchSemester = !rSemester || rSemester === "undefined" || rSemester === "null" ||
          rSemester === getSemester().toLowerCase().trim();

        const cleanRElemen = rElemen.replace(/[^a-z0-9]/g, "");
        const cleanElemenName = elemenName.toLowerCase().replace(/[^a-z0-9]/g, "");

        return (rKelas === kls || rKelas === `kelas ${kls}`) &&
          (cleanRElemen.includes(cleanElemenName) || cleanElemenName.includes(cleanRElemen)) &&
          matchSemester;
      });
      if (row) {
        return {
           materi: String(getVal(row, "materi") || ""),
           subMateri: String(getVal(row, "submateri") || "")
        };
      }
    }
    return { materi: "", subMateri: "" };
  };

  const getTpText = (elm: string, f: string, kls: string) => {
    const key = `tp_${elm}`;
    const local = localPemetaan[key];
    if (local && local.trim() !== "") return local;
    return getOriginalTpText(elm, f, kls);
  };

  const activeKelasList = useMemo(() => {
    return getActiveKelasList(profil);
  }, [profil]);

  const activeFaseOptions = useMemo(() => {
    const getFaseFromClass = (kls: string) => {
      const clean = kls.replace(/[^0-9]/g, "");
      const n = parseInt(clean);
      if (n === 1 || n === 2) return { code: "A", label: "Fase A" };
      if (n === 3 || n === 4) return { code: "B", label: "Fase B" };
      if (n === 5 || n === 6) return { code: "C", label: "Fase C" };
      if (n === 7 || n === 8 || n === 9) return { code: "D", label: "Fase D" };
      if (n === 10) return { code: "E", label: "Fase E" };
      if (n === 11 || n === 12) return { code: "F", label: "Fase F" };
      return { code: "A", label: "Fase A" };
    };

    return activeKelasList.map((kls) => {
      const f = getFaseFromClass(kls);
      return {
        value: `${f.code}-${kls}`,
        label: `${f.label} - Kelas ${kls}`
      };
    });
  }, [activeKelasList]);

  const [fase, setFase] = useState("A-1");
  const [kelasPromes, setKelasPromes] = useState("1");

  useEffect(() => {
    if (activeKelasList.length > 0 && !activeKelasList.map(String).includes(kelasPromes)) {
      setKelasPromes(String(activeKelasList[0]));
    }
  }, [activeKelasList, kelasPromes]);

  useEffect(() => {
    if (activeFaseOptions.length > 0 && !activeFaseOptions.some(f => f.value === fase)) {
      setFase(activeFaseOptions[0].value);
    }
  }, [activeFaseOptions, fase]);

  const [isGenerated, setIsGenerated] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formatIndonesianDate = (date: Date) => {
    const bulanNama = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const tgl = date.getDate();
    const bln = bulanNama[date.getMonth()];
    const thn = date.getFullYear();
    return `${tgl} ${bln} ${thn}`;
  };

  const getKelasNumber = (): number => {
    if (subMenu === "pemetaan") {
      const parts = fase.split("-");
      if (parts.length > 1) {
        return parseInt(parts[1]) || 1;
      }
      return 1;
    }
    if (subMenu === "promes") {
      return parseInt(kelasPromes) || 1;
    }
    if (subMenu === "rpp") {
      return parseInt(rppForm.kelas) || 1;
    }
    return 1;
  };

  const isLandscapeMode = (): boolean => {
    if (subMenu === "pemetaan" || subMenu === "promes") {
      return true;
    }
    return false;
  };

  const getJudulHalamanAktif = (): string => {
    if (subMenu === "pemetaan") {
      return "PEMETAAN CAPAIAN PEMBELAJARAN, TUJUAN PEMBELAJARAN, DAN ALUR TUJUAN PEMBELAJARAN";
    }
    if (subMenu === "promes") {
      return "PROGRAM TAHUNAN & PROGRAM SEMESTER (PROTA & PROMES)";
    }
    if (subMenu === "rpp") {
      return "RENCANA PELAKSANAAN PEMBELAJARAN / MODUL AJAR (RPM)";
    }
    if (subMenu === "bahan") {
      return `BAHAN AJAR EKSTRA: ${(bahanJenis || "Ringkasan Materi").toUpperCase()}`;
    }
    return "ADMINISTRASI PEMBELAJARAN";
  };

  const generateExportHtml = (isWord: boolean = false) => {
    const selectedFaseLabel = activeFaseOptions.find(o => o.value === fase)?.label || fase;
    const currentSemester = getSemester();
    const formattedDate = formatIndonesianDate(new Date());

    const activeKelas = getKelasNumber();
    const isLandscape = isLandscapeMode();
    const judulAktif = getJudulHalamanAktif();

    const COLOR_MAP: Record<number, { bg: string; text: string }> = {
      1: { bg: "#C8E6C9", text: "#000000" },
      2: { bg: "#A5D6A7", text: "#000000" },
      3: { bg: "#81C784", text: "#000000" },
      4: { bg: "#66BB6A", text: "#FFFFFF" },
      5: { bg: "#4CAF50", text: "#FFFFFF" },
      6: { bg: "#43A047", text: "#FFFFFF" },
      7: { bg: "#26A69A", text: "#FFFFFF" },
      8: { bg: "#00897B", text: "#FFFFFF" },
      9: { bg: "#00695C", text: "#FFFFFF" },
      10: { bg: "#2E7D32", text: "#FFFFFF" },
      11: { bg: "#1B5E20", text: "#FFFFFF" },
      12: { bg: "#0D5302", text: "#FFFFFF" },
    };

    const activeColor = COLOR_MAP[activeKelas] || { bg: "#1B5E20", text: "#FFFFFF" };

    const formatCellText = (text: string) => {
      if (!text) return "-";
      return text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          if (line.startsWith("-") || line.startsWith("*")) {
            return `&bull; ${line.substring(1).trim()}`;
          }
          return line;
        })
        .join("<br>");
    };

    const formatTextToHtml = (text: string) => {
      if (!text) return "";
      return text
        .split("\n")
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith("###")) {
            return `<h3 class="heading-poin">${trimmed.replace(/^###\s*/, "")}</h3>`;
          }
          if (trimmed.startsWith("##")) {
            return `<h2 class="heading-poin">${trimmed.replace(/^##\s*/, "")}</h2>`;
          }
          if (trimmed.startsWith("#")) {
            return `<h2 class="heading-poin">${trimmed.replace(/^#\s*/, "")}</h2>`;
          }
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            return `<div style="margin-left: 15px; text-align: justify; margin-top: 4px; font-size: 10pt;">&bull; ${trimmed.substring(1).trim()}</div>`;
          }
          if (/^\d+\./.test(trimmed)) {
            return `<div style="margin-left: 15px; font-weight: bold; margin-top: 8px; text-align: justify; font-size: 10pt;">${trimmed}</div>`;
          }
          if (trimmed.length === 0) {
            return `<div style="height: 10px;"></div>`;
          }
          let processedLine = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          return `<p style="text-align: justify; margin: 6px 0; line-height: 1.5; font-size: 10.5pt; text-indent: 10px;">${processedLine}</p>`;
        })
        .join("");
    };

    let innerContentHtml = "";

    if (subMenu === "pemetaan") {
      const rowsHtml = ELEMEN.map((elm, index) => {
        const cpText = getCpText(elm, fase, getKelasNumber().toString());
        const tpText = getTpText(elm, fase, getKelasNumber().toString()) || "-";
        const atpText = localPemetaan[`atp_${elm}`] || "-";

        return `
          <tr>
            <td style="border: 1px solid black; padding: 10px; text-align: center; vertical-align: top;">${index + 1}</td>
            <td style="border: 1px solid black; padding: 10px; font-weight: bold; vertical-align: top;">${ELEMEN_LABEL[elm]}</td>
            <td style="border: 1px solid black; padding: 10px; text-align: justify; vertical-align: top;">${formatCellText(cpText)}</td>
            <td style="border: 1px solid black; padding: 10px; text-align: justify; vertical-align: top;">${formatCellText(tpText)}</td>
            <td style="border: 1px solid black; padding: 10px; text-align: justify; vertical-align: top;">${formatCellText(atpText)}</td>
          </tr>
        `;
      }).join("");

      innerContentHtml = `
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 15%;">Elemen Pembelajaran</th>
              <th style="width: 25%;">Capaian Pembelajaran (CP)</th>
              <th style="width: 30%;">Tujuan Pembelajaran (TP)</th>
              <th style="width: 25%;">Alur Tujuan Pembelajaran (ATP)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } else if (subMenu === "promes") {
      innerContentHtml = promesExportHtml;
    } else if (subMenu === "rpp") {
      innerContentHtml = `
        <div class="content-text-area" style="margin-top: 15px; margin-bottom: 30px;">
          ${rppOutput}
        </div>
      `;
    } else if (subMenu === "bahan") {
      innerContentHtml = `
        <div class="content-text-area" style="margin-top: 15px; margin-bottom: 30px;">
          ${formatTextToHtml(bahanOutput)}
        </div>
      `;
    }

    const logoSrc = isWord && profil.logoSekolahBase64 ? "cid:school-logo" : (profil.logoSekolahBase64 || "");

    const isRpp = subMenu === "rpp";

    const htmlBody = `
  <div class="Section1">
    ${!isRpp ? `
    <!-- KOP DOKUMEN DENGAN LOGO DAN RATA TENGAH -->
    <table class="kop-table" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: none !important;">
      <tr style="border: none !important;">
        ${profil.logoSekolahBase64 ? `
        <td class="kop-logo" style="width: 3cm; text-align: left; vertical-align: middle; padding-right: 15px; border: none !important;">
          <img width="113" height="113" src="${logoSrc}" style="width: 3cm; height: auto; max-height: 3cm; object-fit: contain; display: block;" />
        </td>
        ` : ''}
        <td class="kop-text" style="text-align: center; vertical-align: middle; border: none !important; ${!profil.logoSekolahBase64 ? 'width: 100%;' : ''}">
          <div class="header-title" style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">${judulAktif}</div>
          <div class="header-subtitle" style="font-weight: bold; font-size: 11pt; margin-top: 4px; line-height: 1.3;">Mata Pelajaran Pendidikan Agama Islam dan Budi Pekerti</div>
        </td>
      </tr>
    </table>

    <!-- GARIS PEMBATAS DOUBLE TEBAL -->
    <hr class="kop-divider" />

    <table class="info-table">
      <tr>
        <td style="width: 140px;">Nama Sekolah</td>
        <td style="width: 15px;">:</td>
        <td style="font-weight: bold;">${profil.namaSekolah || "-"}</td>
      </tr>
      <tr>
        <td>Fase / Kelas</td>
        <td>:</td>
        <td style="font-weight: bold;">${
          subMenu === "pemetaan"
            ? selectedFaseLabel
            : subMenu === "promes"
            ? `Fase ${fase.split("-")[0]} / Kelas ${kelasPromes}`
            : (subMenu as string) === "rpp"
            ? `Fase ${fase.split("-")[0]} / Kelas ${rppForm.kelas}`
            : `Kelas ${rppForm.kelas}`
        }</td>
      </tr>
      <tr>
        <td>Semester</td>
        <td>:</td>
        <td style="font-weight: bold;">Semester ${currentSemester || "-"}</td>
      </tr>
      <tr>
        <td>Tahun Ajaran</td>
        <td>:</td>
        <td style="font-weight: bold;">${profil.tahunPelajaran || "-"}</td>
      </tr>
    </table>
    ` : ''}

    ${innerContentHtml}

    <table class="signature-table">
      <tr>
        <td>
          Mengetahui,<br>
          Kepala Sekolah
          <br><br><br><br><br>
          <span style="font-weight: bold; text-decoration: underline;">${profil.namaKS || "..................................................."}</span><br>
          NIP. ${profil.nipKS || "..................................................."}
        </td>
        <td>
          ${profil.tempatPengesahan || "Lumajang"}, ${formattedDate}<br>
          Guru Mata Pelajaran PAI
          <br><br><br><br><br>
          <span style="font-weight: bold; text-decoration: underline;">${profil.namaGuru || "..................................................."}</span><br>
          NIP. ${profil.nipGuru || "..................................................."}
        </td>
      </tr>
    </table>

    <div class="footer-note">
      "Dokumen ini disusun menggunakan pendekatan Deep Learning dengan penyesuaian Taksonomi Bloom dan SOLO melalui SIMPAI SeDjati."
    </div>
  </div>
    `;

    const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${judulAktif}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* Word & Browser Landscape/Portrait Definition */
    @page Section1 {
      size: ${isLandscape ? "841.9pt 595.3pt" : "595.3pt 841.9pt"}; /* A4 Landscape or Portrait */
      mso-page-orientation: ${isLandscape ? "landscape" : "portrait"};
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
      color: #000000;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .kop-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: none !important;
    }
    .kop-table td {
      border: none !important;
      padding: 0;
    }
    .kop-logo {
      width: 3cm;
      text-align: left;
      vertical-align: middle;
      padding-right: 15px;
    }
    .kop-text {
      text-align: center;
      vertical-align: middle;
    }
    .header-title {
      font-weight: bold;
      font-size: 13pt;
      text-transform: uppercase;
      line-height: 1.3;
    }
    .header-subtitle {
      font-weight: bold;
      font-size: 11pt;
      margin-top: 4px;
      line-height: 1.3;
    }
    .kop-divider {
      border: 0;
      border-top: 4px double #000000;
      height: 0;
      margin-top: 5px;
      margin-bottom: 20px;
      width: 100%;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .info-table td {
      padding: 3px 0;
      font-size: 10pt;
      border: none !important;
    }
    .main-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 9.5pt;
    }
    .main-table th {
      border: 1px solid #000000;
      padding: 8px 6px;
      font-weight: bold;
      text-align: center;
      background-color: ${activeColor.bg} !important;
      color: ${activeColor.text} !important;
      vertical-align: middle;
    }
    .main-table td {
      border: 1px solid #000000;
      padding: 8px 6px;
      vertical-align: top !important;
      text-align: justify !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    h2, h3, h4, h5, h6, .heading-poin {
      background-color: ${activeColor.bg} !important;
      color: ${activeColor.text} !important;
      padding: 4px 8px;
      margin-top: 15px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-weight: bold;
      text-transform: uppercase;
    }
    h2 { font-size: 12pt; }
    h3 { font-size: 11pt; }
    h4 { font-size: 10pt; }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      page-break-inside: avoid;
    }
    .signature-table td {
      width: 50%;
      vertical-align: top;
      border: none !important;
      font-size: 10pt;
      text-align: center !important;
    }
    .footer-note {
      margin-top: 40px;
      font-size: 8.5pt;
      font-style: italic;
      border-top: 1px solid #cccccc;
      padding-top: 6px;
      text-align: left;
    }
    h1, h2, h3, h4, h5, h6, .heading-poin, .heading-utama {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    p {
      page-break-inside: auto !important;
      break-inside: auto !important;
      orphans: 2;
      widows: 2;
    }
    li, .content-text-area div {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      @page {
        size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
        margin: 1.5cm 1cm 1.5cm 1.5cm;
      }
      body {
        -webkit-print-color-adjust: exact;
      }
      .main-table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      h2, h3, h4, h5, h6, .heading-poin, .heading-utama {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

    if (!isWord) {
      return fullHtml;
    }

    // Convert to MHTML with embedded logo if logo base64 is available
    if (profil.logoSekolahBase64) {
      const matches = profil.logoSekolahBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const rawBase64 = matches[2];

        return `MIME-Version: 1.0
Content-Type: multipart/related; boundary="next-part"; type="text/html"

--next-part
Content-Type: text/html; charset="utf-8"
Content-Location: main.html

${fullHtml}

--next-part
Content-Type: ${contentType}
Content-Transfer-Encoding: base64
Content-Location: school-logo

${rawBase64}

--next-part--
`;
      }
    }

    return fullHtml;
  };

  const downloadWord = async () => {
    if (session.kuotaSisa <= 0) {
      toast({ title: "Kuota Habis", description: "Kuota ekspor Anda telah habis. Silakan hubungi Administrator untuk penambahan kuota.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const result = await apiUseQuota(session.username);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);

      const html = generateExportHtml(true);
      const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      const cleanTitle = getJudulHalamanAktif().replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
      a.href = url;
      a.download = `${cleanTitle}_Kelas_${getKelasNumber()}_Sem_${getSemester()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Ekspor Berhasil", description: "Dokumen berhasil diunduh dalam format Word (.doc)." });
      setIsExportModalOpen(false);
    } catch (err: unknown) {
      toast({ title: "Gagal Ekspor", description: err instanceof Error ? err.message : "Terjadi kesalahan saat memotong kuota.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    if (session.kuotaSisa <= 0) {
      toast({ title: "Kuota Habis", description: "Kuota ekspor Anda telah habis. Silakan hubungi Administrator untuk penambahan kuota.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const result = await apiUseQuota(session.username);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);

      const html = generateExportHtml();

      // Try opening a new window/tab first for reliable sandboxed iframe bypass
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        // Fallback in case onload does not fire immediately
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (e) {
            console.warn("Print failed in popup window", e);
          }
        }, 800);
      } else {
        // Fallback to iframe printing if a popup blocker is active
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();

          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        }
      }

      toast({ title: "Ekspor Berhasil", description: "Dokumen berhasil diproses. Gunakan menu print browser untuk menyimpan sebagai PDF." });
      setIsExportModalOpen(false);
    } catch (err: unknown) {
      toast({ title: "Gagal Ekspor", description: err instanceof Error ? err.message : "Terjadi kesalahan saat memotong kuota.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setIsGenerated(false);
  }, [fase]);

  const [jtmSetting, setJtmSetting] = useState("2");
  const [tableRows, setTableRows] = useState<Array<{ bulan: string; pekanKe: number; status: string; materi: string; jp: string }>>([]);
  const [tableShown, setTableShown] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [rppFocus, setRppFocus] = useState<string>("all");

  const [rppForm, setRppForm] = useState({ 
    kelas: "1", 
    elemen: "quran", 
    materi: "", 
    subMateri: "", 
    alokasi: "", 
    metode: "",
    allTps: "",
    isModified: false
  });

  const getMeetingNumbers = () => {
    if (!rppOutput) return [1];
    const matches = rppOutput.match(/Pertemuan\s+(?:ke-)?(\d+)/gi);
    if (!matches) return [1];
    const nums = matches.map(m => {
      const match = m.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }).filter((n): n is number => n !== null);
    const uniqueNums = Array.from(new Set(nums)).sort((a, b) => a - b);
    return uniqueNums.length > 0 ? uniqueNums : [1];
  };

  const getFilteredRppOutput = () => {
    return rppOutput || "";
  };

  useEffect(() => {
    const kls = rppForm.kelas;
    const n = parseInt(kls.replace(/[^0-9]/g, "")) || 1;
    let f = "A";
    if (n === 3 || n === 4) f = "B";
    if (n === 5 || n === 6) f = "C";

    const key = `${f}-${kls}_${getSemester()}`;
    const localPemetaan = pemetaan[key] || {};
    const text = localPemetaan[`atp_${rppForm.elemen}`] || "";

    const promesStoreKey = `${f}-${kls}_${getSemester()}`;
    const promesDataObj = promesData[promesStoreKey] || {};
    const jpDist = promesDataObj.jp || {};

    let totalJp = 0;
    const lines = text.split("\n").filter(l => l.trim().length > 0);
    const tpTexts: string[] = [];
    
    lines.forEach((l, i) => {
      let match = l.match(/^(\d+\.\d+|\-)\s(.*)/);
      if (match) {
        const atpId = `${rppForm.elemen}_${i}`;
        totalJp += (Number(jpDist[atpId]) || 0);
        tpTexts.push(match[2]);
      }
    });

    let alokasi = "";
    if (totalJp > 0) {
      const jtm = parseInt(promesDataObj.jtm || jtmSetting) || 3;
      const pertemuan = Math.ceil(totalJp / jtm);
      alokasi = `${totalJp} x 35 Menit (${pertemuan} Pertemuan)`;
    } else {
      // Fallback jika tidak ada di promes
      const jtm = parseInt(jtmSetting) || 3;
      const defaultJp = jtm * 4; // Asumsi 4 pertemuan per materi
      alokasi = `${defaultJp} x 35 Menit (4 Pertemuan)`;
    }
    
    const { materi, subMateri } = getMateriInfo(rppForm.elemen, rppForm.kelas);
    const origTpText = getOriginalTpText(rppForm.elemen, f, kls);
    const origLines = origTpText.split("\n").filter(l => l.trim().length > 0);
    const isModified = lines.length !== origLines.length || tpTexts.join("") !== origLines.map(l => {
      let m = l.match(/^(\d+\.\d+|\-)\s(.*)/);
      return m ? m[2] : "";
    }).join("");

    setRppForm(prev => {
      const newMateri = isModified ? "" : (materi || prev.materi);
      const newSubMateri = isModified ? "" : (subMateri || prev.subMateri);
      const newAllTps = tpTexts.join("\n");
      
      if (prev.alokasi === alokasi && prev.allTps === newAllTps && prev.materi === newMateri && prev.subMateri === newSubMateri && prev.isModified === isModified) {
        return prev;
      }

      return { 
        ...prev, 
        alokasi, 
        allTps: newAllTps,
        materi: newMateri, 
        subMateri: newSubMateri,
        isModified
      };
    });
  }, [pemetaan, promesData, rppForm.kelas, rppForm.elemen, getSemester, serverCPTP, jtmSetting]);

  useEffect(() => {
    if (activeKelasList.length > 0 && !activeKelasList.map(String).includes(rppForm.kelas)) {
      setRppForm(p => ({ ...p, kelas: String(activeKelasList[0]) }));
    }
  }, [activeKelasList, rppForm.kelas]);
  const [rppOutput, setRppOutput] = useState("");
  const [rppLoading, setRppLoading] = useState(false);
  const [rppLoadingStep, setRppLoadingStep] = useState(0);

  const [bahanJenis, setBahanJenis] = useState("");
  const [bahanTopik, setBahanTopik] = useState("");
  const [bahanOutput, setBahanOutput] = useState("");
  const [bahanLoading, setBahanLoading] = useState(false);

  const getPemetaanKey = () => `${fase}_${getSemester()}`;
  const localPemetaan = pemetaan[getPemetaanKey()] || {};

  const updatePemetaan = (field: string, value: string) => {
    const key = getPemetaanKey();
    setPemetaan((prev: any) => {
      const currentObj = prev || {};
      const currentLocal = currentObj[key] || {};
      return {
        ...currentObj,
        [key]: {
          ...currentLocal,
          [field]: value
        }
      };
    });
  };

  const updatePemetaanMultiple = (updates: Record<string, string>) => {
    const key = getPemetaanKey();
    setPemetaan((prev: any) => {
      const currentObj = prev || {};
      const currentLocal = currentObj[key] || {};
      return {
        ...currentObj,
        [key]: {
          ...currentLocal,
          ...updates
        }
      };
    });
  };

  const generateAI = async () => {
    setIsGenerated(false);
    setAiLoading(true);
    try {
      const newUpdates: Record<string, string> = {};

      for (let i = 0; i < ELEMEN.length; i++) {
        const elm = ELEMEN[i];
        const cp_input = getCpText(elm, fase, getKelasNumber().toString());
        const tp_input = getTpText(elm, fase, getKelasNumber().toString());
        const tp_original = getOriginalTpText(elm, fase, getKelasNumber().toString());
        const is_tp_modified = tp_input !== tp_original;
        
        const urutan_elemen = getSemester().toLowerCase() === "genap" ? i + 6 : i + 1;
        
        const result = await apiGenerate(session.username, "pemetaan", {
          fase: `Fase ${getFase(fase)}`, elemen: ELEMEN_LABEL[elm], semester: getSemester(),
          cp_input, tp_input, is_tp_modified: is_tp_modified ? "true" : "",
          urutan_elemen: String(urutan_elemen)
        });

        const text = result.hasil || "";
        const lines = text.split("\n");

        let tpLines: string[] = [];
        let atpLines: string[] = [];
        let currentSection: "none" | "tp" | "atp" = "none";

        for (const line of lines) {
          const upperLine = line.replace(/[*#_]/g, "").toUpperCase().trim();
          if (upperLine.includes("START_TP") || upperLine.includes("[START_TP]")) {
            currentSection = "tp";
            continue;
          } else if (upperLine.includes("END_TP") || upperLine.includes("[END_TP]")) {
            currentSection = "none";
            continue;
          } else if (upperLine.includes("START_ATP") || upperLine.includes("[START_ATP]")) {
            currentSection = "atp";
            continue;
          } else if (upperLine.includes("END_ATP") || upperLine.includes("[END_ATP]")) {
            currentSection = "none";
            continue;
          }

          if (currentSection === "tp") {
            tpLines.push(line);
          } else if (currentSection === "atp") {
            atpLines.push(line);
          }
        }

        let tp = tpLines.join("\n").trim();
        let atp = atpLines.join("\n").trim();

        // Fallback if parsing didn't find specific section headers
        if (!tp || !atp) {
          const tpStart = lines.findIndex(l => l.toUpperCase().includes("TUJUAN PEMBELAJARAN") || l.toUpperCase().includes("START_TP") || l.toUpperCase().includes("[START_TP]"));
          const atpStart = lines.findIndex(l => l.toUpperCase().includes("ALUR TUJUAN") || l.toUpperCase().includes("START_ATP") || l.toUpperCase().includes("[START_ATP]"));
          
          if (tpStart >= 0 && atpStart >= 0) {
            tp = lines.slice(tpStart + 1, atpStart > tpStart ? atpStart : tpStart + 10).join("\n").trim();
            atp = lines.slice(atpStart + 1).join("\n").trim();
          } else {
            const mid = Math.floor(lines.length / 2);
            tp = lines.slice(0, mid).join("\n").trim();
            atp = lines.slice(mid).join("\n").trim();
          }
        }

        // Clean up markdown bolding, tags, etc.
        const cleanContent = (str: string) => {
          return str
            .replace(/^[#*\-\s\d.:]+(TUJUAN PEMBELAJARAN|ALUR TUJUAN PEMBELAJARAN|TP|ATP)[#*\-\s\d.:]*/gi, "")
            .replace(/\[?START_TP\]?/gi, "")
            .replace(/\[?END_TP\]?/gi, "")
            .replace(/\[?START_ATP\]?/gi, "")
            .replace(/\[?END_ATP\]?/gi, "")
            .trim();
        };

        tp = cleanContent(tp);
        atp = cleanContent(atp);

        if (tp_input && tp_input.trim() !== "") {
          newUpdates[`tp_${elm}`] = tp_input;
        } else {
          newUpdates[`tp_${elm}`] = tp || "Gagal memproses hasil generate TP.";
        }
        newUpdates[`atp_${elm}`] = atp || "Gagal memproses hasil generate ATP.";

        // We update the state with ALL accumulated updates up to this iteration, 
        // entirely preventing previous iterations from being lost due to state timing.
        updatePemetaanMultiple({ ...newUpdates });

        session.setKuota(result.kuotaSisa, result.kuotaMaks);
      }
      setIsGenerated(true);
      toast({ title: "AI Berhasil", description: "TP & ATP berhasil dirumuskan oleh Gemini AI." });
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const simpanPemetaan = () => {
    toast({ title: "Tersimpan", description: `Pemetaan ${activeFaseOptions.find(f => f.value === fase)?.label} berhasil disimpan.` });
  };

  const gelarKalender = () => {
    const bulan = getSemester() === "Ganjil" ? BULAN_GANJIL : BULAN_GENAP;
    const rows: typeof tableRows = [];
    bulan.forEach((b) => {
      for (let i = 1; i <= b.pekan; i++) {
        rows.push({ bulan: b.nama, pekanKe: i, status: "Normal (KBM Aktif)", materi: "", jp: jtmSetting });
      }
    });
    setTableRows(rows);
    setTableShown(true);
  };

  const updateRow = (idx: number, field: string, value: string) => {
    setTableRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const simpanPromes = () => {
    const kls = getKelasNumber();
    const key = `${kls}_${getSemester()}`;
    setPromesData({ ...promesData, [key]: tableRows.map(r => ({ status: r.status, materi: r.materi, jp: r.jp })) });
    const id = `promes_${Date.now()}`;
    setArsip([...arsip, { id, judul: `Promes Kelas ${kls} - Semester ${getSemester()} ${profil.tahunPelajaran}`, tipe: "Promes", tanggal: new Date().toLocaleDateString("id-ID"), konten: JSON.stringify(tableRows) }]);
    toast({ title: "Tersimpan", description: "Promes berhasil disimpan ke Arsip." });
  };

  const generateRPP = async () => {
    if (rppForm.isModified && !rppForm.materi) { toast({ title: "Isi materi pokok dulu", variant: "destructive" }); return; }
    
    setRppLoading(true);
    setRppLoadingStep(1); // Menganalisis Kebutuhan
    
    let stepProgress = 1;
    const progressInterval = setInterval(() => {
      stepProgress++;
      if (stepProgress <= 4) {
        setRppLoadingStep(stepProgress);
      } else {
        clearInterval(progressInterval);
      }
    }, 4000); // advance every 4 seconds

    try {
      const kls = getKelasNumber();
      const elemenLabel = ELEMEN_LABEL[rppForm.elemen as keyof typeof ELEMEN_LABEL] || rppForm.elemen;
      
      const COLOR_MAP: Record<number, { bg: string; text: string }> = {
        1: { bg: "#C8E6C9", text: "#000000" },
        2: { bg: "#A5D6A7", text: "#000000" },
        3: { bg: "#81C784", text: "#000000" },
        4: { bg: "#66BB6A", text: "#FFFFFF" },
        5: { bg: "#4CAF50", text: "#FFFFFF" },
        6: { bg: "#43A047", text: "#FFFFFF" },
        7: { bg: "#26A69A", text: "#FFFFFF" },
        8: { bg: "#00897B", text: "#FFFFFF" },
        9: { bg: "#00695C", text: "#FFFFFF" },
        10: { bg: "#2E7D32", text: "#FFFFFF" },
        11: { bg: "#1B5E20", text: "#FFFFFF" },
        12: { bg: "#0D5302", text: "#FFFFFF" },
      };
      const activeColor = COLOR_MAP[kls] || { bg: "#1B5E20", text: "#FFFFFF" };
      
      // Islamic style cover template
      const coverHtml = `<div style="page-break-after: always; box-sizing: border-box; border: 8px double ${activeColor.bg}; padding: 12px; margin: 0; height: 26cm; text-align: center; background-color: #fdfbf7;">
  <div style="border: 2px solid ${activeColor.bg}; padding: 20px; height: calc(100% - 4px); box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; align-items: center; background-image: radial-gradient(${activeColor.bg}30 0.5px, transparent 0.5px); background-size: 15px 15px;">
    
    <div style="width: 100%; margin-bottom: 10px; background: rgba(253, 251, 247, 0.9); padding: 15px; border-radius: 10px;">
      <h1 style="font-size: 26pt; margin: 0; color: #166534; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">RENCANA PEMBELAJARAN MENDALAM</h1>
      <h2 style="font-size: 14pt; margin: 8px 0 0 0; color: #333; font-weight: 600; letter-spacing: 1px;">PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
    </div>

    <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; margin: 10px 0;">
      ${profil.logoSekolahBase64 ? `<img src="${profil.logoSekolahBase64}" alt="Logo" style="width: 110px; height: auto;" />` : `<div style="font-size: 50pt; color: #D4AF37;">✧</div>`}
    </div>

    <div style="background-color: white; border: 2px solid #D4AF37; padding: 15px 30px; border-radius: 8px; width: 85%; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 10px; position: relative;">
      <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: #D4AF37; font-size: 20px;">❁</div>
      <table style="width: 100%; text-align: left; font-size: 12pt; border-collapse: collapse; margin-top: 5px;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 40%; color: #166534;">Materi Pokok</td><td style="padding: 6px 0;">: ${rppForm.materi || elemenLabel}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Fase / Kelas</td><td style="padding: 6px 0;">: ${fase} / ${kls}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Semester</td><td style="padding: 6px 0;">: ${getSemester()}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Alokasi Waktu</td><td style="padding: 6px 0;">: ${rppForm.alokasi}</td></tr>
      </table>
      <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: #D4AF37; font-size: 20px;">❁</div>
    </div>

    <div style="width: 100%; background: rgba(253, 251, 247, 0.9); padding: 15px; border-radius: 10px;">
      <p style="font-size: 11pt; margin: 0 0 8px 0; color: #555;">Disusun Oleh:</p>
      <h3 style="font-size: 16pt; margin: 0 0 8px 0; color: #166534; font-weight: bold; text-decoration: underline;">${profil.namaGuru || "Nama Guru"}</h3>
      <p style="font-size: 13pt; margin: 0 0 4px 0; font-weight: 600;">${profil.namaSekolah || "Nama Sekolah"}</p>
      <p style="font-size: 11pt; margin: 0; color: #666;">Tahun Ajaran ${profil.tahunPelajaran}</p>
    </div>

  </div>
  </div>`;
      
      const calculateDistribusiPertemuan = () => {
        const n = parseInt(String(kls).replace(/[^0-9]/g, "")) || 1;
        let f = "A";
        if (n === 3 || n === 4) f = "B";
        if (n === 5 || n === 6) f = "C";

        const key = `${f}-${kls}_${getSemester()}`;
        const localPemetaan = pemetaan[key] || {};
        const atpText = localPemetaan[`atp_${rppForm.elemen}`] || "";

        const promesStoreKey = `${f}-${kls}_${getSemester()}`;
        const promesDataObj = promesData[promesStoreKey] || {};
        const jpDist = promesDataObj.jp || {};
        const jtm = parseInt(promesDataObj.jtm || jtmSetting) || 3;

        const lines = atpText.split("\n").filter(l => l.trim().length > 0);
        const items: { text: string; jp: number }[] = [];

        lines.forEach((l, i) => {
          let match = l.match(/^(\d+\.\d+|\-)\s(.*)/);
          if (match) {
            const atpId = `${rppForm.elemen}_${i}`;
            const jp = Number(jpDist[atpId]) || 0;
            if (jp > 0) {
              items.push({ text: match[2], jp });
            }
          }
        });

        if (items.length === 0) return [];

        const totalJp = items.reduce((acc, curr) => acc + curr.jp, 0);
        const numMeetings = Math.ceil(totalJp / jtm);

        const distrib: { fokusMateri: string; tps: string }[] = [];
        const slots: number[] = [];
        items.forEach((item, idx) => {
          for (let s = 0; s < item.jp; s++) {
            slots.push(idx);
          }
        });

        for (let m = 0; m < numMeetings; m++) {
          const startSlot = m * jtm;
          const endSlot = Math.min((m + 1) * jtm, slots.length);
          if (startSlot < slots.length) {
            const coveredIndices = Array.from(new Set(slots.slice(startSlot, endSlot)));
            const coveredTps = coveredIndices.map(idx => items[idx].text);
            distrib.push({
              fokusMateri: coveredTps.join(" dan "),
              tps: coveredTps.map((tp, idx2) => `${idx2 + 1}. ${tp}`).join("\n")
            });
          }
        }
        return distrib;
      };

      const distribusi = calculateDistribusiPertemuan();

      const result = await apiGenerate(session.username, "rpp", {
        kelas: String(kls), 
        materi: rppForm.materi, 
        subMateri: rppForm.subMateri,
        elemen: ELEMEN_LABEL[rppForm.elemen as keyof typeof ELEMEN_LABEL],
        alokasi: rppForm.alokasi, 
        metode: rppForm.metode,
        tp_input: rppForm.allTps,
        distribusiPertemuan: JSON.stringify(distribusi),
        namaGuru: profil.namaGuru, namaSekolah: profil.namaSekolah,
        namaKS: profil.namaKS, nipKS: profil.nipKS, nipGuru: profil.nipGuru,
        tahunPelajaran: profil.tahunPelajaran, semester: profil.semester,
        tempatPengesahan: profil.tempatPengesahan,
      });

      clearInterval(progressInterval);
      setRppLoadingStep(5); // Finalisasi Rendering
      
      // Give UI time to update
      await new Promise(r => setTimeout(r, 600));

      // Format markdown content with class-specific colors
      let inTable = false;
      let inIdentity = false;
      let currentIndent = 20;

      const formattedContentLines = result.hasil.split("\n").map((line: string) => {
        const leadingSpacesMatch = line.match(/^(\s+)/);
        const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1].length : 0;
        
        let trimmed = line.trim();
        
        let prepend = "";
        
        // Identity Section detection
        const identityMatch = trimmed.match(/^\*\*([^:*]+)[:]*\*\*\s*[:]?\s*(.+)/);
        if (identityMatch && !trimmed.includes("|")) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          if (!inIdentity) {
            inIdentity = true;
            prepend += `<table style="width: 100%; border: none; margin-top: 10px; margin-bottom: 20px; font-size: 11pt; line-height: 1.6; margin-left: 20px;">`;
          }
          const label = identityMatch[1].trim();
          const value = identityMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').trim();
          return `${prepend}<tr><td style="width: 220px; font-weight: bold; vertical-align: top; padding: 4px 0;">${label}</td><td style="width: 15px; vertical-align: top; padding: 4px 0;">:</td><td style="vertical-align: top; padding: 4px 0;">${value}</td></tr>`;
        } else if (trimmed !== "") {
          if (inIdentity) { inIdentity = false; prepend += "</table>"; }
        }

        // List detection BEFORE bold/italic
        let isNumeric = false;
        let isAlpha = false;
        let isBullet = false;
        let isSubBullet = false;
        let listSymbol = "";
        let listContent = "";

        const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
        const alphaMatch = trimmed.match(/^([A-Z]\.)\s+(.*)/);
        if (numMatch) {
          isNumeric = true;
          listSymbol = numMatch[1];
          listContent = numMatch[2];
        } else if (alphaMatch) {
          isAlpha = true;
          listSymbol = alphaMatch[1];
          listContent = alphaMatch[2];
        } else if (trimmed.startsWith("- ")) {
          isBullet = true;
          listSymbol = "❖";
          listContent = trimmed.substring(2).trim();
        } else if (trimmed.startsWith("* ")) {
          isSubBullet = true;
          listSymbol = "○";
          listContent = trimmed.substring(2).trim();
        }

        // Bold/Italic parsing
        trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        trimmed = trimmed.replace(/\*(.*?)\*/g, '<em>$1</em>');
        trimmed = trimmed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline; font-weight: 600;" target="_blank">$1</a>');
        listContent = listContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        listContent = listContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
        listContent = listContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline; font-weight: 600;" target="_blank">$1</a>');

        if (isNumeric) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 73;
          return `${prepend}<div style="display: flex; margin-left: 45px; margin-top: 4px; font-size: 11pt; line-height: 1.6;"><div style="min-width: 28px; font-weight: bold; color: #166534;">${listSymbol}</div><div style="flex: 1; text-align: justify;">${listContent}</div></div>`;
        }

        const textNoHtml = trimmed.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
        const cleanLower = textNoHtml.toLowerCase().replace(/[^a-z0-9]/g, "");

        const isPertemuanLine = cleanLower.startsWith("pertemuanke") || (cleanLower.startsWith("pertemuan") && /\d/.test(cleanLower));
        const isFokusMateriLine = textNoHtml.toLowerCase().replace(/[\(\)\*]/g, "").trim().startsWith("fokus materi");
        const isPrinsipLine = textNoHtml.toLowerCase().startsWith("prinsip:");
        const isKesimpulan = cleanLower.startsWith("kesimpulan");
        const isTindakLanjut = cleanLower.startsWith("tindaklanjut");
        const isPengalamanBelajarHeader = textNoHtml.toUpperCase().startsWith("PENGALAMAN BELAJAR");
        
        const subHeadings = [
          "pembukaan:",
          "aktivitas eksplorasi:",
          "pendalaman konsep:",
          "koneksi dengan pengetahuan sebelumnya:",
          "pembagian kelompok & penugasan:",
          "praktik & penerapan:",
          "kolaborasi & diskusi:",
          "refleksi diri murid:",
          "refleksi diri:"
        ];
        const isSubHeading = subHeadings.some(sh => textNoHtml.toLowerCase().startsWith(sh));

        if (isPertemuanLine) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 20;
          return `${prepend}<p style="text-align: justify; margin-top: 18px; margin-bottom: 4px; font-size: 11.5pt; line-height: 1.6; margin-left: 20px; font-weight: bold; color: #166534; page-break-after: avoid !important; break-after: avoid !important;">${textNoHtml.toUpperCase()}</p>`;
        }

        if (isFokusMateriLine) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 45;
          const displayFokusText = textNoHtml.startsWith("(") && textNoHtml.endsWith(")") ? textNoHtml : `(${textNoHtml})`;
          return `${prepend}<p style="text-align: justify; margin-top: 2px; margin-bottom: 12px; font-size: 11pt; line-height: 1.6; margin-left: 45px; color: #4b5563; font-style: italic; page-break-after: avoid !important; break-after: avoid !important;"><strong>${displayFokusText}</strong></p>`;
        }

        if (isPrinsipLine) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 45;
          const cleanText = textNoHtml.replace(/^prinsip:\s*/i, "");
          return `${prepend}<p style="text-align: justify; margin-top: 4px; margin-bottom: 4px; font-size: 11pt; line-height: 1.6; margin-left: 45px; color: #374151;"><strong><em>Prinsip: ${cleanText}</em></strong></p>`;
        }

        if (isKesimpulan || isTindakLanjut || isSubHeading) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 45;
          return `${prepend}<p style="text-align: justify; margin-top: 10px; margin-bottom: 4px; font-size: 11pt; line-height: 1.6; margin-left: 45px; font-weight: bold; color: #111827; page-break-after: avoid !important; break-after: avoid !important;">${textNoHtml}</p>`;
        }

        if (isPengalamanBelajarHeader) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 45;
          return `${prepend}<p style="text-align: justify; margin-top: 16px; margin-bottom: 6px; font-size: 11.5pt; line-height: 1.6; margin-left: 45px; font-weight: bold; color: #1b5e20; page-break-after: avoid !important; break-after: avoid !important;">${textNoHtml}</p>`;
        }
        
        if (isAlpha) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 48;
          return `${prepend}<div style="display: flex; margin-left: 20px; margin-top: 4px; margin-bottom: 0px; font-size: 12pt; line-height: 1.6; page-break-after: avoid !important; break-after: avoid !important;"><div style="min-width: 28px; font-weight: bold; color: #166534;">${listSymbol}</div><div style="flex: 1; text-align: justify; font-weight: bold;">${listContent}</div></div>`;
        }
        
        if (isBullet) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 94;
          return `${prepend}<div style="display: flex; margin-left: 70px; margin-top: 4px; font-size: 11pt; line-height: 1.6;"><div style="min-width: 24px; color: ${activeColor.bg}; font-weight: bold;">${listSymbol}</div><div style="flex: 1; text-align: justify;">${listContent}</div></div>`;
        }

        if (isSubBullet) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 119;
          return `${prepend}<div style="display: flex; margin-left: 95px; margin-top: 4px; font-size: 11pt; line-height: 1.6;"><div style="min-width: 24px; color: ${activeColor.text === '#000000' ? '#2E7D32' : activeColor.bg}; font-weight: bold;">${listSymbol}</div><div style="flex: 1; text-align: justify;">${listContent}</div></div>`;
        }

        if (trimmed.startsWith("###")) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 20;
          return `${prepend}<h3 style="color: ${activeColor.text === '#000000' ? '#2E7D32' : activeColor.bg}; border-bottom: 2px dashed ${activeColor.bg}; padding-bottom: 2px; margin-top: 6px; margin-bottom: 2px; font-size: 13pt; page-break-after: avoid !important; break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; display: block !important;">${trimmed.replace(/^###\s*/, "")}</h3>`;
        }
        
        if (trimmed.match(/^\*\*Pertemuan\b/i)) {
          currentIndent = 20;
        }

        if (trimmed.startsWith("##")) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 20;
          return `${prepend}<h2 style="background-color: ${activeColor.bg}; color: ${activeColor.text}; padding: 4px 12px; border-radius: 4px; margin-top: 8px; margin-bottom: 2px; font-size: 15pt; page-break-after: avoid !important; break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; display: block !important;">${trimmed.replace(/^##\s*/, "")}</h2>`;
        }
        if (trimmed.startsWith("#")) {
          if (inTable) { inTable = false; prepend += "</table>"; }
          currentIndent = 20;
          return `${prepend}<h2 style="background-color: ${activeColor.bg}; color: ${activeColor.text}; padding: 4px 12px; border-radius: 4px; margin-top: 8px; margin-bottom: 2px; font-size: 15pt; page-break-after: avoid !important; break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; display: block !important;">${trimmed.replace(/^#\s*/, "")}</h2>`;
        }
        
        if (trimmed.startsWith("|") && trimmed.includes("---")) {
          return prepend; // skip markdown table separator
        }
        if (trimmed.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            prepend += `<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 11pt; line-height: 1.5;">`;
          }
          const cells = trimmed.split("|").filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === "")); // remove first and last empty parts
          
          const isHeader = !trimmed.includes("---") && (trimmed.toLowerCase().includes("tujuan") || trimmed.toLowerCase().includes("materi") || trimmed.toLowerCase().includes("waktu") || trimmed.toLowerCase().includes("kriteria") || trimmed.toLowerCase().includes("kegiatan") || trimmed.toLowerCase().includes("aspek") || trimmed.toLowerCase().includes("no"));
          
          const tr = `<tr>${cells.map(c => `<td style="border: 1px solid #ccc; padding: 10px; ${isHeader ? `background-color: ${activeColor.bg}; color: ${activeColor.text}; font-weight: bold;` : ''}">${c.trim()}</td>`).join('')}</tr>`;
          return prepend + tr;
        }
        
        if (trimmed === "---") {
          if (inTable) { inTable = false; prepend += "</table>"; }
          return `${prepend}<hr style="border: 0; border-top: 2px dashed ${activeColor.bg}; margin: 30px 0;">`;
        }

        if (trimmed === "") {
          return prepend ? prepend : `<div style="height: 4px;"></div>`;
        }
        
        if (inTable) {
          inTable = false;
          prepend += "</table>";
        }
        
        // Exclude identity matches from standard paragraph output because they are handled
        if (inIdentity) {
           return prepend;
        }
        
        let pText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        return `${prepend}<p style="text-align: justify; margin-top: 4px; margin-bottom: 4px; font-size: 11pt; line-height: 1.6; margin-left: ${currentIndent}px;">${pText}</p>`;
      });
      
      if (inTable) {
        formattedContentLines.push("</table>");
      }
      if (inIdentity) {
        formattedContentLines.push("</table>");
      }
      const formattedContent = formattedContentLines.join("");

      const wrappedContent = `<div style="max-width: 800px; margin: 0 auto; padding: 40px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-family: 'Times New Roman', Times, serif;">${formattedContent}</div>`;

      const finalHtml = coverHtml + "\n" + wrappedContent;
      
      setRppOutput(finalHtml);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);
      const id = `rpp_${Date.now()}`;
      setArsip([...arsip, { id, judul: `RPM Kelas ${kls} - ${rppForm.materi || ELEMEN_LABEL[rppForm.elemen as keyof typeof ELEMEN_LABEL]}`, tipe: "RPM", tanggal: new Date().toLocaleDateString("id-ID"), konten: finalHtml }]);
      toast({ title: "RPM Berhasil Dibuat", description: "Modul ajar baru berhasil dibuat dan disimpan ke Arsip." });
    } catch (err: unknown) {
      clearInterval(progressInterval);
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setRppLoading(false);
      setRppLoadingStep(0);
    }
  };

  const BAHAN_TIPE_MAP: Record<string, string> = {
    "Ringkasan Materi": "ringkasan", "Bahan Presentasi": "presentasi",
    "LKPD": "lkpd", "Ice Breaking": "icebreaking"
  };

  const generateBahan = async () => {
    if (!bahanTopik) { toast({ title: "Isi topik dulu", variant: "destructive" }); return; }
    setBahanLoading(true);
    try {
      const tipe = BAHAN_TIPE_MAP[bahanJenis] || "ringkasan";
      const kls = getKelasNumber();
      const result = await apiGenerate(session.username, tipe, { topik: bahanTopik, kelas: String(kls) });
      setBahanOutput(result.hasil);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);
      const id = `bahan_${Date.now()}`;
      setArsip([...arsip, { id, judul: `${bahanJenis} - ${bahanTopik}`, tipe: "Bahan", tanggal: new Date().toLocaleDateString("id-ID"), konten: result.hasil }]);
      toast({ title: "Berhasil", description: `${bahanJenis} untuk "${bahanTopik}" siap dan disimpan ke Arsip.` });
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setBahanLoading(false);
    }
  };

  const subMenuCards: Array<{
    id: string;
    label: string;
    sub: string;
    icon: any;
    color: string;
    iconColor: string;
    badge?: string;
  }> = [
    { id: "pemetaan", label: "Pemetaan Kurikulum", sub: "TP • ATP • CP", icon: GitBranch, color: "border-green-400 hover:border-green-500", iconColor: "text-green-600" },
    { id: "promes", label: "Prota & Promes", sub: "Kalender • Distribusi Materi", icon: CalendarDays, color: "border-blue-400 hover:border-blue-500", iconColor: "text-blue-600" },
    { id: "rpp", label: "Modul Ajar (RPM)", sub: "Siap Pakai • Siap Edit", icon: FileSignature, color: "border-purple-400 hover:border-purple-500", iconColor: "text-purple-600" },
    { id: "bahan", label: "Bahan Ajar Ekstra", sub: "Materi • LKPD • PPT • Kuis", icon: BookOpen, color: "border-orange-400 hover:border-orange-500", iconColor: "text-orange-600" },
  ];

  const KuotaBadge = () => (
    <div className="flex items-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-xs text-[#D4AF37] font-bold shadow-[0_2px_10px_rgba(212,175,55,0.05)]">
      <Zap className="w-3.5 h-3.5" /> Kuota Ekspor: {session.kuotaSisa}/{session.kuotaMaks}
    </div>
  );

  return (
    <AppBackground className="p-4 md:px-8 md:pb-8 md:pt-4 space-y-8 md:space-y-10 !min-h-full">
      {/* Page Title & Header (Outside of boxes - with high contrast gold/white typography, with custom bottom padding/margin for spacing) */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-white/10 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#D4AF37] flex items-center gap-3 drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)] whitespace-nowrap">
            <BookOpen className="shrink-0 w-8 h-8 text-[#D4AF37]" />
            Administrasi Pembelajaran
          </h1>
          <p className="text-sm text-white/80 font-medium mt-1 w-full leading-relaxed">
            Didukung Gemini AI untuk membantu penyusunan perangkat pembelajaran.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <KuotaBadge />
        </div>
      </div>

      {subMenu === "grid" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 mt-3 md:mt-4">
          {subMenuCards.map((card) => (
            <button 
              key={card.id} 
              onClick={() => setSubMenu(card.id as SubMenu)}
              className={`relative bg-white text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${card.color} shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1.5 duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[180px]`}
              data-testid={`button-submenu-${card.id}`}
            >
              {card.badge && (
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] sm:text-[9px] font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded-bl-xl rounded-tr-xl tracking-wider">
                  {card.badge}
                </span>
              )}
              <div>
                <card.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 ${card.iconColor}`} />
                <h3 className="font-extrabold text-sm sm:text-base text-black mb-1 leading-tight">{card.label}</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-black/60 font-bold leading-relaxed">{card.sub}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pemetaan Kurikulum */}
      {subMenu === "pemetaan" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSubMenu("grid")} 
              className="bg-white/10 hover:bg-white/20 text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-[#D4AF37]/25 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Menu
            </button>
            <div className="hidden sm:flex items-center gap-4 bg-black/30 border border-white/10 rounded-xl px-4 py-2">
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Tahun Pelajaran:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{profil.tahunPelajaran || "-"}</span>
               </div>
               <div className="w-[1px] h-3.5 bg-white/20"></div>
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Semester:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{getSemester()}</span>
               </div>
            </div>
          </div>

          <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#D4AF37]" />
                  Pemetaan Kurikulum
                </h3>
                <div className="text-[11px] text-white/80 mt-1.5 space-y-0.5 font-medium">
                  <p>* Sesuai Keputusan Kepala BSKAP Kemendikbudristek No. 032/H/KR/2024</p>
                  <p>* Rumusan TP dan ATP ini menggunakan pendekatan Pembelajaran Mendalam, serta terstruktur sesuai KKO Taksonomi Bloom dan hierarki pemahaman Taksonomi SOLO.</p>
                </div>
              </div>
            </div>

            {/* Bagian Atas: Kontrol & Pemilihan */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-white font-semibold text-xs block">Pilih Kelas / Fase</Label>
                  <Select value={fase} onValueChange={setFase}>
                    <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                      {activeFaseOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:shrink-0">
                  {/* Tombol Primary Button */}
                  <button
                    onClick={() => {
                      const newUpdates: Record<string, string> = {};
                      for (const elm of ELEMEN) {
                        newUpdates[`tp_${elm}`] = "";
                        newUpdates[`atp_${elm}`] = "";
                      }
                      updatePemetaanMultiple(newUpdates);
                      toast({ title: "Data Direset", description: "Data dikembalikan ke data default dari Database/Sheets." });
                    }}
                    className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all h-11"
                    title="Kosongkan data dan ambil ulang dari Database Sheets"
                  >
                    Reset Data
                  </button>

                  <button
                    onClick={generateAI}
                    disabled={aiLoading}
                    className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 shadow-[0_4px_12px_rgba(212,175,55,0.2)] h-11"
                    data-testid="button-generate-pemetaan"
                  >
                    <Sparkles className="w-4 h-4 text-black animate-pulse" />
                    {aiLoading ? "AI Menganalisis..." : "Generate ATP dengan AI"}
                  </button>
                </div>
              </div>
            </div>

            {/* Bagian Bawah: Area Konten per Elemen */}
            <div className="space-y-6">
              {ELEMEN.map((elm) => (
                <div key={elm} className="border border-white/10 rounded-xl overflow-hidden shadow-lg bg-black/25">
                  {/* Header Elemen */}
                  <div className="bg-white/5 p-4 font-extrabold text-sm border-b border-white/10 text-[#D4AF37] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                    {ELEMEN_LABEL[elm]}
                  </div>

                  {/* Layout Grid 3 Bagian Jelas */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Area CP: Capaian Pembelajaran */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider">
                          1. Capaian Pembelajaran
                        </Label>
                      </div>
                      <div className="text-xs leading-relaxed text-white/80 bg-black/45 border border-white/10 p-3 rounded-xl h-[180px] lg:h-[220px] overflow-y-auto font-medium whitespace-pre-line pr-1">
                        {getCpText(elm, fase, getKelasNumber().toString())}
                      </div>
                    </div>

                    {/* Area TP: Tujuan Pembelajaran (Editable, bg-white, text-black) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-[10px] text-[#D4AF37] font-extrabold uppercase tracking-wider">
                          2. Tujuan Pembelajaran
                        </Label>
                      </div>
                      <Textarea 
                        className="text-xs h-[180px] lg:h-[220px] resize-none bg-white border-[#D4AF37]/40 text-black placeholder-black/50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm p-3 rounded-xl leading-relaxed" 
                        value={getTpText(elm, fase, getKelasNumber().toString())} 
                        onChange={(e) => updatePemetaan(`tp_${elm}`, e.target.value)} 
                        placeholder="Hasil generate AI akan muncul di sini, silakan sesuaikan jika perlu..." 
                        data-testid={`textarea-tp-${elm}`}
                      />
                    </div>

                    {/* Area ATP: Alur Tujuan Pembelajaran (Editable, bg-white, text-black) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-[10px] text-[#22d3ee] font-extrabold uppercase tracking-wider">
                          3. Alur Tujuan Pembelajaran
                        </Label>
                      </div>
                      <Textarea 
                        className="text-xs h-[180px] lg:h-[220px] resize-none bg-white border-[#D4AF37]/40 text-black placeholder-black/50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm p-3 rounded-xl leading-relaxed" 
                        value={localPemetaan[`atp_${elm}`] || ""} 
                        onChange={(e) => updatePemetaan(`atp_${elm}`, e.target.value)} 
                        placeholder="Hasil generate alur AI akan muncul di sini..." 
                        data-testid={`textarea-atp-${elm}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 max-w-xl mx-auto w-full border-t border-white/5">
              <button 
                onClick={simpanPemetaan} 
                type="button"
                className="w-full sm:w-1/2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black py-3 px-6 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(212,175,55,0.15)] transition-all transform hover:-translate-y-0.5" 
                data-testid="button-simpan-pemetaan"
              >
                <Save className="w-4 h-4" /> Simpan Pemetaan
              </button>
              <button 
                onClick={() => setIsExportModalOpen(true)} 
                type="button"
                className="w-full sm:w-1/2 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black py-3 px-6 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(34,211,238,0.15)] transition-all transform hover:-translate-y-0.5" 
                data-testid="button-ekspor-pemetaan"
              >
                <Download className="w-4 h-4" /> Ekspor Pemetaan
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Prota & Promes */}
      {subMenu === "promes" && (
        <PromesWizard 
          onBack={() => setSubMenu("grid")}
          profil={profil}
          pemetaan={pemetaan}
          fase={fase}
          semester={getSemester()}
          onExport={(html) => {
            setPromesExportHtml(html);
            setIsExportModalOpen(true);
          }}
          activeKelasList={activeKelasList}
          ELEMEN={ELEMEN}
          ELEMEN_LABEL={ELEMEN_LABEL}
        />
      )}

      {/* Generator RPP */}
      {subMenu === "rpp" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSubMenu("grid")} 
              className="bg-white/10 hover:bg-white/20 text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-[#D4AF37]/25 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Menu
            </button>
            <div className="hidden sm:flex items-center gap-4 bg-black/30 border border-white/10 rounded-xl px-4 py-2">
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Tahun Pelajaran:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{profil.tahunPelajaran || "-"}</span>
               </div>
               <div className="w-[1px] h-3.5 bg-white/20"></div>
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Semester:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{getSemester()}</span>
               </div>
            </div>
          </div>

          <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-[#D4AF37]" />
                <Badge className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded mr-1.5 tracking-wider">GEMINI AI</Badge>
                Generator Modul Ajar (RPM)
              </h3>
              <p className="text-xs text-white/60 mt-0.5">Rumuskan modul ajar / RPM lengkap sesuai komponen resmi kurikulum nasional</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/25 p-4 rounded-xl border border-white/5">
              <div className="space-y-1.5">
                <Label className="text-white font-semibold text-xs">Pilih Kelas</Label>
                <Select value={rppForm.kelas} onValueChange={(v) => setRppForm(p => ({ ...p, kelas: v }))}>
                  <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                    {activeKelasList.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white font-semibold text-xs">Capaian Pembelajaran</Label>
                <Select value={rppForm.elemen} onValueChange={(v) => setRppForm(p => ({ ...p, elemen: v }))}>
                  <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm h-auto min-h-11 text-left whitespace-normal">
                    <SelectValue>
                      {rppForm.elemen && (
                        <div className="flex flex-col">
                          <span className="font-normal text-xs line-clamp-2">
                            {(() => {
                              const kls = rppForm.kelas;
                              const n = parseInt(kls.replace(/[^0-9]/g, "")) || 1;
                              let f = "A";
                              if (n === 3 || n === 4) f = "B";
                              if (n === 5 || n === 6) f = "C";
                              return getCpText(rppForm.elemen, f, kls);
                            })()}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold max-w-[85vw] md:max-w-[700px]">
                    {ELEMEN.map(elm => {
                      const kls = rppForm.kelas;
                      const n = parseInt(kls.replace(/[^0-9]/g, "")) || 1;
                      let f = "A";
                      if (n === 3 || n === 4) f = "B";
                      if (n === 5 || n === 6) f = "C";
                      
                      const cpT = getCpText(elm, f, kls);
                      const displayCp = cpT.length > 100 ? cpT.substring(0, 100) + "..." : cpT;

                      return (
                        <SelectItem key={elm} value={elm} className="whitespace-normal py-2 text-xs">
                          <div className="font-normal leading-relaxed">{displayCp}</div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {rppForm.isModified && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-white font-semibold text-xs">Tujuan Pembelajaran (Custom/Diedit)</Label>
                    <Textarea 
                      value={rppForm.allTps}
                      onChange={(e) => setRppForm(p => ({ ...p, allTps: e.target.value }))}
                      placeholder="Masukkan Tujuan Pembelajaran yang disesuaikan"
                      className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm min-h-20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white font-semibold text-xs">Materi Pokok (Custom)</Label>
                    <Input 
                      value={rppForm.materi} 
                      onChange={(e) => setRppForm(p => ({ ...p, materi: e.target.value }))} 
                      placeholder="Contoh: Salat Wajib" 
                      className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                      data-testid="input-materi-rpp" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white font-semibold text-xs">Sub Materi (Custom)</Label>
                    <Input 
                      value={rppForm.subMateri} 
                      onChange={(e) => setRppForm(p => ({ ...p, subMateri: e.target.value }))} 
                      placeholder="Contoh: Syarat Sah Salat" 
                      className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-white font-semibold text-xs">Alokasi Waktu</Label>
                <Input 
                  value={rppForm.alokasi} 
                  readOnly
                  placeholder="Otomatis dari Promes..."
                  className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white font-semibold text-xs">Model Pembelajaran <span className="font-normal opacity-70">(opsional)</span></Label>
                <Select value={rppForm.metode} onValueChange={(v) => setRppForm(p => ({ ...p, metode: v === "AI" ? "" : v }))}>
                  <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm text-left">
                    <SelectValue placeholder="Dikosongkan = AI yang menentukan">
                      {rppForm.metode || "Biarkan AI Menentukan"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                    <SelectItem value="AI">✨ Biarkan AI Menentukan (Rekomendasi)</SelectItem>
                    <SelectItem value="Project-Based Learning (PjBL)">Project-Based Learning (PjBL)</SelectItem>
                    <SelectItem value="Problem-Based Learning (PBL)">Problem-Based Learning (PBL)</SelectItem>
                    <SelectItem value="Discovery Learning">Discovery Learning</SelectItem>
                    <SelectItem value="Inquiry-Based Learning">Inquiry-Based Learning</SelectItem>
                    <SelectItem value="Cooperative Learning">Cooperative Learning</SelectItem>
                    <SelectItem value="Role Playing & Simulasi">Role Playing & Simulasi</SelectItem>
                    <SelectItem value="Diskusi Kelompok">Diskusi Kelompok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={generateRPP} 
                disabled={rppLoading} 
                className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(212,175,55,0.2)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50" 
                data-testid="button-generate-rpp"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> 
                {rppLoading ? "Memproses..." : "Generate Modul Ajar"}
              </button>

              {rppLoading && (
                <div className="bg-[#1a2e1d]/50 p-4 rounded-xl border border-[#D4AF37]/30 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-[#D4AF37] font-bold">
                    <span>Progress Pembuatan Modul</span>
                    <span>{rppLoadingStep * 20}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2">
                    <div className="bg-[#D4AF37] h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${rppLoadingStep * 20}%` }}></div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className={`text-xs flex items-center gap-2 ${rppLoadingStep >= 1 ? 'text-white font-medium' : 'text-white/30'}`}>
                      <Palette className={`w-4 h-4 ${rppLoadingStep === 1 ? 'text-yellow-400 animate-pulse' : (rppLoadingStep > 1 ? 'text-green-400' : '')}`} />
                      Menyiapkan Sampul Dokumen & Tata Letak Visual...
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${rppLoadingStep >= 2 ? 'text-white font-medium' : 'text-white/30'}`}>
                      <Target className={`w-4 h-4 ${rppLoadingStep === 2 ? 'text-yellow-400 animate-pulse' : (rppLoadingStep > 2 ? 'text-green-400' : '')}`} />
                      Memetakan Identitas Utama & Tujuan Pembelajaran...
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${rppLoadingStep >= 3 ? 'text-white font-medium' : 'text-white/30'}`}>
                      <Settings className={`w-4 h-4 ${rppLoadingStep === 3 ? 'text-yellow-400 animate-[spin_3s_linear_infinite]' : (rppLoadingStep > 3 ? 'text-green-400' : '')}`} />
                      Merancang Langkah Pembelajaran Pertemuan 1...
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${rppLoadingStep >= 4 ? 'text-white font-medium' : 'text-white/30'}`}>
                      <GitBranch className={`w-4 h-4 ${rppLoadingStep === 4 ? 'text-yellow-400 animate-pulse' : (rppLoadingStep > 4 ? 'text-green-400' : '')}`} />
                      Mengembangkan Skenario Pertemuan Lanjutan...
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${rppLoadingStep >= 5 ? 'text-white font-medium' : 'text-white/30'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${rppLoadingStep === 5 ? 'text-green-500 animate-bounce' : (rppLoadingStep > 5 ? 'text-green-400' : 'text-white/10')}`} />
                      Merumuskan Media & Sumber Belajar Digital...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {rppOutput && !rppLoading && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <Label className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider">Hasil (Preview)</Label>
                  </div>
                  {rppOutput.trim().startsWith("<div") ? (
                    <div className="bg-white p-4 rounded-xl shadow-inner overflow-auto max-h-[600px] border border-[#D4AF37]/30 text-black animate-in zoom-in-95 duration-200" dangerouslySetInnerHTML={{ __html: getFilteredRppOutput() }} />
                  ) : (
                    <Textarea 
                      value={rppOutput} 
                      onChange={(e) => setRppOutput(e.target.value)} 
                      className="font-mono text-xs h-96 resize-y bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm" 
                    />
                  )}
                  {rppOutput.trim().startsWith("<div") && (
                    <details className="mt-2 text-white/50 text-xs">
                      <summary className="cursor-pointer hover:text-white">Edit Source HTML</summary>
                      <Textarea 
                        value={rppOutput} 
                        onChange={(e) => setRppOutput(e.target.value)} 
                        className="font-mono text-xs h-48 mt-2 resize-y bg-black/50 border-white/20 text-white placeholder-white/40 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30" 
                      />
                    </details>
                  )}
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(true)} 
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-6 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 w-full"
                >
                  <Download className="w-4 h-4" /> Ekspor Modul Ajar
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Bahan Ajar Ekstra */}
      {subMenu === "bahan" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSubMenu("grid")} 
              className="bg-white/10 hover:bg-white/20 text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-[#D4AF37]/25 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Menu
            </button>
            <div className="hidden sm:flex items-center gap-4 bg-black/30 border border-white/10 rounded-xl px-4 py-2">
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Tahun Pelajaran:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{profil.tahunPelajaran || "-"}</span>
               </div>
               <div className="w-[1px] h-3.5 bg-white/20"></div>
               <div className="flex items-center gap-1.5">
                 <Label className="text-[10px] text-white/70 font-extrabold uppercase whitespace-nowrap">Semester:</Label>
                 <span className="text-xs text-[#D4AF37] font-bold">{getSemester()}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/25 p-2 rounded-2xl border border-white/5 shadow-inner">
            {["Ringkasan Materi", "Bahan Presentasi", "LKPD", "Ice Breaking"].map((jenis) => (
              <button 
                key={jenis} 
                onClick={() => { setBahanJenis(jenis); setBahanOutput(""); }}
                className={`p-4 rounded-xl border-2 transition-all text-xs font-extrabold shadow-sm ${
                  bahanJenis === jenis 
                    ? "border-[#D4AF37] bg-white text-black shadow-md" 
                    : "border-white/10 bg-black/30 text-white hover:border-[#D4AF37]/40 hover:bg-black/50"
                }`}
                data-testid={`button-bahan-${jenis.toLowerCase().replace(/ /g, "-")}`}
              >
                {jenis}
              </button>
            ))}
          </div>

          {bahanJenis && (
            <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                  {bahanJenis}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">Generate otomatis materi pendukung kegiatan belajar mengajar sesuai topik</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white font-semibold text-xs">Topik / Materi</Label>
                  <Input 
                    value={bahanTopik} 
                    onChange={(e) => setBahanTopik(e.target.value)} 
                    placeholder="Contoh: Salat Berjamaah" 
                    className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                    data-testid="input-bahan-topik" 
                  />
                </div>

                <button 
                  onClick={generateBahan} 
                  disabled={bahanLoading} 
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                  data-testid="button-generate-bahan"
                >
                  <Sparkles className="w-4 h-4" /> 
                  {bahanLoading ? "Gemini sedang membuat..." : `Generate ${bahanJenis} via AI`}
                </button>

                {bahanOutput && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                      <Label className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider">Hasil Dokumen</Label>
                      <Textarea 
                        value={bahanOutput} 
                        onChange={(e) => setBahanOutput(e.target.value)} 
                        className="font-mono text-xs h-72 resize-y bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm" 
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { navigator.clipboard.writeText(bahanOutput); toast({ title: "Disalin ke Clipboard!" }); }}
                        className="bg-white/10 hover:bg-white/20 text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-[#D4AF37]/25 transition-colors"
                      >
                        Salin Hasil Teks
                      </button>
                      <button 
                        onClick={() => setIsExportModalOpen(true)} 
                        className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5"
                      >
                        <Download className="w-4 h-4" /> Ekspor Bahan Ajar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Modal Ekspor Pemetaan */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#D4AF37] uppercase tracking-wider">
                  Ekspor ${subMenu === "pemetaan" ? "Pemetaan Kurikulum" : subMenu === "promes" ? "Prota & Promes" : subMenu === "rpp" ? "Modul Ajar" : "Bahan Ajar"}
                </h3>
                <p className="text-[11px] text-white/60">Pilih format unduhan hasil dokumen Anda</p>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)} 
                type="button"
                className="text-white/40 hover:text-white/80 transition-colors text-xs font-bold px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4">
              {/* Box Info Kuota */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#22d3ee]">
                    <Zap className="w-3.5 h-3.5 fill-[#22d3ee]/20" /> Jatah Kuota Ekspor
                  </div>
                  <p className="text-[11px] text-white/50">Masing-masing ekspor mengurangi 1 kuota</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${session.kuotaSisa > 10 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : session.kuotaSisa > 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {session.kuotaSisa} / {session.kuotaMaks} Sisa
                  </span>
                </div>
              </div>

              {session.kuotaSisa <= 0 && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-bold text-center">
                  Kuota ekspor Anda telah habis. Silakan hubungi Administrator untuk meminta penambahan kuota.
                </div>
              )}

              {/* Pilihan Format */}
              <div className="grid grid-cols-1 gap-3">
                {/* Opsi Word */}
                <button
                  onClick={downloadWord}
                  disabled={isExporting || session.kuotaSisa <= 0}
                  type="button"
                  className="flex items-start gap-4 p-4 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors">
                      Unduh Format Microsoft Word (.doc)
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Dokumen dapat diedit kembali dengan tata letak tabel yang rapi di MS Word maupun Google Docs.
                    </div>
                  </div>
                </button>

                {/* Opsi PDF */}
                <button
                  onClick={downloadPdf}
                  disabled={isExporting || session.kuotaSisa <= 0}
                  type="button"
                  className="flex items-start gap-4 p-4 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-white group-hover:text-red-300 transition-colors">
                      Cetak / Simpan Format PDF (.pdf)
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Mengirim dokumen langsung ke layar cetak browser untuk disimpan sebagai file PDF berkualitas tinggi.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {isExporting && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#D4AF37] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang memproses ekspor, mohon tunggu...
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </AppBackground>
  );
}
