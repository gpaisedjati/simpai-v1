import React from 'react';

export function GlassCard({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-[#D4AF37]/20 bg-[#04241a]/80 backdrop-blur-xl rounded-2xl overflow-hidden relative text-white ${className}`}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
