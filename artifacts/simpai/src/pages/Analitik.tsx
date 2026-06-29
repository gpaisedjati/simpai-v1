import { useSimpaiSiswa, useSimpaiProfil, getActiveKelasList } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from "recharts";
import { BarChart2, TrendingUp, Users, CheckCircle } from "lucide-react";
import { useMemo } from "react";

type SiswaType = Record<string, string>;

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

const ketuntasanData = [
  { name: "Tuntas", value: 72, color: "#16a34a" },
  { name: "Belum Tuntas", value: 28, color: "#f59e0b" },
];

const serapanData = [
  { materi: "Al-Qur'an", persen: 85 },
  { materi: "Aqidah", persen: 78 },
  { materi: "Akhlak", persen: 90 },
  { materi: "Fikih", persen: 72 },
  { materi: "SKI", persen: 65 },
];

const perkembanganData = [
  { bulan: "Jul", rata: 74 }, { bulan: "Ags", rata: 76 }, { bulan: "Sep", rata: 78 },
  { bulan: "Okt", rata: 80 }, { bulan: "Nov", rata: 82 }, { bulan: "Des", rata: 85 },
];

export default function Analitik() {
  const [siswa] = useSimpaiSiswa() as [SiswaType, unknown];
  const [profil] = useSimpaiProfil();

  const activeKelasList = useMemo(() => {
    return getActiveKelasList(profil);
  }, [profil]);

  const dynamicPerKelasData = useMemo(() => {
    const hasAnyRealSiswa = activeKelasList.some(kls => (siswa[`kls${kls}`] || "").trim());
    return activeKelasList.map((kls) => {
      const text = (siswa[`kls${kls}`] || "").trim();
      const count = text ? text.split(/\r?\n/).filter((l) => l.trim()).length : 0;
      
      const total = hasAnyRealSiswa ? count : 25; 
      const tuntas = Math.round(total * 0.8);
      const belumTuntas = total - tuntas;
      
      return {
        kelas: `Kelas ${kls}`,
        tuntas,
        belumTuntas
      };
    });
  }, [siswa, activeKelasList]);

  const totalSiswa = Object.values(siswa).reduce((acc: number, val: unknown) => {
    if (typeof val === "string" && val.trim()) {
      return acc + val.trim().split("\n").filter((n) => n.trim()).length;
    }
    return acc;
  }, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analitik</h1>
        <p className="text-sm text-muted-foreground mt-1">Pusat Pantau — angka menjadi grafik untuk laporan profesional.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Siswa", value: totalSiswa || 125, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Rata-rata Nilai", value: "80.2", icon: BarChart2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Ketuntasan", value: "72%", icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
          { label: "ATP Tercapai", value: "68%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold" data-testid={`stat-analitik-${item.label.toLowerCase().replace(/ /g, "-")}`}>{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ketuntasan Belajar Keseluruhan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={ketuntasanData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {ketuntasanData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Serapan Materi ATP per Elemen</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serapanData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="materi" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="persen" name="Serapan (%)" fill="#16a34a" radius={[4, 4, 0, 0]}>
                  {serapanData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Perkembangan Nilai Rata-rata per Bulan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={perkembanganData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rata" name="Rata-rata Nilai" stroke="#16a34a" strokeWidth={2} dot={{ r: 4, fill: "#16a34a" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ketuntasan per Kelas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dynamicPerKelasData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="kelas" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tuntas" name="Tuntas" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="belumTuntas" name="Belum Tuntas" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Ringkasan */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ringkasan Ketuntasan per Kelas</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase border-b border-border">
                <tr>
                  <th className="p-3 text-left">Kelas</th>
                  <th className="p-3 text-center">Total Siswa</th>
                  <th className="p-3 text-center">Tuntas</th>
                  <th className="p-3 text-center">Belum Tuntas</th>
                  <th className="p-3 text-center">% Ketuntasan</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {dynamicPerKelasData.map((row, idx) => {
                  const total = row.tuntas + row.belumTuntas;
                  const persen = total > 0 ? Math.round((row.tuntas / total) * 100) : 0;
                  return (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-semibold">{row.kelas}</td>
                      <td className="p-3 text-center">{total}</td>
                      <td className="p-3 text-center text-green-600 font-medium">{row.tuntas}</td>
                      <td className="p-3 text-center text-yellow-600 font-medium">{row.belumTuntas}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 max-w-20">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${persen}%` }}></div>
                          </div>
                          <span className="font-bold">{persen}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${persen >= 75 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {persen >= 75 ? "Tercapai" : "Perlu Perhatian"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">* Data contoh untuk keperluan tampilan. Hubungkan dengan data penilaian nyata.</p>
        </CardContent>
      </Card>
    </div>
  );
}
