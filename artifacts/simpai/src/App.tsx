import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home, Database, BookOpen, ClipboardList, BarChart2, Archive, Settings, Building2, LogOut, Zap, Shield, Calendar, Users, Sparkles, Search, Library } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSimpaiTema, useSimpaiProfil } from "@/lib/storage";
import { apiGetQuota } from "@/lib/api";
import { SessionContext, useSession } from "@/lib/session";
import { formatGuruName } from "@/lib/utils";

import Login from "./pages/Login";
import Beranda from "./pages/Beranda";
import MasterData from "./pages/MasterData";
import Pembelajaran from "./pages/Pembelajaran";
import Asesmen from "./pages/Asesmen";
import Analitik from "./pages/Analitik";
import ArsipDokumen from "./pages/ArsipDokumen";
import Pengaturan from "./pages/Pengaturan";
import AdminPanel from "./pages/AdminPanel";
import Pustaka from "./pages/Pustaka";
import SearchDialog from "./components/SearchDialog";
import NotificationPopover from "./components/NotificationPopover";

const queryClient = new QueryClient();

const SESSION_KEY = "simpai_session";

function Layout({ onLogout }: { onLogout: () => void }) {
  const [activeMenu, setActiveMenu] = useState("beranda");
  const [activeSubMenu, setActiveSubMenu] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tema] = useSimpaiTema();
  const [profil] = useSimpaiProfil();
  const session = useSession();

  React.useEffect(() => {
    document.body.className = `font-sans antialiased text-foreground dark`;
  }, [tema]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Refresh quota periodically
  useEffect(() => {
    session.refreshQuota();
    const id = setInterval(() => session.refreshQuota(), 60_000);
    return () => clearInterval(id);
  }, []);

  const menuItems = [
    { id: "beranda", label: "Beranda", icon: Home },
    { id: "master_data", label: "Master Data", icon: Database },
    { id: "pembelajaran", label: "Pembelajaran", icon: BookOpen },
    { id: "asesmen", label: "Asesmen", icon: ClipboardList },
    { id: "pustaka", label: "Pustaka", icon: Library },
    { id: "analitik", label: "Analitik", icon: BarChart2 },
    { id: "arsip", label: "Arsip Dokumen", icon: Archive },
    ...(session.username === "admin" || session.username === "ridwan" ? [{ id: "admin", label: "Admin Panel", icon: Shield }] : []),
  ];

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
    setActiveSubMenu(undefined);
  };

  const handleSearchNavigate = (menu: string, subMenu?: string) => {
    setActiveMenu(menu);
    setActiveSubMenu(subMenu);
  };

  const kuotaPersen = session.kuotaMaks > 0 ? Math.round((session.kuotaSisa / session.kuotaMaks) * 100) : 0;
  const kuotaColor = kuotaPersen > 30 ? "bg-green-400" : kuotaPersen > 10 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden relative bg-gradient-to-br from-[#031c13] via-[#02140d] to-[#010a06]">
      
      {/* Desktop Global Top Right (Search, Notifications, Profile) */}
      <div className="hidden md:flex absolute top-0 right-0 z-50 p-6 items-center gap-4 pointer-events-none w-full justify-between pl-72">
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="pointer-events-auto flex-1 max-w-md relative cursor-pointer"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#D4AF37]/60" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            readOnly
            className="w-full bg-[#04241a]/65 backdrop-blur-md border border-[#D4AF37]/25 text-white text-sm rounded-full pl-10 pr-12 p-2.5 placeholder-white/40 shadow-sm outline-none cursor-pointer hover:border-[#D4AF37]/50 transition-colors" 
            placeholder="Cari menu, nama siswa, dokumen... (Ctrl+K)" 
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[#D4AF37]/25 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-[#D4AF37]/60">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Notification */}
          <NotificationPopover onNavigate={handleSearchNavigate} align="right" />

          {/* Profile */}
          <div className="flex items-center gap-3 bg-[#04241a]/65 backdrop-blur-md border border-[#D4AF37]/25 pl-2 pr-4 py-1.5 rounded-full shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#D4AF37]/25">
              {profil.fotoBase64 ? (
                <img src={profil.fotoBase64} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#D4AF37]">{session.username.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white truncate leading-tight max-w-[120px]" title={formatGuruName(session.username)}>
                {formatGuruName(session.username)}
              </span>
              <span className="text-[10px] text-white/60 truncate leading-tight">Guru PAI</span>
            </div>
            <button onClick={onLogout} title="Keluar"
              className="ml-1 text-white/50 hover:text-red-400 transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className="w-full md:w-[280px] flex-shrink-0 flex flex-col bg-[#031d14] text-white border-b md:border-b-0 md:border-r border-[#D4AF37]/15 h-auto md:h-full hide-print transition-colors duration-300 relative z-20 md:m-4 md:rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Islamic Ornament Background & Mosque Silhouette */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-10 left-4 w-1 h-1 bg-[#D4AF37] rounded-full opacity-20 blur-[1px]"></div>
          <div className="absolute top-32 right-8 w-2 h-2 bg-[#D4AF37] rounded-full opacity-30 blur-[1px]"></div>
          <div className="absolute top-64 left-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full opacity-15 blur-[1px]"></div>
          <div className="absolute bottom-60 right-12 w-2 h-2 bg-[#D4AF37] rounded-full opacity-20 blur-[2px]"></div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#02140d]/40 to-transparent"></div>
          
          {/* Mosque Silhouette Pattern at the bottom */}
          <div className="absolute bottom-0 w-full h-48 opacity-[0.12] pointer-events-none flex items-end">
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full fill-current text-[#D4AF37]">
              <path d="M0,200 L0,180 L20,180 L20,160 L30,160 L30,140 L35,140 L35,110 L45,110 L45,140 L50,140 L50,160 L60,160 L60,180 L80,180 L80,160 L85,160 L85,120 C85,90 105,70 125,70 C145,70 165,90 165,120 L165,160 L170,160 L170,180 L190,180 L190,140 L195,140 L195,90 C195,50 225,20 255,20 C285,20 315,50 315,90 L315,140 L320,140 L320,180 L350,180 L350,150 L360,150 L360,100 L370,100 L370,150 L380,150 L380,180 L420,180 L420,150 L430,150 L430,100 L440,100 L440,150 L450,150 L450,180 L480,180 L480,140 L485,140 L485,90 C485,50 515,20 545,20 C575,20 605,50 605,90 L605,140 L610,140 L610,180 L630,180 L630,160 L635,160 L635,120 C635,90 655,70 675,70 C695,70 715,90 715,120 L715,160 L720,160 L720,180 L740,180 L740,160 L750,160 L750,140 L755,140 L755,110 L765,110 L765,140 L770,140 L770,160 L780,160 L780,180 L800,180 L800,200 Z" />
            </svg>
          </div>
        </div>

        {/* Mobile Header (Logo + Profile inside Sidebar color) */}
        <div className="flex md:hidden flex-col p-4 border-b border-[#D4AF37]/15 relative z-10 bg-[#031d14] gap-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full p-0.5 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                <img src="/LOGO PUTIH 1.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#D4AF37]">SIMPAI SeDjati</span>
            </div>

            {/* Profile & Quota */}
            <div className="flex items-center gap-2">
              {/* Notification Popover for Mobile */}
              <div className="scale-90 mr-0.5">
                <NotificationPopover onNavigate={handleSearchNavigate} align="left" />
              </div>

              {/* Search Trigger for Mobile */}
              <button 
                onClick={() => setIsSearchOpen(true)} 
                title="Cari" 
                className="p-1.5 text-[#D4AF37] hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center mr-1"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col items-end mr-1">
                <span className="text-[11px] font-semibold leading-tight text-white max-w-[80px] truncate" title={formatGuruName(session.username)}>
                  {formatGuruName(session.username)}
                </span>
                <span className="text-[10px] font-bold text-[#D4AF37]">Guru PAI</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center overflow-hidden border border-[#D4AF37]/25 flex-shrink-0">
                {profil.fotoBase64 ? (
                  <img src={profil.fotoBase64} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#D4AF37]">{session.username.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <button onClick={onLogout} title="Keluar" className="ml-1 text-[#D4AF37]/80 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex flex-col p-6 bg-[#04241a]/40 border-b border-[#D4AF37]/15 relative z-10 gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full p-0.5 flex items-center justify-center shadow-md shadow-[#031c13] overflow-hidden flex-shrink-0">
              <img src="/LOGO PUTIH 1.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-[#D4AF37] leading-none">SIMPAI</span>
              <span className="font-bold text-sm text-[#D4AF37] leading-tight">SeDjati</span>
            </div>
          </div>
          <p className="text-[10px] text-white/60 leading-snug">Sistem Integrasi AI dan Manajemen Pendidikan Agama Islam – Solusi Edukasi Digital Adaptif dan Inovatif</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-x-auto md:overflow-y-auto py-2 md:py-3 px-2 md:px-3 flex flex-row md:flex-col gap-1.5 md:gap-0.5 relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => handleMenuClick(item.id)}
              className={`flex-shrink-0 md:w-full flex items-center justify-between gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-full md:rounded-md text-[11px] md:text-sm font-semibold transition-all duration-150
                ${activeMenu === item.id
                  ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 shadow-sm"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              data-testid={`nav-${item.id}`}>
              <div className="flex items-center gap-2 md:gap-3">
                <item.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              <svg className={`w-3 h-3 hidden md:block transition-colors ${activeMenu === item.id ? "text-[#D4AF37]" : "text-white/30"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          ))}
          
          {/* Mobile-only Pengaturan Button */}
          <button onClick={() => handleMenuClick("pengaturan")}
            className={`md:hidden flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 rounded-full text-[11px] font-semibold transition-all duration-150
              ${activeMenu === "pengaturan"
                ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            data-testid="nav-pengaturan-mobile">
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Pengaturan</span>
            </div>
          </button>
        </nav>

        <div className="hidden md:flex flex-col p-4 border-t border-[#D4AF37]/15 relative z-10">
          <button onClick={() => handleMenuClick("pengaturan")}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-150
              ${activeMenu === "pengaturan"
                ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            data-testid="nav-pengaturan">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </div>
            <svg className={`w-3 h-3 transition-colors ${activeMenu === "pengaturan" ? "text-[#D4AF37]" : "text-white/30"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative bg-transparent">
        <div className="flex-1 relative pt-0 md:pt-16">
          <AnimatePresence mode="wait">
            <motion.div key={activeMenu}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-full">
              {activeMenu === "beranda" && <Beranda setMenu={handleMenuClick} />}
              {activeMenu === "master_data" && <MasterData />}
              {activeMenu === "pembelajaran" && <Pembelajaran initialSubMenu={activeSubMenu as any} />}
              {activeMenu === "asesmen" && <Asesmen initialSubMenu={activeSubMenu as any} />}
              {activeMenu === "pustaka" && <Pustaka />}
              {activeMenu === "analitik" && <Analitik />}
              {activeMenu === "arsip" && <ArsipDokumen />}
              {activeMenu === "pengaturan" && <Pengaturan />}
              {activeMenu === "admin" && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Search Overlay Dialog */}
      <SearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        onNavigate={handleSearchNavigate} 
      />
    </div>
  );
}

function App() {
  const [session, setSession] = useState<{ username: string; kuotaSisa: number; kuotaMaks: number } | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const login = (username: string, kuotaSisa: number, kuotaMaks: number) => {
    const s = { username, kuotaSisa, kuotaMaks };
    setSession(s);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const setKuota = (kuotaSisa: number, kuotaMaks: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, kuotaSisa, kuotaMaks };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refreshQuota = async () => {
    if (!session?.username) return;
    try {
      const q = await apiGetQuota(session.username);
      setKuota(q.kuotaSisa, q.kuotaMaks);
    } catch { /* silent */ }
  };

  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={login} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionContext.Provider value={{ ...session, setKuota, refreshQuota }}>
          <Layout onLogout={logout} />
          <Toaster />
        </SessionContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
