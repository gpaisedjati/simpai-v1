import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, ExternalLink, Download, Search, Info, LayoutList, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock Data for PAI Kurikulum Merdeka (SD, SMP, SMA)
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const LINKS_SISWA = [
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-i",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-ii",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sdmi-kelas-iii",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-iv",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-v",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-sdmi-kelas-vi",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-smp-kelas-vii",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-smp-kelas-viii",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-smpmts-kelas-ix",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-smasmk-kelas-x",
  "https://buku.kemendikdasmen.go.id/katalog/Pendidikan-Agama-Islam-Dan-Budi-Pekerti-kelas-XI",
  "https://buku.kemendikdasmen.go.id/katalog/pendidikan-agama-islam-dan-budi-pekerti-untuk-smasmkma-kelas-xii"
];

const LINKS_GURU = [
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-i",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-ii",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sdmi-kelas-iii",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-iv",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sd-kelas-v",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-sdmi-kelas-vi",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smp-kelas-vii",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smp-kelas-viii",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smpmts-kelas-ix",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smasmk-kelas-x",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smasmk-kelas-xi",
  "https://buku.kemendikdasmen.go.id/katalog/buku-panduan-guru-pendidikan-agama-islam-dan-budi-pekerti-untuk-smasmkma-kelas-xii"
];

const BUKU_PAI = Array.from({ length: 12 }).flatMap((_, i) => {
  const k = i + 1;
  const jenjang = k <= 6 ? "SD" : k <= 9 ? "SMP" : "SMA";
  const authorsSiswa = k <= 6 ? "M. Nurzakun, dkk." : k <= 9 ? "Albert, dkk." : "Ahmad, dkk.";
  const authorsGuru = k <= 6 ? "A. Zainal, dkk." : k <= 9 ? "Budi, dkk." : "Fatimah, dkk.";
  
  return [
    {
      id: `pai-${jenjang.toLowerCase()}-${k}-siswa`,
      kelas: k,
      jenjang,
      kategori: 'Buku Siswa',
      title: `Pendidikan Agama Islam dan Budi Pekerti untuk ${jenjang} Kelas ${ROMAN_NUMERALS[i]}`,
      cover: `https://placehold.co/400x600/10b981/ffffff?text=PAI+Kelas+${k}%0ASiswa`,
      topics: 10,
      author: authorsSiswa,
      year: '2021',
      link: LINKS_SISWA[i]
    },
    {
      id: `pai-${jenjang.toLowerCase()}-${k}-guru`,
      kelas: k,
      jenjang,
      kategori: 'Buku Guru',
      title: `Buku Panduan Guru PAI dan Budi Pekerti untuk ${jenjang} Kelas ${ROMAN_NUMERALS[i]}`,
      cover: `https://placehold.co/400x600/0ea5e9/ffffff?text=PAI+Kelas+${k}%0AGuru`,
      topics: 10,
      author: authorsGuru,
      year: '2021',
      link: LINKS_GURU[i]
    }
  ];
});

export default function Pustaka() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBooks = BUKU_PAI.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.kelas.toString().includes(searchTerm) ||
    b.jenjang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pustaka Buku PAI (Kurikulum Merdeka)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sumber resmi dan referensi utama dari pemerintah sebagai acuan materi pembelajaran, CP, TP, dan ATP dalam SIMPAI untuk semua jenjang.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-800">Acuan Sistem SIMPAI</h3>
          <p className="text-xs text-blue-700 mt-1">
            Semua proses penyusunan modul ajar, pemetaan kurikulum, dan distribusi materi pada SIMPAI SeDjati telah disinkronkan dan merujuk secara penuh pada buku teks PAI SD terbaru ini. Anda dapat mengunduh atau melihat preview buku sebagai pedoman.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Cari buku berdasarkan kelas, judul, atau jenjang (SD/SMP/SMA)..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((buku, idx) => (
          <motion.div 
            key={buku.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Book Cover */}
            <div className="h-56 bg-gray-100 relative group flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-gray-200 opacity-50"></div>
              <img 
                src={buku.cover} 
                alt={buku.title} 
                className="relative z-10 w-32 h-44 object-cover shadow-lg rounded-r-md border-l-4 border-gray-300 group-hover:scale-105 transition-transform duration-300" 
              />
              <div className={`absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold shadow-sm ${buku.kategori === 'Buku Siswa' ? 'text-emerald-700' : 'text-sky-700'}`}>
                {buku.kategori}
              </div>
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                {buku.jenjang}
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-gray-800 line-clamp-2 min-h-[40px] leading-tight mb-2">
                {buku.title}
              </h3>
              
              <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Penulis:</span> {buku.author}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Tahun:</span> {buku.year}
                </div>
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  Terintegrasi {buku.topics} Bab/Topik di SIMPAI
                </div>
              </div>
              
              <div className="mt-auto flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs" 
                  size="sm"
                  onClick={() => window.open(buku.link, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Preview (Kemdikbud)
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0" 
                  size="sm"
                  onClick={() => alert('Fitur unduh PDF akan dialihkan ke repositori pusat Kemdikbud.')}
                >
                  <Download className="w-3 h-3 mr-1.5" />
                  Unduh PDF
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Book className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Buku tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
}
