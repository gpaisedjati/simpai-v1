import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/design-system/components/GlassCard";
import { ArrowLeft, CalendarDays, ChevronRight, CheckCircle2, FileText, Download, Sparkles, Hourglass, Save } from "lucide-react";
import { useSimpaiMasterKaldik, useSimpaiPromes } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

type PromesWizardProps = {
  onBack: () => void;
  profil: any;
  pemetaan: any;
  fase: string;
  semester: string;
  onExport: (html: string) => void;
  activeKelasList: string[];
  ELEMEN: readonly string[] | string[];
  ELEMEN_LABEL: Record<string, string>;
};

export default function PromesWizard({
  onBack,
  profil,
  pemetaan,
  fase,
  semester,
  onExport,
  activeKelasList,
  ELEMEN,
  ELEMEN_LABEL
}: PromesWizardProps) {
  const [kelasPromes, setKelasPromes] = useState(activeKelasList[0] || "1");
  const [jtmSetting, setJtmSetting] = useState(3);
  const [masterKaldik] = useSimpaiMasterKaldik();
  const [serverKaldik, setServerKaldik] = useState<any[]>([]);
  const [promesStore, setPromesStore] = useSimpaiPromes();
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/kaldik")
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setServerKaldik(data.data);
        }
      })
      .catch(e => console.error("Failed to load Kaldik from server", e));
  }, []);

  const getFaseForKelas = (kls: string) => {
    const n = parseInt(kls.replace(/[^0-9]/g, "")) || 1;
    if (n === 1 || n === 2) return "A";
    if (n === 3 || n === 4) return "B";
    if (n === 5 || n === 6) return "C";
    if (n === 7 || n === 8 || n === 9) return "D";
    if (n === 10) return "E";
    if (n === 11 || n === 12) return "F";
    return "A";
  };

  const currentFaseCode = getFaseForKelas(kelasPromes);
  const promesStoreKey = `${currentFaseCode}-${kelasPromes}_${semester}`;

  // Step 3 States per class (Promes Matrix)
  // matriksDistributions[kelas][atpId][`${bln}_${pekan}`] = number
  const [matriksDistributions, setMatriksDistributions] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const matriksDistribution = matriksDistributions[kelasPromes] || {};

  // Step 2 Target JP budgets (Prota equivalent) per class
  const [jpDistributions, setJpDistributions] = useState<Record<string, Record<string, number>>>({});
  const jpDistribution = jpDistributions[kelasPromes] || {};

  useEffect(() => {
    const store = promesStore as Record<string, any>;
    const data = store[promesStoreKey];
    if (data) {
      setJpDistributions(prev => ({ ...prev, [kelasPromes]: data.jp || {} }));
      setMatriksDistributions(prev => ({ ...prev, [kelasPromes]: data.matriks || {} }));
      setJtmSetting(data.jtm || 3);
    } else {
      setJpDistributions(prev => ({ ...prev, [kelasPromes]: {} }));
      setMatriksDistributions(prev => ({ ...prev, [kelasPromes]: {} }));
      setJtmSetting(3);
    }
  }, [promesStoreKey, kelasPromes]);

  const handleJpDistributionChange = (atpId: string, value: number) => {
    setJpDistributions(prev => ({
      ...prev,
      [kelasPromes]: {
        ...(prev[kelasPromes] || {}),
        [atpId]: value
      }
    }));
  };

  const handleMatriksDistributionChange = (atpId: string, cellKey: string, value: number) => {
    setMatriksDistributions(prev => ({
      ...prev,
      [kelasPromes]: {
        ...(prev[kelasPromes] || {}),
        [atpId]: {
          ...((prev[kelasPromes] || {})[atpId] || {}),
          [cellKey]: value
        }
      }
    }));
  };

  // Transform real kaldik data to UI structure
  const weeksData = useMemo(() => {
    const tp = profil.tahunPelajaran || "2026/2027";
    const sourceData = serverKaldik.length > 0 ? serverKaldik : masterKaldik;
    const record = sourceData.find(k => k.tahunPelajaran === tp && k.semester === semester);
    
    // Robust realistic generator fallback if no data yet (e.g. admin hasn't generated or year is missing)
    if (!record || record.pekanList.length === 0) {
      const isGanjil = semester === "Ganjil";
      const blns = isGanjil 
        ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"] 
        : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
      
      return blns.map(b => {
        const pekan = [1, 2, 3, 4, 5];
        const libur: number[] = [];
        if (isGanjil) {
          if (b === "Juli") {
            libur.push(1, 2, 3);
          } else if (b === "September") {
            libur.push(4);
          } else if (b === "Desember") {
            libur.push(3, 4, 5);
          }
        } else {
          if (b === "Januari") {
            libur.push(1);
          } else if (b === "Maret") {
            libur.push(4);
          } else if (b === "Juni") {
            libur.push(3, 4, 5);
          }
        }
        return { bln: b, pekan, libur };
      });
    }

    const grouped: Record<string, { bln: string; pekan: number[]; libur: number[] }> = {};
    
    record.pekanList.forEach((p: any) => {
      if (!grouped[p.bulan]) {
        grouped[p.bulan] = { bln: p.bulan, pekan: [], libur: [] };
      }
      grouped[p.bulan].pekan.push(p.pekanKe);
      if (p.status === "Tidak Efektif") {
        grouped[p.bulan].libur.push(p.pekanKe);
      }
    });

    return Object.values(grouped);
  }, [masterKaldik, serverKaldik, profil.tahunPelajaran, semester]);
  
  const effectiveWeeksCount = useMemo(() => {
    let count = 0;
    weeksData.forEach(w => {
      count += (w.pekan.length - w.libur.length);
    });
    return count;
  }, [weeksData]);

  const totalJpAvailable = effectiveWeeksCount * jtmSetting;

  // Extract ATPs from Pemetaan based on selected class
  const pemetaanKey = `${currentFaseCode}-${kelasPromes}_${semester}`;
  const localPemetaan = pemetaan[pemetaanKey] || {};

  const atpList = useMemo(() => {
    let list: { id: string; elm: string; text: string; isAsesmen?: boolean }[] = [];
    ELEMEN.forEach(elm => {
      const text = localPemetaan[`atp_${elm}`];
      if (text) {
        // Split text by newlines and filter empty
        const lines = text.split('\n').filter((l: string) => l.trim() !== "");
        if (lines.length > 0) {
          lines.forEach((line: string, i: number) => {
            list.push({ id: `${elm}_${i}`, elm, text: line.trim() });
          });
          // Add Summatif Assessment for the element
          list.push({ id: `${elm}_asesmen`, elm, text: `Asesmen Sumatif Elemen: ${ELEMEN_LABEL[elm] || elm}`, isAsesmen: true });
        }
      }
    });
    
    return list;
  }, [localPemetaan, ELEMEN]);

  // Sum of matrix allocations per ATP
  const matriksSums = useMemo(() => {
    const sums: Record<string, number> = {};
    atpList.forEach(atp => {
      const cellValues = matriksDistribution[atp.id] || {};
      const total = Object.values(cellValues).reduce((sum, val) => sum + (Number(val) || 0), 0);
      sums[atp.id] = total;
    });
    return sums;
  }, [atpList, matriksDistribution]);

  const totalTargetJp = useMemo(() => {
    return atpList.reduce((sum, atp) => sum + (Number(jpDistribution[atp.id]) || 0), 0);
  }, [atpList, jpDistribution]);

  const totalMatriksJp = useMemo(() => {
    return Object.values(matriksSums).reduce((sum, val) => sum + val, 0);
  }, [matriksSums]);

  const sisaTargetJp = totalJpAvailable - totalTargetJp;
  const sisaMatriksJp = totalJpAvailable - totalMatriksJp;

  const [isAiDistributingJp, setIsAiDistributingJp] = useState(false);
  const [isAiDistributingMatriks, setIsAiDistributingMatriks] = useState(false);

  // AI 1: Auto distribute Target JP (Prota equivalent)
  const handleAiDistributeJp = () => {
    if (atpList.length === 0 || totalJpAvailable <= 0) return;
    setIsAiDistributingJp(true);
    
    setTimeout(() => {
      const jtmPerWeek = Number(jtmSetting) || 3;
      const dist: Record<string, number> = {};
      
      const elementGroups: Record<string, typeof atpList> = {};
      const elements: string[] = [];
      atpList.forEach(atp => {
        if (!elementGroups[atp.elm]) {
          elementGroups[atp.elm] = [];
          elements.push(atp.elm);
        }
        elementGroups[atp.elm].push(atp);
      });

      const totalMeetings = Math.floor(totalJpAvailable / jtmPerWeek);
      const remainingJpTotal = totalJpAvailable % jtmPerWeek;
      
      const numElements = elements.length;
      const baseMeetingsPerElement = Math.floor(totalMeetings / numElements);
      let extraMeetings = totalMeetings % numElements;

      const elementBudget: Record<string, number> = {};
      elements.forEach(elm => {
        let meetings = baseMeetingsPerElement;
        if (extraMeetings > 0) {
          meetings++;
          extraMeetings--;
        }
        elementBudget[elm] = meetings * jtmPerWeek;
      });
      if (elements.length > 0) {
        elementBudget[elements[0]] += remainingJpTotal;
      }

      elements.forEach(elm => {
        const atps = elementGroups[elm];
        let remainingBudget = elementBudget[elm];

        const asesmenAtp = atps.find(a => a.isAsesmen);
        if (asesmenAtp) {
          const minRequiredForNormal = atps.length - 1;
          if (remainingBudget - jtmPerWeek >= minRequiredForNormal) {
            dist[asesmenAtp.id] = jtmPerWeek;
            remainingBudget -= jtmPerWeek;
          } else {
            const alloc = Math.max(1, remainingBudget - minRequiredForNormal);
            dist[asesmenAtp.id] = alloc;
            remainingBudget -= alloc;
          }
        }

        const normalAtps = atps.filter(a => !a.isAsesmen);
        let currentBlockSize = 0;

        normalAtps.forEach((atp, idx) => {
          const remainingAtps = normalAtps.length - idx;
          const text = atp.text.toLowerCase();

          const isLight = /mengingat|memahami|menyebutkan|mengidentifikasi|menjelaskan secara singkat/.test(text);
          const isHeavy = /menganalisis|mempraktikkan|mendemonstrasikan|mengevaluasi|mencipta/.test(text);

          let allocated = 0;

          if (remainingAtps === 1) {
            allocated = remainingBudget;
          } else if (currentBlockSize > 0) {
            const need = jtmPerWeek - currentBlockSize;
            if (remainingBudget - need >= remainingAtps - 1) {
              allocated = need;
            } else {
              allocated = 1;
            }
          } else {
            let want = jtmPerWeek;
            if (isLight) {
              want = Math.max(1, Math.floor(jtmPerWeek / 2)); 
            } else if (isHeavy) {
              const maxWeeks = Math.floor(remainingBudget / jtmPerWeek) - remainingAtps;
              want = maxWeeks >= 2 ? jtmPerWeek * 2 : jtmPerWeek;
            }

            if (want % jtmPerWeek !== 0) {
              if (remainingBudget - jtmPerWeek < remainingAtps - 2) {
                want = jtmPerWeek; 
              }
            }

            while (want > 0 && remainingBudget - want < remainingAtps - 1) {
              want -= (want > jtmPerWeek ? jtmPerWeek : 1);
            }
            if (want <= 0) want = 1;

            allocated = want;
          }

          dist[atp.id] = allocated;
          remainingBudget -= allocated;
          currentBlockSize = (currentBlockSize + allocated) % jtmPerWeek;
        });
      });

      setJpDistributions(prev => ({
        ...prev,
        [kelasPromes]: dist
      }));
      setIsAiDistributingJp(false);
      toast({
        title: "AI Auto Distribusi JP Berhasil",
        description: "Target Alokasi JP (Prota) telah berhasil didistribusikan ke tiap ATP.",
      });
    }, 1000);
  };

  // AI 2: Auto distribute JP from target budgets into weekly Matrix cells
  const handleAiDistributePromes = () => {
    if (atpList.length === 0 || totalJpAvailable <= 0) return;
    setIsAiDistributingMatriks(true);
    
    setTimeout(() => {
      const jtmPerWeek = Number(jtmSetting) || 3;
      const currentTargetJp = jpDistribution;

      const matrix: Record<string, Record<string, number>> = {};
      const effectiveWeeks: {bln: string, pkn: number}[] = [];
      weeksData.forEach(m => {
        m.pekan.forEach(p => {
          if (!m.libur.includes(p)) {
            effectiveWeeks.push({bln: m.bln, pkn: p});
          }
        });
      });

      let currentWeekIdx = 0;
      let currentJpInWeek = 0;

      atpList.forEach(atp => {
        let jpToAllocate = currentTargetJp[atp.id] || 0;
        matrix[atp.id] = {};

        while (jpToAllocate > 0 && currentWeekIdx < effectiveWeeks.length) {
          const week = effectiveWeeks[currentWeekIdx];
          const cellKey = `${week.bln}_${week.pkn}`;
          const availableInWeek = jtmPerWeek - currentJpInWeek;

          if (availableInWeek <= 0) {
            currentWeekIdx++;
            currentJpInWeek = 0;
            continue;
          }

          const toAllocateHere = Math.min(jpToAllocate, availableInWeek);
          matrix[atp.id][cellKey] = toAllocateHere;
          jpToAllocate -= toAllocateHere;
          currentJpInWeek += toAllocateHere;

          if (currentJpInWeek >= jtmPerWeek) {
            currentWeekIdx++;
            currentJpInWeek = 0;
          }
        }
      });

      setMatriksDistributions(prev => ({
        ...prev,
        [kelasPromes]: matrix
      }));
      setIsAiDistributingMatriks(false);
      toast({
        title: "AI Auto Distribusi Matriks Berhasil",
        description: "Matriks mingguan (Promes) telah otomatis diselaraskan dengan Target JP.",
      });
    }, 1000);
  };

  const groupedAtpList = useMemo(() => {
    const grouped: Record<string, typeof atpList> = {};
    atpList.forEach(atp => {
      if(!grouped[atp.elm]) grouped[atp.elm] = [];
      grouped[atp.elm].push(atp);
    });
    return grouped;
  }, [atpList]);

  const generateHtml = () => {
    let protaRows = "";
    let promesRows = "";
    
    let no = 1;
    Object.entries(groupedAtpList).forEach(([elm, atps]) => {
      protaRows += `
        <tr>
          <td colspan="3" style="border: 1px solid black; padding: 8px; background-color: #f3f4f6; font-weight: bold; text-align: center;">Elemen: ${ELEMEN_LABEL[elm] || elm}</td>
        </tr>
      `;
      promesRows += `
        <tr>
          <td colspan="${2 + effectiveWeeksCount}" style="border: 1px solid black; padding: 6px; background-color: #f3f4f6; font-weight: bold; text-align: center;">Elemen: ${ELEMEN_LABEL[elm] || elm}</td>
        </tr>
      `;
      
      atps.forEach(atp => {
        const bgStyle = atp.isAsesmen ? 'background-color: #f0f8ff;' : '';
        const textStyle = atp.isAsesmen ? 'font-weight: bold; color: #1e3a8a;' : '';
        protaRows += `
          <tr style="${bgStyle}">
            <td style="border: 1px solid black; padding: 8px; text-align: center;">${no++}</td>
            <td style="border: 1px solid black; padding: 8px; ${textStyle}">${atp.text}</td>
            <td style="border: 1px solid black; padding: 8px; text-align: center; ${textStyle}">${jpDistribution[atp.id] || 0}</td>
          </tr>
        `;
        
        promesRows += `
          <tr style="${bgStyle}">
            <td style="border: 1px solid black; padding: 6px; text-align: left; ${textStyle}">${atp.text}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; ${textStyle}">${jpDistribution[atp.id] || 0}</td>
            ${weeksData.map(m => 
              m.pekan.map(p => {
                const isLibur = m.libur.includes(p);
                const val = (matriksDistribution[atp.id] || {})[`${m.bln}_${p}`] || "";
                return `<td style="border: 1px solid black; padding: 4px; text-align: center; ${isLibur ? 'background-color: #e0e0e0;' : ''}">${val}</td>`;
              }).join("")
            ).join("")}
          </tr>
        `;
      });
    });

    let protaHtml = `
      <h3 style="text-align: center; margin-top: 20px;">PROGRAM TAHUNAN (PROTA)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11pt;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px; width: 5%;">No</th>
            <th style="border: 1px solid black; padding: 8px; width: 80%;">Alur Tujuan Pembelajaran (ATP)</th>
            <th style="border: 1px solid black; padding: 8px; width: 15%;">JP</th>
          </tr>
        </thead>
        <tbody>
          ${protaRows}
        </tbody>
      </table>
    `;

    let promesHtml = `
      <h3 style="text-align: center; margin-top: 30px;">PROGRAM SEMESTER (PROMES)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; text-align: center;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 6px; width: 30%; text-align: left;" rowspan="2">Alur Tujuan Pembelajaran</th>
            <th style="border: 1px solid black; padding: 6px; width: 5%;" rowspan="2">JP</th>
            ${weeksData.map(m => `<th style="border: 1px solid black; padding: 6px;" colspan="${m.pekan.length}">${m.bln}</th>`).join("")}
          </tr>
          <tr>
            ${weeksData.map(m => 
              m.pekan.map(p => {
                const isLibur = m.libur.includes(p);
                return `<th style="border: 1px solid black; padding: 4px; ${isLibur ? 'background-color: #e0e0e0;' : ''}">${p}</th>`;
              }).join("")
            ).join("")}
          </tr>
        </thead>
        <tbody>
          ${promesRows}
        </tbody>
      </table>
    `;

    return protaHtml + promesHtml;
  };

  const handleExport = () => {
    onExport(generateHtml());
  };

  const simpanPromes = () => {
    setPromesStore((prev: any) => ({
      ...prev,
      [promesStoreKey]: {
        jp: jpDistribution,
        matriks: matriksDistributions[kelasPromes] || {},
        jtm: jtmSetting
      }
    }));
    toast({ title: "Tersimpan", description: `Data Prota & Promes Kelas ${kelasPromes} berhasil disimpan.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack} 
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
              <span className="text-xs text-[#D4AF37] font-bold">{semester}</span>
           </div>
        </div>
      </div>

      <GlassCard className="p-6 border-[#D4AF37]/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
            Penyusunan Prota & Promes
          </h3>
          <p className="text-xs text-white/60 mt-0.5">Isi alokasi JP per pekan langsung pada matriks di bawah. JTM Prota akan dihitung otomatis.</p>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
          <div className="space-y-2">
            <Label className="text-white font-semibold text-xs">Pilih Kelas</Label>
            <Select value={kelasPromes} onValueChange={setKelasPromes}>
              <SelectTrigger className="w-full bg-white border-[#D4AF37]/40 text-black focus:border-[#D4AF37] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#D4AF37]/40 text-black font-semibold">
                {activeKelasList.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white font-semibold text-xs">JTM PAI per Minggu (JP)</Label>
            <Input 
              type="number" 
              value={jtmSetting} 
              onChange={(e) => setJtmSetting(Number(e.target.value) || 0)} 
              className="w-full bg-white border-[#D4AF37]/40 text-black font-bold" 
              min="1" 
            />
          </div>
        </div>

        {/* Real-time Statistics Card */}
        <div className={`sticky top-0 z-10 p-4 rounded-xl border flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between backdrop-blur-md ${(sisaTargetJp === 0 && sisaMatriksJp === 0) ? 'bg-green-500/10 border-green-500/20' : (sisaTargetJp < 0 || sisaMatriksJp < 0) ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto items-center">
            <div>
              <div className="text-[10px] text-white/50 uppercase font-bold mb-0.5">Minggu Efektif</div>
              <div className="text-xl font-extrabold text-white">{effectiveWeeksCount} <span className="text-xs font-normal text-white/60">Minggu</span></div>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10"></div>
            <div>
              <div className="text-[10px] text-white/50 uppercase font-bold mb-0.5">Total Tersedia</div>
              <div className="text-xl font-extrabold text-[#D4AF37]">{totalJpAvailable} <span className="text-xs font-normal text-[#D4AF37]/70">JP</span></div>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10"></div>
            <div>
              <div className="text-[10px] text-white/50 uppercase font-bold mb-0.5">Sisa Target JP</div>
              <div className={`text-xl font-extrabold ${sisaTargetJp === 0 ? 'text-green-400' : sisaTargetJp < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {sisaTargetJp} <span className="text-xs font-normal">JP</span>
              </div>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10"></div>
            <div>
              <div className="text-[10px] text-white/50 uppercase font-bold mb-0.5">Sisa Matriks JP</div>
              <div className={`text-xl font-extrabold ${sisaMatriksJp === 0 ? 'text-green-400' : sisaMatriksJp < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {sisaMatriksJp} <span className="text-xs font-normal">JP</span>
              </div>
            </div>
          </div>
          
          {atpList.length > 0 && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
              <Button 
                onClick={handleAiDistributeJp} 
                disabled={isAiDistributingJp || isAiDistributingMatriks}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold whitespace-nowrap w-full sm:w-auto text-xs"
                size="sm"
              >
                {isAiDistributingJp ? (
                  <>
                    <Hourglass className="w-4 h-4 mr-1.5 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-purple-200 animate-pulse" /> Auto Distribusi Target JP
                  </>
                )}
              </Button>
              <Button 
                onClick={handleAiDistributePromes} 
                disabled={isAiDistributingJp || isAiDistributingMatriks}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold whitespace-nowrap w-full sm:w-auto text-xs"
                size="sm"
              >
                {isAiDistributingMatriks ? (
                  <>
                    <Hourglass className="w-4 h-4 mr-1.5 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-indigo-200 animate-pulse" /> Auto Distribusi Matriks
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {atpList.length === 0 ? (
          <div className="text-center p-8 text-white/50 text-sm">
            Belum ada data ATP untuk Kelas {kelasPromes} di Pemetaan Kurikulum. Silakan simpan ATP di menu Pemetaan Kurikulum terlebih dahulu.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 p-4 rounded-xl overflow-x-auto shadow-md">
              <table className="w-full text-left text-xs min-w-[800px] border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border border-gray-300 text-gray-700 w-96 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Alur Tujuan Pembelajaran</th>
                    <th className="p-2 border border-gray-300 text-gray-700 text-center w-32 bg-gray-50">
                       <div className="font-bold">Target / Terisi</div>
                       <div className="text-[9px] font-normal text-gray-500">(Editable / Otomatis)</div>
                    </th>
                    {weeksData.map(m => (
                      <th key={m.bln} colSpan={m.pekan.length} className="p-2 border border-gray-300 text-center text-blue-800 font-extrabold bg-gray-100">
                        {m.bln}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-2 border border-gray-300 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></th>
                    <th className="p-2 border border-gray-300 bg-gray-50"></th>
                    {weeksData.map(m => (
                      m.pekan.map(p => {
                        const disabled = m.libur.includes(p);
                        return (
                          <th key={`${m.bln}_${p}`} className={`p-1.5 border border-gray-300 text-center font-bold ${disabled ? 'text-red-500 bg-red-50' : 'text-gray-800 bg-gray-50'}`}>
                            {p}
                          </th>
                        );
                      })
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedAtpList).map(([elm, atps]) => (
                    <React.Fragment key={elm}>
                      <tr>
                        <td colSpan={2 + effectiveWeeksCount} className="p-2 border border-gray-300 bg-blue-50 font-extrabold text-blue-900 uppercase text-xs text-center">
                          Elemen: {ELEMEN_LABEL[elm] || elm}
                        </td>
                      </tr>
                      {atps.map(atp => {
                        const targetAllocated = jpDistribution[atp.id] || 0;
                        const totalAllocatedOnMatrix = matriksSums[atp.id] || 0;
                        const isMatched = targetAllocated === totalAllocatedOnMatrix;

                        return (
                          <tr key={atp.id} className="hover:bg-gray-50">
                            <td className={`p-2 border border-gray-300 font-medium sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)] pl-4 ${atp.isAsesmen ? 'bg-blue-50 text-blue-800' : 'bg-white text-gray-800'}`}>
                              <div className={`line-clamp-2 text-[10px] ${atp.isAsesmen ? 'font-bold' : ''}`} title={atp.text}>{atp.text}</div>
                            </td>
                            <td className="p-2 border border-gray-300 bg-white text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={targetAllocated === 0 ? '' : targetAllocated}
                                  onChange={(e) => {
                                    const num = parseInt(e.target.value, 10);
                                    handleJpDistributionChange(atp.id, isNaN(num) ? 0 : num);
                                  }}
                                  className="w-10 h-7 bg-white text-black text-center font-extrabold border border-gray-300 rounded focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                  placeholder="0"
                                />
                                <span className="text-gray-400 font-bold">/</span>
                                <span className={`text-sm font-extrabold ${isMatched ? 'text-green-600' : 'text-amber-600'}`}>
                                  {totalAllocatedOnMatrix}
                                </span>
                              </div>
                            </td>
                            {weeksData.map(m => (
                              m.pekan.map(p => {
                                const disabled = m.libur.includes(p);
                                const cellKey = `${m.bln}_${p}`;
                                const val = (matriksDistribution[atp.id] || {})[cellKey] || '';
                                
                                return (
                                  <td key={cellKey} className={`p-1 border border-gray-300 ${disabled ? 'bg-red-50' : 'bg-white'}`}>
                                    <input 
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      disabled={disabled}
                                      value={val === 0 ? '' : val}
                                      onChange={(e) => {
                                        const num = parseInt(e.target.value, 10);
                                        handleMatriksDistributionChange(atp.id, cellKey, isNaN(num) ? 0 : num);
                                      }}
                                      className={`w-full bg-transparent text-center font-bold outline-none ${disabled ? 'opacity-0 cursor-not-allowed' : 'text-blue-700 focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded'}`}
                                    />
                                  </td>
                                );
                              })
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4 mt-6">
              <FileText className="w-12 h-12 text-[#D4AF37] mx-auto opacity-80" />
              <h3 className="text-xl font-bold text-white">Dokumen Prota & Promes Siap</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Penyusunan selesai. Data terdistribusi sesuai dengan kalender akademik aktif.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-md mx-auto mt-6">
                <button 
                  onClick={simpanPromes} 
                  type="button"
                  className="w-full sm:w-1/2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black py-3 px-6 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(212,175,55,0.15)] transition-all transform hover:-translate-y-0.5" 
                >
                  <Save className="w-4 h-4" /> Simpan Data
                </button>
                <button 
                  onClick={handleExport} 
                  type="button"
                  className="w-full sm:w-1/2 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black py-3 px-6 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(34,211,238,0.15)] transition-all transform hover:-translate-y-0.5" 
                >
                  <Download className="w-4 h-4" /> Ekspor Dokumen
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
