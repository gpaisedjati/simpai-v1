import { useState, useRef, useMemo } from "react";
import { useSimpaiProfil, useSimpaiJadwal, useSimpaiSiswa, getActiveKelasList } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, School, User, Calendar, Users, Upload, Database, Image } from "lucide-react";
import { AppBackground } from "../design-system/components/AppBackground";
import { GlassCard } from "../design-system/components/GlassCard";

const HARI = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
const HARI_LABEL = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const defaultRombelCount = (namaSekolah: string) => {
  const norm = (namaSekolah || "").toUpperCase();
  if (norm.includes("SMP") || norm.includes("MTS") || norm.includes("MENENGAH PERTAMA") || norm.includes("SMA") || norm.includes("SMK") || norm.includes("MA") || norm.includes("MENENGAH ATAS")) {
    return 3;
  }
  return 6;
};

const getGeneratedRombelOptions = (namaSekolah: string, rCount: number) => {
  const norm = (namaSekolah || "").toUpperCase();
  let baseGrades = [1, 2, 3, 4, 5, 6];
  if (norm.includes("SMP") || norm.includes("MTS") || norm.includes("MENENGAH PERTAMA")) {
    baseGrades = [7, 8, 9];
  } else if (norm.includes("SMA") || norm.includes("SMK") || norm.includes("MA") || norm.includes("MENENGAH ATAS")) {
    baseGrades = [10, 11, 12];
  }
  
  const gCount = baseGrades.length;
  if (rCount <= gCount) {
    return baseGrades.map(String);
  } else {
    const sectionsPerGrade = Math.ceil(rCount / gCount);
    const options: string[] = [];
    for (const g of baseGrades) {
      for (let i = 0; i < sectionsPerGrade; i++) {
        options.push(`${g}${String.fromCharCode(65 + i)}`);
      }
    }
    return options;
  }
};

type JadwalType = Record<string, Record<string, boolean>>;
type SiswaType = Record<string, string>;

export default function MasterData() {
  const [profil, setProfil] = useSimpaiProfil();
  const [jadwal, setJadwal] = useSimpaiJadwal() as [JadwalType, (v: JadwalType) => void];
  const [siswa, setSiswa] = useSimpaiSiswa() as [SiswaType, (v: SiswaType) => void];
  const { toast } = useToast();
  
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Auto-upgrade / fallback if the old 2025/2026 option is loaded
  const [localProfil, setLocalProfil] = useState(() => {
    const p = { ...profil };
    if (p.tahunPelajaran === "2025/2026" || !p.tahunPelajaran) {
      p.tahunPelajaran = "2026/2027";
    }
    return p;
  });

  const currentRombelCount = parseInt(localProfil.jumlahRombel) || defaultRombelCount(localProfil.namaSekolah);

  const generatedRombelOptions = useMemo(() => {
    return getGeneratedRombelOptions(localProfil.namaSekolah, currentRombelCount);
  }, [localProfil.namaSekolah, currentRombelCount]);

  const selectedRombelsList = useMemo(() => {
    if (localProfil.selectedRombels && localProfil.selectedRombels.trim()) {
      return localProfil.selectedRombels.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return generatedRombelOptions;
  }, [localProfil.selectedRombels, generatedRombelOptions]);

  const activeKelas = selectedRombelsList;

  const handleToggleRombel = (r: string) => {
    let newList: string[];
    if (selectedRombelsList.includes(r)) {
      newList = selectedRombelsList.filter((x) => x !== r);
    } else {
      newList = [...selectedRombelsList, r];
    }
    const orderedList = generatedRombelOptions.filter((x) => newList.includes(x));
    setLocalProfil((p) => ({ ...p, selectedRombels: orderedList.join(",") }));
  };

  const handleRombelChange = (val: number) => {
    const options = getGeneratedRombelOptions(localProfil.namaSekolah, val);
    setLocalProfil((p) => ({
      ...p,
      jumlahRombel: String(val),
      selectedRombels: options.join(",")
    }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast({ title: "Foto terlalu besar", description: "Maksimal 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLocalProfil((p) => ({ ...p, fotoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast({ title: "Logo terlalu besar", description: "Maksimal 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLocalProfil((p) => ({ ...p, logoSekolahBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const hitungSiswa = (kls: string) => {
    const text = (siswa[`kls${kls}`] || "").trim();
    if (!text) return 0;
    return text.split(/\r?\n/).filter((l) => l.trim()).length;
  };

  const toggleJadwal = (kls: string, hari: string) => {
    const key = `kls${kls}`;
    const current = (jadwal[key] || {}) as Record<string, boolean>;
    setJadwal({ ...jadwal, [key]: { ...current, [hari]: !current[hari] } });
  };

  const simpan = () => {
    setProfil({ ...localProfil });
    toast({ title: "Tersimpan", description: "Data profil berhasil disimpan dan disinkronisasi." });
  };

  return (
    <AppBackground className="p-4 md:px-8 md:pb-8 md:pt-4 space-y-8 md:space-y-10 !min-h-full">
      {/* Page Title & Header (Outside of boxes - with high contrast gold/white typography, forced to 1 line) */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#D4AF37] flex items-center gap-3 drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)]">
          <Database className="w-8 h-8 text-[#D4AF37]" />
          Master Data
        </h1>
        <p className="text-sm text-white/80 font-medium mt-1 w-full leading-relaxed">
          Pondasi utama aplikasi SIM-PAI. Input satu kali dan otomatis disinkronisasikan ke seluruh sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {/* Profil Sekolah */}
        <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 pb-3 mb-5">
            <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
              <School className="w-5 h-5 text-[#D4AF37]" />
              Profil Sekolah
            </h3>
            <p className="text-xs text-white/60 mt-0.5">Atur tahun ajaran, semester, identitas sekolah, dan logo resmi Anda</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Tahun Pelajaran</Label>
              <Select value={localProfil.tahunPelajaran} onValueChange={(v) => setLocalProfil((p) => ({ ...p, tahunPelajaran: v }))}>
                <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                  <SelectItem value="2026/2027" className="focus:bg-black/5 focus:text-black">2026/2027</SelectItem>
                  <SelectItem value="2027/2028" className="focus:bg-black/5 focus:text-black">2027/2028</SelectItem>
                  <SelectItem value="2028/2029" className="focus:bg-black/5 focus:text-black">2028/2029</SelectItem>
                  <SelectItem value="2029/2030" className="focus:bg-black/5 focus:text-black">2029/2030</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Semester</Label>
              <Select value={localProfil.semester} onValueChange={(v) => setLocalProfil((p) => ({ ...p, semester: v }))}>
                <SelectTrigger className="bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                  <SelectItem value="Ganjil" className="focus:bg-black/5 focus:text-black">Ganjil</SelectItem>
                  <SelectItem value="Genap" className="focus:bg-black/5 focus:text-black">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Nama Sekolah</Label>
              <Input 
                value={localProfil.namaSekolah} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, namaSekolah: e.target.value }))} 
                placeholder="SD Negeri..." 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-nama-sekolah" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">NPSN</Label>
              <Input 
                value={localProfil.npsn} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, npsn: e.target.value }))} 
                placeholder="12345678" 
                type="number" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-npsn" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Alamat Sekolah</Label>
              <Input 
                value={localProfil.alamat} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, alamat: e.target.value }))} 
                placeholder="Jl. Raya..." 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-alamat" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Jumlah Rombongan Belajar (Rombel)</Label>
              <Input 
                type="number"
                min={1}
                max={36}
                value={localProfil.jumlahRombel || defaultRombelCount(localProfil.namaSekolah)} 
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleRombelChange(val);
                }} 
                placeholder="6" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-jumlah-rombel" 
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-white font-semibold text-xs">Pilih Rombongan Belajar (Rombel) yang Diampu</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-black/20 rounded-lg border border-white/10">
                {generatedRombelOptions.map((r) => {
                  const isChecked = selectedRombelsList.includes(r);
                  return (
                    <label 
                      key={r} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold cursor-pointer transition-all select-none ${
                        isChecked 
                          ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.2)]" 
                          : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRombel(r)}
                        className="hidden"
                      />
                      <span>Kelas {r}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/50">
                Centang kelas/paralel yang Anda ajar. Ini akan secara otomatis menyesuaikan daftar kelas di menu Jadwal Mengajar, Rombel Siswa, Promes, RPP, dan Asesmen.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Logo Sekolah (untuk Dokumen)</Label>
              <div className="flex items-center gap-3 p-1.5 bg-white border border-[#D4AF37]/40 rounded-lg min-h-[40px] px-3 shadow-sm">
                <div className="w-8 h-8 rounded-md overflow-hidden border border-black/10 flex-shrink-0 bg-black/5 flex items-center justify-center">
                  {localProfil.logoSekolahBase64 ? (
                    <img src={localProfil.logoSekolahBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-4 h-4 text-black/40" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" data-testid="input-logo-sekolah" />
                  <span className="text-[10px] text-black/60 truncate max-w-[120px] font-bold">
                    {localProfil.logoSekolahBase64 ? "Logo terunggah" : "Belum ada logo"}
                  </span>
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()} 
                    className="bg-black/5 hover:bg-black/10 text-[#a08020] px-3 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1.5 transition-colors border border-[#D4AF37]/30 shrink-0"
                  >
                    <Upload className="w-3 h-3" /> Pilih Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Profil Pejabat & Guru */}
        <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 pb-3 mb-5">
            <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              Profil Pejabat & Guru
            </h3>
            <p className="text-xs text-white/60 mt-0.5">Lengkapi data pejabat sekolah, kepala sekolah, serta guru pengampu</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Nama Guru & Gelar</Label>
              <Input 
                value={localProfil.namaGuru} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, namaGuru: e.target.value }))} 
                placeholder="Fulan, S.Pd.I" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-nama-guru" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">NIP Guru</Label>
              <Input 
                value={localProfil.nipGuru} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, nipGuru: e.target.value }))} 
                placeholder="-" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-nip-guru" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Kepala Sekolah</Label>
              <Input 
                value={localProfil.namaKS} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, namaKS: e.target.value }))} 
                placeholder="Nama Kepala Sekolah" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-nama-ks" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">NIP Kepala Sekolah</Label>
              <Input 
                value={localProfil.nipKS} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, nipKS: e.target.value }))} 
                placeholder="-" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-nip-ks" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Tempat Titimangsa</Label>
              <Input 
                value={localProfil.tempatPengesahan} 
                onChange={(e) => setLocalProfil((p) => ({ ...p, tempatPengesahan: e.target.value }))} 
                placeholder="Lumajang" 
                className="bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                data-testid="input-tempat" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-white font-semibold text-xs">Foto Profil (Tampil di Aplikasi)</Label>
              <div className="flex items-center gap-3 p-1.5 bg-white border border-[#D4AF37]/40 rounded-lg min-h-[40px] px-3 shadow-sm">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10 flex-shrink-0 bg-black/5 flex items-center justify-center">
                  {localProfil.fotoBase64 ? (
                    <img src={localProfil.fotoBase64} alt="Foto Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-black/40" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" data-testid="input-foto" />
                  <span className="text-[10px] text-black/60 truncate max-w-[120px] font-bold">
                    {localProfil.fotoBase64 ? "Foto terunggah" : "Belum ada foto"}
                  </span>
                  <button 
                    type="button"
                    onClick={() => fotoInputRef.current?.click()} 
                    className="bg-black/5 hover:bg-black/10 text-[#a08020] px-3 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1.5 transition-colors border border-[#D4AF37]/30 shrink-0"
                  >
                    <Upload className="w-3 h-3" /> Pilih Foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Jadwal Mengajar */}
        <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 pb-3 mb-5">
            <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              Jadwal Mengajar
            </h3>
            <p className="text-xs text-white/60 mt-0.5">Centang hari mengajar — digunakan otomatis untuk perhitungan hari efektif di Program Semester (Promes)</p>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-[#D4AF37] text-xs uppercase border-b border-white/10">
                <tr>
                  <th className="p-3.5 text-center font-bold w-24 border-r border-white/10 text-white">Kelas</th>
                  {HARI_LABEL.map((h) => <th key={h} className="p-3.5 text-center font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeKelas.map((kls) => (
                  <tr key={kls} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-3.5 text-center font-bold text-white border-r border-white/10 bg-white/5">Kls {kls}</td>
                    {HARI.map((hari) => (
                      <td key={hari} className="p-3.5 text-center">
                        <Checkbox
                          checked={!!(jadwal[`kls${kls}`]?.[hari])}
                          onCheckedChange={() => toggleJadwal(kls, hari)}
                          className="mx-auto border-white/30 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-black"
                          data-testid={`checkbox-jadwal-${kls}-${hari}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Daftar Siswa per Rombel */}
        <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 pb-3 mb-5">
            <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              Daftar Siswa per Rombel
            </h3>
            <p className="text-xs text-white/60 mt-0.5">Tempel (Paste) daftar nama siswa langsung dari Excel. Setiap baris mewakili 1 orang siswa</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeKelas.map((kls) => (
              <div key={kls} className="space-y-2 p-3.5 bg-black/25 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <Label className="font-bold text-white text-sm">Kelas {kls}</Label>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/25" data-testid={`text-total-siswa-${kls}`}>
                    {hitungSiswa(kls)} Siswa
                  </span>
                </div>
                <Textarea
                  rows={4}
                  className="text-xs resize-none bg-white border-[#D4AF37]/40 text-black placeholder-black/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 font-bold shadow-sm"
                  placeholder={`Paste nama siswa kelas ${kls}...`}
                  value={siswa[`kls${kls}`] || ""}
                  onChange={(e) => setSiswa({ ...siswa, [`kls${kls}`]: e.target.value })}
                  data-testid={`textarea-siswa-${kls}`}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pb-8 pt-4">
        <button 
          onClick={simpan} 
          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-12 py-3.5 rounded-xl text-sm font-extrabold flex items-center gap-2.5 shadow-[0_10px_30px_rgba(212,175,55,0.25)] transition-all transform hover:-translate-y-0.5 duration-200"
          data-testid="button-simpan-profil"
        >
          <Save className="w-5 h-5" /> Simpan Profil & Sinkronisasi
        </button>
      </div>
    </AppBackground>
  );
}
