import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getGenAI(clientKey?: string) {
  const key = (clientKey || process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  }
  return new GoogleGenAI({ apiKey: key });
}

const MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.0-deep-think",
  "gemini-3.0-flash",
  "gemini-3.0-pro",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro"
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Try generating with model fallback on 503/overload */
async function generateWithRetry(prompt: string, clientKey?: string): Promise<string> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const response = await getGenAI(clientKey).models.generateContent({
        model,
        contents: prompt,
        config: { maxOutputTokens: 8192 },
      });
      return response.text ?? "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isOverload =
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED");

      const isUnsupported = msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("not supported");

      if (isOverload || isUnsupported) {
        lastError = err instanceof Error ? err : new Error(msg);
        console.warn(`Model ${model} gagal (${isOverload ? 'Overload' : 'Unsupported'}). Mencoba model berikutnya...`);
        continue; // Skip to next model immediately
      } else {
        // Non-retryable error (e.g. invalid key, safety block) — rethrow immediately
        throw err;
      }
    }
  }

  // All models failed
  throw new Error(
    `Semua model AI sedang penuh (high demand) atau tidak tersedia. Coba lagi dalam beberapa menit. (${lastError?.message ?? ""})`
  );
}

function buildPrompt(tipe: string, params: Record<string, string>): string {
  const {
    kelas = "", fase = "", materi = "", subMateri = "",
    alokasi = "2 x 35 menit", metode = "Ceramah, Tanya Jawab, Diskusi",
    namaGuru = "Guru PAI", namaSekolah = "SD Islam", namaKS = "",
    nipKS = "", nipGuru = "", tahunPelajaran = "2025/2026",
    semester = "Ganjil", topik = "", jml_pg = "10", jml_uraian = "5", elemen = "",
    tp_input = "", cp_input = "", is_tp_modified = "", urutan_elemen = ""
  } = params;

  switch (tipe) {
    case "rpp_1":
      return `Kamu adalah ahli kurikulum PAI (Pendidikan Agama Islam) untuk Sekolah Dasar di Indonesia. 
Buatkan Modul Ajar / Rencana Pembelajaran Mendalam (RPM) yang lengkap, profesional, dan mengintegrasikan pendekatan "Pembelajaran Mendalam" (Deep Learning: Mindful, Meaningful, Joyful) sesuai Kurikulum Merdeka (berbasis Buku Teks PAI terbaru dari Kemendikdasmen) untuk:

- Kelas: ${kelas} SD
- Mata Pelajaran: Pendidikan Agama Islam & Budi Pekerti  
- Capaian Pembelajaran: ${elemen}
- Materi Pokok: ${materi || "Sesuaikan dengan TP dan Capaian Pembelajaran"}
- Sub Materi: ${subMateri || materi || "Sesuaikan"}
- Tujuan Pembelajaran (ATP): ${tp_input || "Sesuaikan dengan Materi Pokok"}
- Alokasi Waktu: ${alokasi}
${metode && metode.trim() !== "" ? '- Model Pembelajaran (Permintaan Pengguna): ' + metode + ' (Patuhi model ini dan sesuaikan dengan Pendekatan Pembelajaran Mendalam)' : '- Model Pembelajaran: Tentukan sendiri model yang relevan, inovatif, dan mencerminkan eksplorasi bermakna (Mindful, Meaningful, Joyful).'}
- Tahun Pelajaran: ${tahunPelajaran}
- Semester: ${semester}

PENTING: UNTUK SAAT INI, ANDA HARUS MEMBUAT BAGIAN I (Identitas RPM & Dimensi Profil Lulusan), BAGIAN II (Tujuan Pembelajaran & KKTP), BAGIAN III (Kerangka Pembelajaran), DAN BAGIAN IV (Materi Pembelajaran). BERHENTI SETELAH BAGIAN IV SELESAI. JANGAN MEMBUAT BAGIAN V DAN SETERUSNYA.

Format output HARUS menggunakan format Markdown yang rapi dan mematuhi struktur hierarki ini dengan KETAT.
Untuk poin-poin yang memiliki turunan, gunakan SPASI (indentasi) yang konsisten agar sistem (UI) merender list bersarang (hanging indent) dengan rapi:
Contoh Hierarki:
I. Judul Romawi
   A. Judul Alfabet (Gunakan 3 spasi sebelum 'A.')
      1. Judul Angka (Gunakan 6 spasi sebelum '1.')
         - Bullet point (Gunakan 9 spasi sebelum '-')
            * Sub-bullet (Gunakan 12 spasi sebelum '*')

ATURAN FORMATTING TATA LETAK (MARKDOWN):
- **DILARANG LINE BREAK DI TENGAH KALIMAT POIN:** Jangan pernah menekan 'Enter' atau membuat baris baru (\\n) di tengah-tengah penjelasan dalam satu poin nomor/bullet. Biarkan teks mengalir panjang menyamping dalam satu baris (satu paragraf utuh per poin). Sistem UI akan membungkus baris (word-wrap) secara otomatis dengan indentasi yang sejajar (hanging indent).
- **TANPA BULLET UNTUK DESKRIPSI TUNGGAL:** Jika sebuah poin (seperti A, B, atau C) hanya berisi satu paragraf deskripsi tunggal, JANGAN gunakan bullet point (tanda strip/dash '-'). Langsung tuliskan paragrafnya. Bullet point HANYA digunakan jika memang ada beberapa poin rincian yang harus disebutkan di dalamnya.

Berikut adalah STRUKTUR MUTLAK yang harus Anda penuhi, IKUTI GAYA DAN PENAMAAN INI PERSIS SAMA (Sesuaikan konten dengan mapel PAI dan materinya):

## I. Identitas RPM & Dimensi Profil Lulusan

**Mata Pelajaran:** Pendidikan Agama Islam & Budi Pekerti
**Jenjang Pendidikan:** SD
**Kelas/Fase:** ${kelas} / (Sesuaikan Fase)
**Semester:** ${semester}
**Alokasi Waktu:** ${alokasi} (... Pertemuan)
**Model Pembelajaran:** ${metode || "Project Based Learning (PJBL) (Atau sesuaikan)"}

**Dimensi Profil Lulusan yang dikembangkan:**
- (Tulis nama dimensinya saja TANPA penjelasan tambahan. Contoh: "Beriman, bertakwa kepada Tuhan Yang Maha Esa, dan berakhlak mulia.")
- (Tulis dimensi ke-2 TANPA penjelasan)
- (Tulis dimensi ke-3 TANPA penjelasan)

## II. Tujuan Pembelajaran & KKTP

A. TUJUAN PEMBELAJARAN
(SANGAT PENTING: JANGAN PERNAH MENGARANG ATAU MENAMBAHKAN TUJUAN PEMBELAJARAN (TP) BARU. GUNAKAN HANYA DAFTAR TP BERIKUT INI PERSIS SEPERTI APA ADANYA DAN GUNAKAN ANGKA (1., 2., 3., dst) UNTUK LIST. JIKA DAFTAR TP KOSONG, BARU SESUAIKAN DENGAN MATERI. Daftar TP: ${tp_input || "Sesuaikan dengan Materi Pokok"})

B. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN
(Jabarkan KKTP yang selaras untuk SEMUA TP di atas, buatlah kalimat yang SINGKAT DAN JELAS, buat poin-poin bernomor (1., 2., 3., dst) sejumlah TP)

## III. Kerangka Pembelajaran

A. Praktik Pedagogis
(Satu paragraf utuh penjelasan tanpa line break yang mendeskripsikan penerapan pendekatan Deep Learning: Mindful, Meaningful, Joyful secara spesifik pada materi ini)

B. Lingkungan Pembelajaran
(Satu paragraf utuh penjelasan tanpa line break yang mendeskripsikan suasana fisik, interaksi, dan tata letak kelas yang aman serta mendukung materi ini)

C. Kemitraan Pembelajaran
(Satu paragraf utuh penjelasan tanpa line break yang mendeskripsikan bentuk kolaborasi spesifik dengan orang tua, masyarakat, atau tutor sebaya)

D. Pemanfaatan Digital
(Satu paragraf utuh penjelasan tanpa line break yang mendeskripsikan perangkat, aplikasi, atau sumber media audio-visual yang digunakan)

## IV. Materi Pembelajaran
(Bagian ini WAJIB berisi substansi ILMU, FAKTA, dan DEFINISI yang komprehensif, mendalam, dan lengkap yang mengacu pada Buku Teks PAI Kurikulum Merdeka terbaru untuk Kelas ${kelas} materi ${materi}. Jabarkan materi ini sedetail mungkin sehingga guru mendapatkan ringkasan yang kaya dan utuh. JANGAN HANYA MEMBERIKAN POIN SINGKAT, JABARKAN PENJELASANNYA. Susun secara terstruktur dengan sub-bab A, B, C, dst.)

A. (Judul Sub-Materi Pertama)
(Tuliskan satu paragraf utuh atau lebih yang menjelaskan secara lengkap dan mendalam)

B. (Judul Sub-Materi Kedua)
(Jelaskan secara mendalam, gunakan poin-poin bernomor jika ada rincian)
1. (Rincian 1): (Penjelasan lengkap)
2. (Rincian 2): (Penjelasan lengkap)

(Silakan tambah C, D, E, dst agar cakupan materinya di buku Kurikulum Merdeka ter-cover secara komprehensif dan utuh)

Pastikan kamu mematuhi instruksi di atas DENGAN SANGAT KETAT, agar aplikasi dapat merendernya dengan rapi dan mendalam.
Gunakan Bahasa Indonesia formal dan baku. Buat konten yang Islami, bermakna (Meaningful), tidak sekadar hafalan kering, melainkan menyentuh esensi spiritual dan sosial siswa SD. JANGAN MENGGUNAKAN KATA-KATA SAPAAN, LANGSUNG BERIKAN OUTPUT MODUL.`;

    case "rpp_pertemuan":
      return `Kamu adalah ahli kurikulum PAI (Pendidikan Agama Islam). Kamu sedang menyusun Modul Ajar berkelanjutan.
Berdasarkan konteks materi Modul Ajar berikut ini:
---
${params.context}
---

Tugasmu HANYA menyusun Skenario Pertemuan ke-${params.pertemuanKe} SANGAT DETAIL. Ini adalah pertemuan ke-${params.pertemuanKe} dari total ${params.totalPertemuan} pertemuan.

${params.tujuanPembelajaranPertemuan ? `TUJUAN PEMBELAJARAN KHUSUS UNTUK PERTEMUAN KE-${params.pertemuanKe} INI (WAJIB FOKUS PADA POIN BERIKUT SAJA, DILARANG MEMBAHAS TOPIK PERTEMUAN LAIN):
${params.tujuanPembelajaranPertemuan}
` : ""}

Gunakan model pembelajaran ${metode || "Project Based Learning (PJBL)"}. IKUTI FORMAT BERIKUT SECARA KETAT!
${params.pertemuanKe === "1" ? "DILARANG membuat bagian selain V. Langkah-Langkah Kegiatan Pembelajaran (Hanya Pertemuan ke-1). JANGAN TULISKAN ROMAWI V LAGI, LANGSUNG SAJA MULAI DARI KATA-KATA \"## V. Langkah-Langkah Kegiatan Pembelajaran\" kemudian baris baru \"**Pertemuan ke-1\"" : "JANGAN TULISKAN ROMAWI V LAGI. Langsung saja mulai dari format berikut dengan wajib menyertakan garis pembatas markdown (---) di baris pertama."}

${params.pertemuanKe !== "1" ? "---\n" : ""}
**Pertemuan ke-${params.pertemuanKe}**
*(Fokus Materi: ${params.fokusMateriPertemuan || `Tentukan porsi materi yang tepat untuk pertemuan ke-${params.pertemuanKe} berdasarkan urutan logis dari Romawi IV Materi Pembelajaran`})*

A. Kegiatan Pendahuluan (${params.waktuPendahuluan || "15"} menit)
Prinsip: Berkesadaran (Mindful)
Pembukaan:
- Guru menyapa murid dan mengecek kehadiran dengan ramah.
- (Jabarkan kegiatan apersepsi, penyampaian tujuan, dan pertanyaan pemantik secara lugas)

B. Kegiatan Inti

(SANGAT PENTING: JANGAN MENGGUNAKAN BULLET/NOMOR UNTUK JUDUL 'PENGALAMAN BELAJAR', 'Prinsip:', 'Aktivitas Eksplorasi:', dll. Cukup tuliskan teksnya sebagai paragraf biasa. HANYA gunakan bullet point ('- ') untuk rincian kegiatannya saja)

**PENGALAMAN BELAJAR 1: MEMAHAMI (Eksplorasi Konsep)**
Prinsip: Bermakna, Menggembirakan | Alokasi Waktu: ${params.waktuPengalaman1 || "40"} menit
Tahap ini berfokus pada eksplorasi dan pemahaman konsep (Sintaks Model: ... )
Aktivitas Eksplorasi:
- (Jabarkan aktivitas pengamatan atau eksplorasi oleh siswa)
Pendalaman Konsep:
- (Jabarkan aktivitas fasilitasi diskusi atau tanya jawab oleh guru)
Koneksi dengan Pengetahuan Sebelumnya:
- (Jabarkan aktivitas mengaitkan materi dengan pengalaman siswa)

**PENGALAMAN BELAJAR 2: MENGAPLIKASIKAN (Aksi Nyata)**
Prinsip: Bermakna, Menggembirakan | Alokasi Waktu: ${params.waktuPengalaman2 || "30"} menit
Tahap ini berfokus pada penerapan pengetahuan dalam konteks berbeda (Sintaks Model: ...)
Pembagian Kelompok & Penugasan:
- (Jabarkan instruksi tugas atau pembagian kelompok)
Praktik & Penerapan:
- (Jabarkan aktivitas praktik, pembuatan proyek, atau penyelesaian masalah)
Kolaborasi & Diskusi:
- (Jabarkan aktivitas diskusi kelompok dan bimbingan guru)

**PENGALAMAN BELAJAR 3: MEREFLEKSIKAN (Evaluasi Diri)**
Prinsip: Berkesadaran, Bermakna | Alokasi Waktu: ${params.waktuPengalaman3 || "15"} menit
Tahap ini berfokus pada refleksi dan evaluasi pembelajaran
Refleksi Diri Murid:
- (Jabarkan pertanyaan refleksi atau aktivitas evaluasi yang dilakukan siswa)

C. Kegiatan Penutup (${params.waktuPenutup || "10"} menit)
Prinsip: Berkesadaran (Mindful)
(SANGAT PENTING: JANGAN gunakan bullet untuk 'Kesimpulan:' dan 'Tindak Lanjut:')
Kesimpulan:
- (Jabarkan aktivitas menyimpulkan materi bersama)
Tindak Lanjut:
- (Jabarkan penyampaian rencana berikutnya dan doa penutup)

PENTING SECARA MATEMATIS: 
Alokasi waktu total untuk Pertemuan ini adalah tepat ${params.totalWaktuPertemuan || "105"} menit.
Rincian waktu wajib kamu patuhi persis seperti ini:
- Kegiatan Pendahuluan: ${params.waktuPendahuluan || "15"} menit
- Pengalaman Belajar 1 (Eksplorasi Konsep): ${params.waktuPengalaman1 || "40"} menit
- Pengalaman Belajar 2 (Aksi Nyata): ${params.waktuPengalaman2 || "30"} menit
- Pengalaman Belajar 3 (Evaluasi Diri): ${params.waktuPengalaman3 || "15"} menit
- Kegiatan Penutup: ${params.waktuPenutup || "10"} menit
Total durasi harus tepat 100% klop yaitu ${params.totalWaktuPertemuan || "105"} menit. JANGAN pernah menggunakan angka alokasi waktu lain selain rincian di atas!

(Pastikan setiap sub-aktivitas disajikan dalam bentuk poin-poin/bullet (gunakan tanda '-') yang lugas dan berfokus pada interaksi nyata, hindari kalimat pengantar yang bertele-tele. Tulis murni satu paragraf utuh per poin tanpa line break / enter di tengah poin)

Pastikan mematuhi format DENGAN SANGAT KETAT. JANGAN MENGGUNAKAN KATA-KATA SAPAAN. LANGSUNG BERIKAN OUTPUT.`;

    case "rpp_4":
      return `Kamu adalah ahli kurikulum PAI. Buatkan Media & Sumber Belajar Digital untuk Modul Ajar ini berdasarkan konteks materi berikut:
---
${params.context}
---

Tugasmu HANYA menyusun Romawi VI. Media & Sumber Belajar Digital yang relevan, modern, ringkas (tidak bertele-tele, padat informasi), dan inovatif sesuai Kurikulum Merdeka untuk tingkat SD Kelas ${kelas || "SD"}. 

PANDUAN UTAMA:
1. Keterangan media wajib dibuat ringkas, padat, dan langsung pada fungsionalitasnya (maksimal 2 baris kalimat per poin).
2. WAJIB menyertakan link aktif yang relevan dalam format markdown, misalnya: [Platform Merdeka Mengajar (PMM)](https://guru.kemdikbud.go.id), [Portal Al-Qur'an Kemenag](https://quran.kemenag.go.id), [Wordwall](https://wordwall.net), [Quizizz](https://quizizz.com), atau portal resmi lainnya yang sesuai.

Langsung berikan output dengan format berikut secara ketat:

---

## VI. Media & Sumber Belajar Digital

A. Media Pembelajaran Digital
- (Sebutkan 1 media visual/video interaktif ringkas, sertakan link YouTube/Canva yang relevan)
- (Sebutkan 1 media gamifikasi interaktif seperti kuis interaktif di [Wordwall](https://wordwall.net) atau [Quizizz](https://quizizz.com) beserta deskripsi cara pakainya yang sangat singkat)

B. Sumber Belajar Digital bagi Guru
- Buku Panduan Guru PAI & Budi Pekerti Kelas ${kelas || "SD"} Kemendikdasmen RI digital di [Sibi Kemdikbud](https://buku.kemdikbud.go.id)
- (Sebutkan 1 platform pendukung, misalnya modul ajar terkait di [Platform Merdeka Mengajar (PMM)](https://guru.kemdikbud.go.id) atau layanan administrasi di [SIAGA Pendis](https://www.siagapendis.com))

C. Sumber Belajar Digital bagi Siswa
- Buku Siswa PAI & Budi Pekerti Kelas ${kelas || "SD"} Kemendikdasmen RI digital di [Sibi Kemdikbud](https://buku.kemdikbud.go.id)
- (Sebutkan 1 sumber belajar mandiri siswa, misalnya [Tafsir & Terjemahan Kemenag](https://quran.kemenag.go.id) untuk pembelajaran ayat Al-Qur'an, atau video edukasi Islami pendek)

JANGAN MENGGUNAKAN KATA-KATA SAPAAN. LANGSUNG BERIKAN OUTPUT MEDIA & SUMBER BELAJAR DIGITAL. WAJIB MENYERTAKAN "---" (garis batas markdown) DI BARIS PERTAMA.`;

    case "rpp_5":
      return `Kamu adalah ahli kurikulum PAI. Buatkan Lampiran: Asesmen (Penilaian) untuk Modul Ajar ini berdasarkan konteks materi berikut:
---
${params.context}
---

Tugasmu HANYA menyusun LAMPIRAN: Asesmen (Penilaian) yang lengkap, komprehensif, dan siap pakai. Langsung berikan output seperti ini:

---

## LAMPIRAN: ASESMEN & INSTRUMEN PENILAIAN

A. Penilaian Sikap (Spiritual & Sosial)
- (Berikan instrumen atau rubrik observasi singkat yang jelas untuk sikap spiritual seperti berdoa dan berperilaku bersyukur, serta sikap sosial seperti jujur, tanggung jawab, dan peduli)

B. Penilaian Pengetahuan
- (Berikan 5 soal pilihan ganda lengkap dengan kunci jawaban yang mengevaluasi langsung materi di atas)
- (Berikan 2 soal uraian HOTS/analitis beserta rubrik kunci jawaban)

C. Penilaian Keterampilan
- (Berikan deskripsi praktik atau proyek yang relevan beserta rubrik kriteria penilaiannya)

JANGAN MENGGUNAKAN KATA-KATA SAPAAN. LANGSUNG BERIKAN OUTPUT LAMPIRAN ASESMEN. WAJIB MENYERTAKAN "---" (garis batas markdown) DI BARIS PERTAMA.`;

    case "soal":
      return `Kamu adalah guru PAI berpengalaman. Buatkan bank soal yang berkualitas untuk:

- Kelas: ${kelas} SD
- Materi: ${materi}
- Jumlah Pilihan Ganda: ${jml_pg} soal
- Jumlah Uraian: ${jml_uraian} soal

KETENTUAN:
1. Soal PG harus memiliki 4 pilihan (A, B, C, D), dan kunci jawaban jelas
2. Jenjang kognitif bervariasi: C1 (Ingatan), C2 (Pemahaman), C3 (Penerapan)
3. Soal uraian memiliki skor dan model jawaban
4. Bahasa soal harus mudah dipahami siswa SD
5. Konten soal harus sesuai Al-Qur'an, Hadis, dan ajaran Islam

FORMAT:
A. SOAL PILIHAN GANDA
[nomor]. [soal]
A. [pilihan]
B. [pilihan]  
C. [pilihan]
D. [pilihan]
Kunci: [huruf]

B. SOAL URAIAN
[nomor]. [soal] (Skor: [nilai])
Kunci Jawaban: [model jawaban]

C. KISI-KISI SOAL
[tabel: No | Kompetensi Dasar | Materi | Level Kognitif | Bentuk Soal | Nomor]

Gunakan Bahasa Indonesia yang baik dan benar.`;

    case "pemetaan":
      return `Peran dan Konteks:
Anda adalah Asisten Ahli Kurikulum Pendidikan Agama Islam (PAI) yang menguasai penyempurnaan Kurikulum Merdeka dengan pendekatan "Pembelajaran Mendalam" (Deep Learning: Mindful, Meaningful, Joyful). Tugas Anda adalah mendekonstruksi teks Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP) dan menyusun Alur Tujuan Pembelajaran (ATP) untuk elemen ${elemen} pada ${fase} (Semester ${semester}). Pastikan Anda menyusun materi ini selaras dengan Buku Teks Utama PAI dan Budi Pekerti Kurikulum Merdeka (edisi terbaru dari Kemendikbudristek/Kemendikdasmen).

${cp_input ? `Capaian Pembelajaran (CP) Acuan:\n${cp_input}\n\n` : ''}${tp_input ? `Tujuan Pembelajaran (TP) Acuan (DARI KOTAK INPUT):\n${tp_input}\n\nINSTRUKSI KHUSUS KARENA TP SUDAH ADA:\n1. Anda DILARANG KERAS merubah, menambah, atau mengurangi satu kata pun dari kalimat Tujuan Pembelajaran (TP) Acuan di atas. Anda HARUS menyalinnya secara persis dan memformatnya menjadi bullet points (-).\n2. Tugas utama Anda HANYALAH merumuskan Alur Tujuan Pembelajaran (ATP) dengan NUMBERING KODE ELEMEN. KALIMAT ATP HARUS SAMA PERSIS DENGAN KALIMAT TP, dilarang menambahkan kalimat penjelas tambahan!\n3. Untuk urutan ATP: ${is_tp_modified === "true" ? 'Karena TP terlihat sudah dimodifikasi oleh user, susun urutannya berdasarkan Taksonomi SOLO (dari yang sederhana ke kompleks).' : 'Karena TP sesuai dengan standar (belum dimodifikasi), Anda DILARANG menggunakan Taksonomi SOLO. Urutkan ATP SAMA PERSIS dengan urutan TP Acuan di atas.'}\n4. **KODE NUMBERING ATP**: Gunakan format "[Nomor Urut Elemen].[Nomor Urut ATP]". Nomor urut elemen ini adalah ${urutan_elemen}. Contoh format: ${urutan_elemen}.1 [kalimat], ${urutan_elemen}.2 [kalimat], ${urutan_elemen}.3 [kalimat], dan seterusnya.\n\nAbaikan aturan Taksonomi Bloom dan SOLO di bawah karena instruksi khusus ini lebih diutamakan.\n\n` : ''}Aturan Mutlak (WAJIB DIPATUHI):

1. Penggunaan Taksonomi Bloom (Untuk Rumusan TP):
- Setiap kalimat TP wajib diawali dengan Kata Kerja Operasional (KKO) dari Taksonomi Bloom.
- Sesuaikan level kognitif dengan Fase pengguna: Fase awal (SD) dominan C1-C3, Fase menengah (SMP) dominan C2-C5, Fase akhir (SMA) dominan C4-C6.

2. Penggunaan Taksonomi SOLO (Untuk Urutan ATP):
Susun ATP wajib mematuhi hierarki pemahaman Taksonomi SOLO, berurutan dari:
- Unistruktural (Mengenali satu konsep dasar).
- Multistruktural (Memahami beberapa konsep/dalil tanpa menghubungkannya).
- Relasional (Menghubungkan konsep/dalil dengan makna ibadah/akhlak).
- Extended Abstract (Menerapkan dan memecahkan masalah di konteks kehidupan nyata).
PENTING: Jangan tampilkan label tahap SOLO (seperti "[Unistruktural]" atau "Tahap Unistruktural:") di dalam output. Biarkan urutannya saja yang mencerminkan hierarki tersebut secara implisit. Dilarang menggunakan tanda bintang dua (**kata**) pada kata kerja atau kata apapun di dalam TP dan ATP.

3. Format Numbering ATP:
Gunakan format "[Nomor Urut Elemen].[Nomor Urut ATP]". Nomor urut elemen ini adalah ${urutan_elemen}. Contoh format: ${urutan_elemen}.1 [kalimat ATP 1], ${urutan_elemen}.2 [kalimat ATP 2], dan seterusnya.

4. Integrasi Pendekatan Deep Learning:
- Mindful: Rumusan kalimat harus fokus, tidak tumpang tindih, dan memperhatikan beban kognitif siswa.
- Meaningful: Pada level Relasional dan Extended Abstract, pastikan TP memuat relevansi (makna) materi PAI dengan kehidupan sehari-hari atau pemecahan masalah (Problem-Based).
- Joyful: Hindari kalimat yang kaku atau murni hafalan kering. Gunakan diksi aktivitas yang memicu eksplorasi yang menyenangkan (misal: "menemukan hikmah", "merancang simulasi", "menganalisis kisah").

5. Materi Pokok Sesuai Buku Teks:
Pastikan konten/materi yang dijabarkan dalam TP dan ATP benar-benar mencerminkan pembagian Bab/Materi Pokok pada buku teks asli Kurikulum Merdeka (Kemendikbudristek/Kemendikdasmen) sesuai kelas dan semesternya. (Misal: Semester 1 umumnya Bab 1-5, Semester 2 Bab 6-10).

6. Format Output (Sangat Penting):
Dilarang memberikan basa-basi, sapaan, atau penjelasan tambahan (seperti "Berikut adalah hasilnya").
Langsung hasilkan output dalam 2 bagian yang dibatasi penanda jelas agar mudah di-parsing oleh sistem.

Gunakan format persis seperti ini:

[START_TP]
(Tuliskan daftar TP di sini menggunakan bullet points)
[END_TP]

[START_ATP]
(Tuliskan urutan ATP di sini menggunakan penomoran 1, 2, 3, dst sesuai hierarki SOLO)
[END_ATP]`;

    case "ringkasan":
      return `Buatkan ringkasan materi PAI yang jelas dan komprehensif tentang: "${topik}"
untuk siswa Kelas ${kelas || "SD"}.

Ringkasan harus mencakup:
1. PENGERTIAN (definisi sederhana yang mudah dipahami siswa SD)
2. DALIL/LANDASAN (ayat Al-Qur'an atau Hadis yang relevan, lengkap dengan terjemahan)
3. POIN-POIN PENTING (5-7 poin utama yang perlu diingat siswa)
4. CONTOH DALAM KEHIDUPAN (3-5 contoh nyata yang dekat dengan keseharian siswa SD)
5. HIKMAH DAN MANFAAT (mengapa materi ini penting dipelajari)
6. LATIHAN SINGKAT (2-3 pertanyaan untuk mengecek pemahaman)

Bahasa: sederhana, ramah anak, namun tetap akurat secara keilmuan Islam.
Format: terstruktur dengan judul yang jelas untuk setiap bagian.`;

    case "lkpd":
      return `Buatkan Lembar Kerja Peserta Didik (LKPD) yang menarik dan interaktif tentang: "${topik}"
untuk siswa Kelas ${kelas || "SD"}.

LKPD harus terdiri dari:
1. HEADER: Judul LKPD, Nama, Kelas, Tanggal, Mata Pelajaran
2. TUJUAN PEMBELAJARAN: 2-3 tujuan yang akan dicapai
3. PETUNJUK KERJA: instruksi yang jelas dan mudah dipahami
4. KEGIATAN 1 - Ayo Membaca: teks pendek tentang ${topik} (150-200 kata)
5. KEGIATAN 2 - Ayo Menjawab: 5 soal pilihan ganda tentang teks
6. KEGIATAN 3 - Ayo Menulis: 3 pertanyaan isian/essay yang mendorong refleksi
7. KEGIATAN 4 - Ayo Praktik/Berkreasi: satu aktivitas hands-on atau observasi
8. REFLEKSI: 3 pertanyaan refleksi diri tentang materi

Format output seperti LKPD nyata yang siap cetak. Gunakan bahasa yang menyenangkan dan motivatif untuk anak SD.`;

    case "presentasi":
      return `Buatkan naskah/isi slide presentasi PowerPoint yang menarik tentang: "${topik}"
untuk pembelajaran PAI Kelas ${kelas || "SD"}.

Format per slide:
SLIDE [nomor] - [JUDUL SLIDE]
Konten: [isi slide - poin-poin singkat]
Catatan guru: [penjelasan untuk guru saat presentasi]
Visual: [saran gambar/ilustrasi yang sesuai]

Slide yang harus dibuat:
1. Slide Judul (judul topik + materi pelajaran)
2. Slide Apersepsi (pertanyaan pemantik atau cerita pembuka)
3-5. Slide Materi Inti (3 slide berisi poin-poin utama ${topik})
6. Slide Dalil (ayat Al-Qur'an atau Hadis relevan dengan terjemahan)
7. Slide Contoh & Penerapan (contoh nyata dalam kehidupan sehari-hari)
8. Slide Diskusi (pertanyaan diskusi kelompok)
9. Slide Kesimpulan (poin-poin kunci yang harus diingat)
10. Slide Penutup (doa penutup majelis + motivasi)

Total: 10 slide. Bahasa: singkat, jelas, dan menarik untuk siswa SD.`;

    case "icebreaking":
      return `Buatkan variasi ice breaking dan games yang menyenangkan dan Islami untuk pembelajaran PAI tentang: "${topik}"
di Kelas ${kelas || "SD"}.

Buat 4 variasi ice breaking berbeda:

1. TEPUK KREATIF (tepuk tangan bertemakan ${topik})
   - Nama tepuk
   - Lirik/kata-kata tepuk
   - Cara memimpin

2. KUIS CEPAT KILAT (5 pertanyaan singkat tentang ${topik})
   - Format: pertanyaan singkat + jawaban
   - Cara bermain

3. GERAK & LAGU (nyanyian pendek atau gerak sederhana bertema Islam)
   - Lirik/gerakan
   - Melodi (boleh gubahan lagu anak yang sudah dikenal)

4. PERMAINAN KELOMPOK (1 game ringan yang bisa dilakukan di kelas)
   - Nama game
   - Peraturan (singkat, max 3 aturan)
   - Cara bermain
   - Kaitan dengan materi ${topik}

Semua ice breaking harus Islami, menyenangkan, dan bisa selesai dalam 3-5 menit.`;

    default:
      return `Kamu adalah asisten guru PAI SD. Bantu saya dengan: ${JSON.stringify(params)}`;
  }
}

// POST /api/ai/generate
router.post("/generate", async (req, res) => {
  const clientKey = req.headers["x-gemini-api-key"] as string | undefined;

  const { username, tipe, params } = req.body as {
    username?: string;
    tipe?: string;
    params?: Record<string, string>;
  };

  if (!username || !tipe) {
    res.status(400).json({ error: "Username dan tipe wajib diisi." });
    return;
  }

  const isKeyAvailable = clientKey || process.env.GEMINI_API_KEY || true; // Overridden to true as we fallback to hardcoded key
  if (!isKeyAvailable) {
    res.status(503).json({ error: "Gemini API Key belum dikonfigurasi. Hubungi administrator atau masukkan API Key Anda sendiri di menu Pengaturan." });
    return;
  }

  try {
    const { getUserFromSheets, incrementQuotaInSheets } = await import("./auth.js");
    const user = await getUserFromSheets(username.trim().toLowerCase());

    if (!user) {
      res.status(401).json({ error: "User tidak ditemukan. Silakan login ulang." });
      return;
    }
    if (user.status !== "Aktif") {
      res.status(403).json({ error: "Akun Anda tidak aktif. Hubungi administrator." });
      return;
    }

    let text = "";
    if (tipe === "rpp") {
      const prompt1 = buildPrompt("rpp_1", params || {});
      const bagian1 = await generateWithRetry(prompt1, clientKey);

      const paramsWithContext = { ...(params || {}), context: bagian1 };
      
      let numMeetings = 2; // fallback
      if (params?.alokasi) {
        const match = params.alokasi.match(/(\d+)\s*Pertemuan/i);
        if (match && match[1]) {
           numMeetings = parseInt(match[1]);
        }
      }
      if (numMeetings < 1) numMeetings = 1;
      if (numMeetings > 10) numMeetings = 10; // limit safety

      let jp = 12;
      let jpDuration = 35;
      if (params?.alokasi) {
        const fullMatch = params.alokasi.match(/(\d+)\s*x\s*(\d+)\s*Menit\s*\((\d+)\s*Pertemuan\)/i);
        if (fullMatch) {
          jp = parseInt(fullMatch[1]);
          jpDuration = parseInt(fullMatch[2]);
        } else {
          const matchJp = params.alokasi.match(/(\d+)\s*x/i);
          if (matchJp && matchJp[1]) {
            jp = parseInt(matchJp[1]);
          }
        }
      }

      const totalWaktuPertemuan = Math.round((jp * jpDuration) / numMeetings);
      const waktuPendahuluan = totalWaktuPertemuan >= 80 ? 15 : 10;
      const waktuPenutup = 10;
      const sisaWaktu = totalWaktuPertemuan - waktuPendahuluan - waktuPenutup;

      let waktuPengalaman1 = Math.round((sisaWaktu * 0.45) / 5) * 5;
      let waktuPengalaman2 = Math.round((sisaWaktu * 0.35) / 5) * 5;
      let waktuPengalaman3 = sisaWaktu - waktuPengalaman1 - waktuPengalaman2;

      if (waktuPengalaman3 < 5) {
        waktuPengalaman3 = 10;
        waktuPengalaman1 = Math.round((sisaWaktu - waktuPengalaman3) * 0.55 / 5) * 5;
        waktuPengalaman2 = sisaWaktu - waktuPengalaman1 - waktuPengalaman3;
      }

      let distribusi: any[] = [];
      if (params?.distribusiPertemuan) {
        try {
          distribusi = typeof params.distribusiPertemuan === "string" 
            ? JSON.parse(params.distribusiPertemuan) 
            : params.distribusiPertemuan;
        } catch (e) {
          console.error("Gagal parse distribusiPertemuan:", e);
        }
      }

      const meetingPromises = [];
      for (let i = 1; i <= numMeetings; i++) {
        const alloc = (Array.isArray(distribusi) && distribusi[i - 1]) ? distribusi[i - 1] : {};
        const pContext = { 
          ...paramsWithContext, 
          pertemuanKe: String(i), 
          totalPertemuan: String(numMeetings),
          fokusMateriPertemuan: alloc.fokusMateri || "",
          tujuanPembelajaranPertemuan: alloc.tps || "",
          totalWaktuPertemuan: String(totalWaktuPertemuan),
          waktuPendahuluan: String(waktuPendahuluan),
          waktuPengalaman1: String(waktuPengalaman1),
          waktuPengalaman2: String(waktuPengalaman2),
          waktuPengalaman3: String(waktuPengalaman3),
          waktuPenutup: String(waktuPenutup)
        };
        meetingPromises.push(generateWithRetry(buildPrompt("rpp_pertemuan", pContext), clientKey));
      }
      
      const p4 = generateWithRetry(buildPrompt("rpp_4", paramsWithContext), clientKey);
      const p5 = generateWithRetry(buildPrompt("rpp_5", paramsWithContext), clientKey);

      const meetings = await Promise.all(meetingPromises);
      const bagian4 = await p4;
      const bagian5 = await p5;

      text = bagian1 + "\n\n" + meetings.join("\n\n") + "\n\n" + bagian4 + "\n\n" + bagian5;
    } else {
      const prompt = buildPrompt(tipe, params || {});
      text = await generateWithRetry(prompt, clientKey);
    }

    const kuotaSisa = Math.max(0, user.kuotaMaks - user.kuotaTerpakai);

    res.json({ hasil: text, kuotaSisa, kuotaMaks: user.kuotaMaks });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.";
    // Clean up raw JSON error messages from Gemini SDK
    let message = raw;
    try {
      const jsonMatch = raw.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: string } };
        if (parsed?.error?.message) message = parsed.error.message;
      }
    } catch { /* keep raw */ }

    if (message.toLowerCase().includes("api key not valid") || message.toLowerCase().includes("invalid api key")) {
      const currentKey = clientKey || process.env.GEMINI_API_KEY || "";
      message = "API Key tidak valid. Jika Anda memakai API Key pribadi, pastikan pengisiannya sudah benar di menu Pengaturan. Key yang digunakan saat ini berawalan: " + currentKey.substring(0, 5) + "...";
    } else if (message.includes("quota") || message.includes("429")) {
      message = "Limit AI pada API Key ini sudah habis. Silakan buat API Key baru.";
    } else if (message.includes("Gemini sedang penuh")) {
      // Keep the local retry error
    }

    res.status(500).json({ error: message });
  }
});

// GET /api/ai/status
router.get("/status", (_req, res) => {
  res.json({
    ready: !!process.env.GEMINI_API_KEY,
    models: MODELS,
    debug_key: (process.env.GEMINI_API_KEY || "").substring(0, 10),
    next_public: (process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").substring(0, 10),
    env_keys: Object.keys(process.env).join(", "),
    cwd: process.cwd()
  });
});

// POST /api/ai/parse-cptp
router.post("/parse-cptp", async (req, res) => {
  try {
    const { data, mimeType, clientKey, textContent } = req.body as { data?: string, mimeType?: string, clientKey?: string, textContent?: string };
    
    if (!data && !textContent) {
      res.status(400).json({ error: "Tidak ada data yang dikirim." });
      return;
    }

    const prompt = `Kamu adalah sistem AI ekstraksi data (ETL). Tugasmu adalah mengekstrak data RPP / Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) dari dokumen terlampir.
Ekstrak setiap baris dengan teliti. Jika ada CP namun beberapa TP (1 CP memiliki banyak TP), buat baris terpisah untuk masing-masing TP dengan CP yang sama (diulang) pada tiap baris. Hal yang sama berlaku jika ada banyak sub-materi.
    
Wajib kembalikan format JSON Array mentah TANPA BLOK KODE (tanpa \`\`\`json).
Setiap objek dalam array WAJIB memiliki properti berikut dengan key huruf kecil persis seperti ini:
[
  {
    "fase": "Contoh: A, B, C (jika ada, kalau tidak ada kosongi)",
    "kelas": "Contoh: 1, 2, 3 (jika ada, kalau tidak ada kosongi)",
    "semester": "Contoh: Ganjil / Genap (jika ada, kalau tidak ada kosongi)",
    "elemen": "Contoh: Fiqih, Aqidah (jika ada, kalau tidak ada kosongi)",
    "cp": "Isi Capaian Pembelajaran",
    "tp": "Isi Tujuan Pembelajaran (wajib diisi jika ada, 1 baris per TP)",
    "materi": "Materi/BAB/Topik (jika ada, kalau tidak ada kosongi)",
    "subMateri": "Sub Materi/Sub BAB/Sub Topik (jika ada, kalau tidak ada kosongi)"
  }
]
HANYA OUTPUTKAN RAW JSON ARRAY KARENA AKAN LANGSUNG DI-PARSE (JSON.parse).`;

    let aiContent: any[] = [{ text: prompt }];

    if (textContent) {
      aiContent.push({ text: `\n\n=== ISI DOKUMEN ===\n${textContent}\n===================` });
    } else if (data && mimeType) {
      aiContent.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    let lastError: Error | null = null;
    let resultText = "";

    // generateWithRetry doesn't support array part inputs easily as currently written, 
    // we'll loop over models manually here:
    for (const model of MODELS) {
      try {
        const response = await getGenAI(clientKey).models.generateContent({
          model,
          contents: aiContent,
          config: {
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fase: { type: "string" },
                  kelas: { type: "string" },
                  semester: { type: "string" },
                  elemen: { type: "string" },
                  cp: { type: "string" },
                  tp: { type: "string" },
                  materi: { type: "string" },
                  subMateri: { type: "string" }
                }
              }
            }
          },
        });
        resultText = response.text ?? "";
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!resultText) {
      throw lastError || new Error("Gagal mengekstrak data dari AI.");
    }

    // Clean up potential markdown formatting
    let cleanJson = resultText.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    cleanJson = cleanJson.trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.warn("JSON parse failed, attempting repair with jsonrepair...");
      try {
        const { jsonrepair } = await import('jsonrepair');
        const repairedJson = jsonrepair(cleanJson);
        parsedData = JSON.parse(repairedJson);
      } catch (repairError) {
        console.error("Failed to repair JSON:", cleanJson.substring(cleanJson.length - 100));
        throw new Error("Gagal memproses data. Data dari dokumen terlalu besar dan terpotong oleh AI. Mohon pisahkan isi dokumen (misal: per Fase atau per Kelas) lalu unggah kembali secara bergantian.");
      }
    }

    if (!Array.isArray(parsedData)) {
      throw new Error("AI tidak mengembalikan format Array.");
    }

    res.json({ data: parsedData });
  } catch (err: any) {
    console.error("AI Parse Error:", err);
    res.status(500).json({ error: err.message || "Terjadi kesalahan saat memproses data." });
  }
});

export { router as aiRouter };
