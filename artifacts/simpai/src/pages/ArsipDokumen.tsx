import { useSimpaiArsip } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Archive, Download, Printer, Trash2, FileText, FileSpreadsheet, ClipboardCheck, BookOpen } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useSession } from "@/lib/session";
import { apiUseQuota } from "@/lib/api";

type ArsipItem = { id: string; judul: string; tipe: string; tanggal: string; konten: string };
type ArsipType = ArsipItem[];

const TIPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  RPP: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: FileText },
  Promes: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: FileSpreadsheet },
  Soal: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: ClipboardCheck },
  Bahan: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: BookOpen },
};

export default function ArsipDokumen() {
  const [arsip, setArsip] = useSimpaiArsip() as [ArsipType, (v: ArsipType) => void];
  const { toast } = useToast();
  const session = useSession();

  const handleDownload = async (konten: string, judul: string) => {
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

  const hapus = (id: string) => {
    setArsip(arsip.filter((a) => a.id !== id));
    toast({ title: "Dokumen dihapus" });
  };

  const eksporLaporan = async () => {
    const laporan = [
      "LAPORAN KINERJA GURU PAI",
      "=".repeat(50),
      `Diekspor pada: ${new Date().toLocaleString("id-ID")}`,
      `Total dokumen: ${arsip.length}`,
      "",
      "DAFTAR DOKUMEN YANG PERNAH DIBUAT:",
      "—".repeat(50),
      ...arsip.map((a, i) => `${i + 1}. [${a.tipe}] ${a.judul} (${a.tanggal})`),
      "",
      "=".repeat(50),
      "Dokumen ini dihasilkan oleh SIM-PAI SEDJATI"
    ].join("\n");
    
    await handleDownload(laporan, "Laporan_Kinerja_GPAI");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arsip Dokumen</h1>
          <p className="text-sm text-muted-foreground mt-1">E-Portofolio Daring — semua dokumen yang pernah Anda buat tersimpan di sini.</p>
        </div>
        <Button variant="outline" onClick={eksporLaporan} className="flex items-center gap-2 flex-shrink-0" data-testid="button-ekspor-laporan">
          <Download className="w-4 h-4" /> Ekspor Laporan Kinerja
        </Button>
      </div>

      {arsip.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Archive className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg text-muted-foreground">Arsip Masih Kosong</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Dokumen yang Anda buat di menu Pembelajaran dan Asesmen (RPP, Promes, Soal) akan otomatis tersimpan di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{arsip.length} dokumen tersimpan</p>
          {arsip.slice().reverse().map((item) => {
            const config = TIPE_CONFIG[item.tipe] || TIPE_CONFIG["Bahan"];
            const Icon = config.icon;
            return (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow" data-testid={`card-arsip-${item.id}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.judul}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] px-1.5 py-0 ${config.color}`}>{item.tipe}</Badge>
                        <span className="text-xs text-muted-foreground">{item.tanggal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(item.konten, item.judul)} className="flex items-center gap-1.5" data-testid={`button-download-${item.id}`}>
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10" data-testid={`button-hapus-${item.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                          <AlertDialogDescription>Dokumen "{item.judul}" akan dihapus permanen dari arsip.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => hapus(item.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
