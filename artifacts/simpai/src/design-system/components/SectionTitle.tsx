import React from 'react';

export function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-xl font-extrabold text-[#0F5132] flex items-center gap-2 border-l-4 border-[#D4AF37] pl-3 tracking-wide ${className}`}>
      {children}
    </h2>
  );
}
