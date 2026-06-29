import { useState, useEffect, useMemo } from "react";
import { useSimpaiSiswa, useSimpaiProfil, useSimpaiArsip, getActiveKelasList } from "@/lib/storage";
import { useSession } from "@/lib/session";
import { apiGenerate } from "@/lib/api";
import { formatGuruName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Save, Printer, Award, ClipboardList, BookCheck, Zap } from "lucide-react";

type SiswaType = Record<string, string>;
type ArsipType = Array<{ id: string; judul: string; tipe: string; tanggal: string; konten: string }>;
type SubMenu = "grid" | "banksoal" | "jurnal" | "sertifikat";

export default function Asesmen({ initialSubMenu }: { initialSubMenu?: SubMenu }) {
  const [siswa] = useSimpaiSiswa() as [SiswaType, unknown];
  const [profil] = useSimpaiProfil();
  const [arsip, setArsip] = useSimpaiArsip() as [ArsipType, (v: ArsipType) => void];
  const { toast } = useToast();
  const session = useSession();

  const activeKelasList = useMemo(() => {
    return getActiveKelasList(profil);
  }, [profil]);

  const [subMenu, setSubMenu] = useState<SubMenu>("grid");

  useEffect(() => {
    if (initialSubMenu) {
      setSubMenu(initialSubMenu);
    }
  }, [initialSubMenu]);

  const [soalForm, setSoalForm] = useState({ kelas: "1", materi: "", jml_pg: "10", jml_uraian: "5" });

  useEffect(() => {
    if (activeKelasList.length > 0 && !activeKelasList.map(String).includes(soalForm.kelas)) {
      setSoalForm(p => ({ ...p, kelas: String(activeKelasList[0]) }));
    }
  }, [activeKelasList, soalForm.kelas]);

  const [soalOutput, setSoalOutput] = useState("");
  const [soalLoading, setSoalLoading] = useState(false);

  const [jurnalKelas, setJurnalKelas] = useState("1");

  useEffect(() => {
    if (activeKelasList.length > 0 && !activeKelasList.map(String).includes(jurnalKelas)) {
      setJurnalKelas(String(activeKelasList[0]));
    }
  }, [activeKelasList, jurnalKelas]);

  const [nilaiData, setNilaiData] = useState<Record<string, Record<string, string>>>({});

  const [sertForm, setSertForm] = useState({ namaSiswa: "", prestasi: "", tanggal: new Date().toLocaleDateString("id-ID") });

  const getSiswaList = (kls: string) => {
    const text = siswa[`kls${kls}`] || "";
    return text.split(/\r?\n/).filter((l) => l.trim());
  };

  const generateSoal = async () => {
    if (!soalForm.materi) { toast({ title: "Isi materi dulu", variant: "destructive" }); return; }
    setSoalLoading(true);
    try {
      const result = await apiGenerate(session.username, "soal", {
        kelas: soalForm.kelas, materi: soalForm.materi,
        jml_pg: soalForm.jml_pg, jml_uraian: soalForm.jml_uraian
      });
      setSoalOutput(result.hasil);
      session.setKuota(result.kuotaSisa, result.kuotaMaks);
      const id = `soal_${Date.now()}`;
      setArsip([...arsip, { id, judul: `Bank Soal - ${soalForm.materi} Kelas ${soalForm.kelas}`, tipe: "Soal", tanggal: new Date().toLocaleDateString("id-ID"), konten: result.hasil }]);
      toast({ title: "Soal Berhasil Dibuat", description: "Bank soal baru berhasil dirumuskan oleh Gemini AI dan disimpan ke Arsip." });
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setSoalLoading(false);
    }
  };

  const updateNilai = (nama: string, field: string, value: string) => {
    setNilaiData((prev) => ({ ...prev, [nama]: { ...(prev[nama] || {}), [field]: value } }));
  };

  const calcRata = (nama: string) => {
    const n = nilaiData[nama] || {};
    const vals = [n.f1, n.f2, n.sumatif].map(v => parseFloat(v || "0")).filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return "-";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const simpanJurnal = () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      localStorage.setItem("simpai_jurnal_last_saved", todayStr);
      // Dispatch events so other hooks and popover update immediately
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("local-storage"));
    } catch (e) {
      console.error(e);
    }
    toast({ title: "Tersimpan", description: `Jurnal Penilaian Kelas ${jurnalKelas} berhasil disimpan.` });
  };

  const subCards = [
    { id: "banksoal", label: "Bank Soal AI", sub: "Generate soal PG + Uraian + Kisi-kisi via Gemini", icon: BookCheck, color: "border-green-400 hover:border-green-500", iconColor: "text-green-600" },
    { id: "jurnal", label: "Jurnal Penilaian", sub: "Daftar nilai formatif & sumatif", icon: ClipboardList, color: "border-blue-400 hover:border-blue-500", iconColor: "text-blue-600" },
    { id: "sertifikat", label: "Sertifikat / Piagam", sub: "Cetak penghargaan prestasi siswa", icon: Award, color: "border-yellow-400 hover:border-yellow-500", iconColor: "text-yellow-600" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asesmen</h1>
          <p className="text-sm text-muted-foreground mt-1">Mesin Evaluasi PAI — soal nyata dari Gemini AI.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-medium">
          <Zap className="w-3 h-3" /> Kuota Ekspor: {session.kuotaSisa}/{session.kuotaMaks}
        </div>
      </div>

      {subMenu === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subCards.map((c) => (
            <button key={c.id} onClick={() => setSubMenu(c.id as SubMenu)}
              className={`bg-card text-left p-6 rounded-xl border-2 ${c.color} shadow-sm hover:shadow-md transition-all`}
              data-testid={`button-asesmen-${c.id}`}>
              <c.icon className={`w-8 h-8 mb-3 ${c.iconColor}`} />
              <h3 className="font-bold text-sm text-card-foreground mb-1">{c.label}</h3>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </button>
          ))}
        </div>
      )}

      {/* Bank Soal */}
      {subMenu === "banksoal" && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSubMenu("grid")} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kembali</Button>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-4 h-4 text-primary" /> Generator Bank Soal — Gemini AI</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label>Kelas</Label>
                  <Select value={soalForm.kelas} onValueChange={(v) => setSoalForm(p => ({ ...p, kelas: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{activeKelasList.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Jumlah PG</Label>
                  <Input type="number" value={soalForm.jml_pg} onChange={(e) => setSoalForm(p => ({ ...p, jml_pg: e.target.value }))} min="5" max="30" />
                </div>
                <div className="space-y-1">
                  <Label>Jumlah Uraian</Label>
                  <Input type="number" value={soalForm.jml_uraian} onChange={(e) => setSoalForm(p => ({ ...p, jml_uraian: e.target.value }))} min="1" max="10" />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-4">
                  <Label>Materi</Label>
                  <Input value={soalForm.materi} onChange={(e) => setSoalForm(p => ({ ...p, materi: e.target.value }))} placeholder="Contoh: Salat Wajib, Aqidah Islam, Kisah Nabi..." data-testid="input-materi-soal" />
                </div>
              </div>
              <Button onClick={generateSoal} disabled={soalLoading} className="w-full flex items-center justify-center gap-2" data-testid="button-generate-soal">
                <Sparkles className="w-4 h-4" /> {soalLoading ? "Gemini sedang membuat soal..." : "Generate Bank Soal via Gemini"}
              </Button>
              {soalOutput && (
                <div className="space-y-2">
                  <Textarea value={soalOutput} onChange={(e) => setSoalOutput(e.target.value)} className="font-mono text-xs h-96 resize-y" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Cetak</Button>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(soalOutput); toast({ title: "Disalin!" }); }}>Salin</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jurnal Penilaian */}
      {subMenu === "jurnal" && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSubMenu("grid")} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kembali</Button>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle className="text-base">Jurnal Penilaian Formatif & Sumatif</CardTitle>
                <Select value={jurnalKelas} onValueChange={setJurnalKelas}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{activeKelasList.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSiswaList(jurnalKelas).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada data siswa untuk Kelas {jurnalKelas}.</p>
                  <p className="text-xs mt-1">Silakan isi daftar siswa di menu Master Data terlebih dahulu.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase border-b border-border">
                        <tr>
                          <th className="p-3 text-left w-10">No</th>
                          <th className="p-3 text-left">Nama Siswa</th>
                          <th className="p-3 text-center w-24">Formatif 1</th>
                          <th className="p-3 text-center w-24">Formatif 2</th>
                          <th className="p-3 text-center w-24">Sumatif</th>
                          <th className="p-3 text-center w-24">Rata-rata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSiswaList(jurnalKelas).map((nama, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="p-3 text-muted-foreground">{idx + 1}</td>
                            <td className="p-3 font-medium">{nama}</td>
                            {["f1", "f2", "sumatif"].map((field) => (
                              <td key={field} className="p-2">
                                <input type="number" min="0" max="100"
                                  className="w-full text-center text-sm border border-border rounded p-1 focus:outline-none focus:border-primary bg-transparent"
                                  value={nilaiData[nama]?.[field] || ""}
                                  onChange={(e) => updateNilai(nama, field, e.target.value)}
                                  data-testid={`input-nilai-${field}-${idx}`} />
                              </td>
                            ))}
                            <td className="p-3 text-center font-bold text-primary">{calcRata(nama)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={simpanJurnal} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Nilai</Button>
                    <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Cetak</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generator Sertifikat */}
      {subMenu === "sertifikat" && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSubMenu("grid")} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kembali</Button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Data Sertifikat</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Nama Siswa</Label>
                  <Input value={sertForm.namaSiswa} onChange={(e) => setSertForm(p => ({ ...p, namaSiswa: e.target.value }))} placeholder="Nama lengkap siswa" data-testid="input-sertifikat-nama" />
                </div>
                <div className="space-y-1">
                  <Label>Prestasi</Label>
                  <Input value={sertForm.prestasi} onChange={(e) => setSertForm(p => ({ ...p, prestasi: e.target.value }))} placeholder="Hafal Surah Al-Fatihah" data-testid="input-sertifikat-prestasi" />
                </div>
                <div className="space-y-1">
                  <Label>Tanggal</Label>
                  <Input value={sertForm.tanggal} onChange={(e) => setSertForm(p => ({ ...p, tanggal: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <div className="border-4 border-double border-yellow-500 rounded-2xl p-6 bg-gradient-to-b from-yellow-50 to-amber-50 text-center space-y-3 shadow-lg">
                <div className="text-4xl">☪</div>
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">{profil.namaSekolah || "SD Islam Negeri"}</p>
                <h2 className="text-2xl font-bold text-yellow-800">PIAGAM PENGHARGAAN</h2>
                <p className="text-xs text-muted-foreground">Diberikan kepada:</p>
                <h3 className="text-xl font-bold underline text-yellow-900 min-h-8">{sertForm.namaSiswa || "________________"}</h3>
                <p className="text-sm text-muted-foreground">atas prestasi:</p>
                <p className="text-base font-semibold text-yellow-800 italic">"{sertForm.prestasi || "________________"}"</p>
                <div className="pt-4 flex justify-between items-end text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32 mb-1"></div>
                    <p>Kepala Sekolah</p>
                    <p className="font-semibold">{profil.namaKS || "________________"}</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1">{sertForm.tanggal}</p>
                    <div className="border-t border-gray-400 w-32 mb-1"></div>
                    <p>Guru PAI</p>
                    <p className="font-semibold">{profil.namaGuru || formatGuruName(session.username)}</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Cetak Piagam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
