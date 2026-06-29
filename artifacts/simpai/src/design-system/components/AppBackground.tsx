import React from 'react';

export function AppBackground({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#031c13] via-[#02140d] to-[#010a06] flex flex-col relative overflow-hidden font-sans text-white ${className}`}>
      {/* Decorative background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#22d3ee]/5 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[#02140d]/40 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        {/* Subtle grid pattern overlay with very faint gold opacity on dark bg */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utb3BhY2l0eT0iMC4wMiIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgwem0wIDBWMGg0MHY0MEgwem0yMC0yMGMwIDExLjA0Ni04Ljk1NCAyMC0yMCAyMFYwYzExLjA0NiAwIDIwIDguOTU0IDIwIDIwem0wIDBjMC0xMS4wNDYgOC45NTQtMjAgMjAtMjB2NDBjLTExLjA0NiAwLTIwLTguOTU0LTIwLTIweiIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
