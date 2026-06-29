import { useState } from "react";
import { apiLogin } from "@/lib/api";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { AppBackground } from "../design-system/components/AppBackground";
import { GlassCard } from "../design-system/components/GlassCard";
import { PrimaryButton } from "../design-system/components/PrimaryButton";
import { TextField } from "../design-system/components/TextField";

interface Props {
  onLogin: (username: string, kuotaSisa: number, kuotaMaks: number) => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Username dan password wajib diisi."); return; }
    setError("");
    setLoading(true);
    try {
      const session = await apiLogin(username, password);
      onLogin(session.username, session.kuotaSisa, session.kuotaMaks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#031c13] via-[#02140d] to-[#010a06] flex flex-col relative overflow-hidden font-sans text-white justify-center animate-in fade-in duration-700">
      
      {/* Layer 3: Additional Islamic Geometry SVG Pattern Overlay with Dark Opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAgMGwxNSAxNS0xNSAxNUwxNSAxNXpNMTE1IDMwbDE1IDE1LTE1IDE1TDAgNDV6TTQ1IDMwbDE1IDE1LTE1IDE1LTE1LTE1eiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] mix-blend-overlay"></div>

      {/* Abstract Faint Digital Circuit Patterns Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 150 L 250 150 L 300 200 L 550 200 M 300 200 L 270 230" stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.18" strokeDasharray="5,5" />
          <circle cx="550" cy="200" r="3" fill="#22d3ee" opacity="0.4" />
          <circle cx="270" cy="230" r="3" fill="#22d3ee" opacity="0.4" />
          
          <path d="M 1440 250 L 1150 250 L 1100 300 L 850 300" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.15" />
          <circle cx="850" cy="300" r="3" fill="#D4AF37" opacity="0.4" />
          
          <path d="M 80 650 L 280 650 L 330 600 L 580 600" stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.15" />
          <circle cx="580" cy="600" r="3" fill="#22d3ee" opacity="0.4" />
        </svg>
      </div>

      {/* Layer 4: Modern Mosque Silhouette in Deep Gold/Teal Shimmer */}
      <div className="absolute bottom-0 left-0 w-full opacity-[0.035] pointer-events-none z-0 overflow-hidden flex justify-center items-end">
        <svg viewBox="0 0 1440 400" className="w-full h-auto min-w-[1000px] max-h-[40vh]" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <path fill="#D4AF37" d="M0,400 L1440,400 L1440,250 L1360,250 L1360,200 L1350,180 L1340,200 L1340,250 L1180,250 L1180,100 L1150,50 L1120,100 L1120,250 L900,250 L900,100 L850,20 L800,100 L800,250 L680,250 L680,120 L650,80 L620,120 L620,250 L400,250 L400,180 L390,160 L380,180 L380,250 L200,250 L200,100 L170,50 L140,100 L140,250 L0,250 Z" />
        </svg>
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center relative z-10 px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Area: Branding (col-span-5) */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-8 animate-in slide-in-from-left-8 duration-1000 delay-150">
            <div className="flex justify-center lg:justify-start">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.25)] ring-2 ring-[#D4AF37]/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/15 via-transparent to-[#D4AF37]/15 animate-pulse"></div>
                <img src="/LOGO PUTIH 1.png" alt="Logo SIM-PAI SEDJATI" className="w-full h-full object-cover rounded-full relative z-10 drop-shadow-lg group-hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
            
            <div className="space-y-5">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                SIMPAI<br />SeDjati
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-white/95 leading-snug drop-shadow-md">
                Mengintegrasikan Kecerdasan Buatan untuk Pendidikan Agama Islam
              </p>
              <div className="h-1 w-16 bg-gradient-to-r from-[#D4AF37] to-transparent rounded-full mx-auto lg:mx-0 my-6"></div>
              <div className="pt-4 lg:hidden">
                 <p className="text-3xl md:text-4xl font-arabic text-[#D4AF37] opacity-100 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</p>
              </div>
            </div>
          </div>

          {/* Right Area: Solid White Sharp Login Card (col-span-7) */}
          <div className="lg:col-span-7 animate-in slide-in-from-right-8 duration-1000 delay-300 w-full max-w-lg mx-auto lg:mr-0 lg:ml-auto">
            
            {/* Basmalah on Laptop */}
            <div className="hidden lg:block text-center mb-6">
              <p className="text-4xl font-arabic text-[#D4AF37] opacity-100 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</p>
            </div>

            <div className="w-full bg-white text-[#112c1e] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_35px_rgba(15,81,50,0.08)] rounded-2xl border border-white/90 relative z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#fce9aa] to-[#D4AF37]"></div>
              
              <div className="p-8 md:p-10">
                <div className="mb-6 text-center flex flex-col items-center">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#031c13] tracking-wide">Masuk ke Platform</h2>
                  <p className="text-[#031c13]/70 text-sm mt-2 font-semibold tracking-wide">Silakan login untuk mengakses dashboard AI</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 w-full">
                    <label htmlFor="username" className="text-[11px] font-extrabold text-[#031c13]/90 uppercase tracking-widest block">
                       USERNAME
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Masukkan username Anda"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      disabled={loading}
                      className="w-full bg-white border border-[#031c13]/25 rounded-xl text-[#112c1e] placeholder-[#031c13]/40 focus:outline-none focus:ring-2 focus:ring-[#031c13] focus:border-[#031c13] shadow-inner h-11 px-4 transition-colors"
                      data-testid="input-username"
                    />
                  </div>

                  <div className="space-y-2 w-full relative">
                    <label htmlFor="password" className="text-[11px] font-extrabold text-[#031c13]/90 uppercase tracking-widest block">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="Masukkan password Anda"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={loading}
                        className="w-full bg-white border border-[#031c13]/25 rounded-xl text-[#112c1e] placeholder-[#031c13]/40 focus:outline-none focus:ring-2 focus:ring-[#031c13] focus:border-[#031c13] shadow-inner h-11 px-4 transition-colors pr-12"
                        data-testid="input-password"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#031c13]/50 hover:text-[#D4AF37] transition-colors focus:outline-none">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer appearance-none w-4 h-4 border border-[#031c13]/25 rounded bg-white checked:bg-gradient-to-br checked:from-[#031c13] checked:to-[#0F5132] checked:border-transparent transition-all cursor-pointer shadow-sm"
                        />
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-[#031c13]/85 group-hover:text-[#031c13] transition-colors">Ingat Saya</span>
                    </label>

                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Fitur lupa password sedang dalam pengembangan."); }} className="text-xs font-bold text-[#b59124] hover:text-[#D4AF37] transition-colors hover:underline underline-offset-4">
                      Lupa Password?
                    </a>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in zoom-in duration-300" data-testid="error-login">
                      <div className="mt-0.5 text-red-600">⚠️</div>
                      <div className="flex-1 font-bold">{error}</div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 group text-[15px] font-extrabold tracking-wider h-12 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white
                      bg-gradient-to-r from-[#D4AF37] via-[#f7e6a7] to-[#D4AF37] bg-[length:200%_auto] hover:bg-right hover:scale-[1.01]
                      border border-[#f5d97e]/60
                      shadow-[0_0_20px_rgba(34,211,238,0.45)] hover:shadow-[0_0_25px_rgba(34,211,238,0.65)]"
                      data-testid="button-login"
                    >
                      {loading ? (
                        <span className="flex items-center gap-3 text-white">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Memverifikasi...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-white">
                          Login Sekarang
                          <LogIn className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300 text-white" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area with High-Contrast Gray and Verbatim Indonesian Labels */}
      <div className="relative z-10 mt-auto pt-8 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest max-w-7xl mx-auto px-4 gap-4 pb-2 animate-in fade-in duration-1000 delay-500">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5">
          <span className="opacity-60">Powered by</span>
          <span className="text-gray-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> 
            Google Gemini AI
          </span>
          <span className="text-gray-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span> 
            Google Sheets
          </span>
        </div>
        <p className="font-semibold text-gray-400">
          SIM-PAI SEDJATI &copy; 2026
        </p>
      </div>
    </div>
  );
}
