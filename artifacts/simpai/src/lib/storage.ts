import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef<T>(initialValue);
  
  // Keep the ref updated in case initialValue actually changes
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prevValue) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // dispatch storage event for syncing across tabs/hooks
            window.dispatchEvent(new Event("local-storage"));
          }
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValueRef.current);
      } catch (error) {
        // use fallback if error
      }
    };

    window.addEventListener("local-storage", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    
    // Initial fetch to be safe
    handleUpdate();

    return () => {
      window.removeEventListener("local-storage", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [key]);

  return [storedValue, setValue] as [T, (value: T | ((val: T) => T)) => void];
}

// Pre-defined hooks for our specific keys
export const getActiveKelasList = (profil: any): string[] => {
  if (profil?.selectedRombels && profil.selectedRombels.trim()) {
    return profil.selectedRombels.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  const namaSekolah = profil?.namaSekolah || "";
  const norm = namaSekolah.toUpperCase();
  if (norm.includes("SMP") || norm.includes("MTS") || norm.includes("MENENGAH PERTAMA")) {
    return ["7", "8", "9"];
  } else if (norm.includes("SMA") || norm.includes("SMK") || norm.includes("MA") || norm.includes("MENENGAH ATAS")) {
    return ["10", "11", "12"];
  }
  return ["1", "2", "3", "4", "5", "6"];
};

export const useSimpaiProfil = () => useLocalStorage("simpai_profil", {
  namaGuru: "", 
  namaSekolah: "", 
  npsn: "", 
  alamat: "", 
  semester: "Ganjil", 
  tahunPelajaran: "2025/2026", 
  namaKS: "", 
  nipKS: "", 
  nipGuru: "", 
  golongan: "", 
  tempatPengesahan: "", 
  fotoBase64: "", 
  logoSekolahBase64: "",
  jumlahRombel: "",
  selectedRombels: ""
});

export const useSimpaiJadwal = () => useLocalStorage("simpai_jadwal", {});
export const useSimpaiSiswa = () => useLocalStorage("simpai_siswa", {});
export const useSimpaiPemetaan = () => useLocalStorage("simpai_pemetaan", {});
export const useSimpaiPromes = () => useLocalStorage("simpai_promes", {});
export const useSimpaiArsip = () => useLocalStorage<any[]>("simpai_arsip", []);
export const useSimpaiTema = () => useLocalStorage("simpai_tema", "hijau");

export interface KaldikPekan {
  bulan: string;
  pekanKe: number;
  status: "Efektif" | "Tidak Efektif";
  keterangan: string;
}

export interface KaldikSemester {
  tahunPelajaran: string;
  semester: "Ganjil" | "Genap";
  pekanList: KaldikPekan[];
}

const generateDefaultPekan = (semester: "Ganjil" | "Genap"): KaldikPekan[] => {
  const bulanList = semester === "Ganjil" 
    ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
  
  const pekanList: KaldikPekan[] = [];
  for (const b of bulanList) {
    for (let p = 1; p <= 5; p++) {
      let status: "Efektif" | "Tidak Efektif" = "Efektif";
      let keterangan = "KBM Efektif";
      
      if (semester === "Ganjil") {
        if (b === "Juli" && (p === 1 || p === 2 || p === 3)) {
          status = "Tidak Efektif";
          keterangan = "Libur Akhir Tahun / MPLS / Pekan Non-Efektif";
        } else if (b === "September" && p === 4) {
          status = "Tidak Efektif";
          keterangan = "Penilaian Tengah Semester (PTS)";
        } else if (b === "Desember" && (p === 3 || p === 4 || p === 5)) {
          status = "Tidak Efektif";
          keterangan = p === 3 ? "Asesmen Akhir Semester" : p === 4 ? "Pembagian Rapor" : "Libur Semester 1";
        }
      } else {
        if (b === "Januari" && p === 1) {
          status = "Tidak Efektif";
          keterangan = "Libur Tahun Baru / Semester 1";
        } else if (b === "Maret" && p === 4) {
          status = "Tidak Efektif";
          keterangan = "Penilaian Tengah Semester (PTS)";
        } else if (b === "Juni" && (p === 3 || p === 4 || p === 5)) {
          status = "Tidak Efektif";
          keterangan = p === 3 ? "Asesmen Akhir Tahun" : p === 4 ? "Pembagian Rapor" : "Libur Akhir Tahun Ajaran";
        }
      }
      
      pekanList.push({ bulan: b, pekanKe: p, status, keterangan });
    }
  }
  return pekanList;
};

const defaultMasterKaldik: KaldikSemester[] = [
  { tahunPelajaran: "2025/2026", semester: "Ganjil", pekanList: generateDefaultPekan("Ganjil") },
  { tahunPelajaran: "2025/2026", semester: "Genap", pekanList: generateDefaultPekan("Genap") },
  { tahunPelajaran: "2026/2027", semester: "Ganjil", pekanList: generateDefaultPekan("Ganjil") },
  { tahunPelajaran: "2026/2027", semester: "Genap", pekanList: generateDefaultPekan("Genap") },
  { tahunPelajaran: "2027/2028", semester: "Ganjil", pekanList: generateDefaultPekan("Ganjil") },
  { tahunPelajaran: "2027/2028", semester: "Genap", pekanList: generateDefaultPekan("Genap") },
  { tahunPelajaran: "2028/2029", semester: "Ganjil", pekanList: generateDefaultPekan("Ganjil") },
  { tahunPelajaran: "2028/2029", semester: "Genap", pekanList: generateDefaultPekan("Genap") },
];

export const useSimpaiMasterKaldik = () => useLocalStorage<KaldikSemester[]>("simpai_master_kaldik", defaultMasterKaldik);

export const useSimpaiKalender = () => useLocalStorage<any[]>("simpai_kalender", [
  { id: "1", tanggal: "2026-06-15", judul: "Penilaian Akhir Semester Ganjil", tipe: "umum" },
  { id: "2", tanggal: "2026-06-25", judul: "Pembagian Rapor Semester", tipe: "umum" },
  { id: "3", tanggal: "2026-06-29", judul: "Libur Akhir Tahun Ajaran", tipe: "libur" },
  { id: "4", tanggal: "2026-07-13", judul: "Hari Pertama Masuk Sekolah", tipe: "umum" },
  { id: "5", tanggal: "2026-06-10", judul: "Ulangan Harian Akidah Akhlak", tipe: "ulangan" },
  { id: "6", tanggal: "2026-06-18", judul: "Pengumpulan Tugas LKPD", tipe: "tugas" },
]);
