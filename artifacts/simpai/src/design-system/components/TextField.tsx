import React from 'react';

export function TextField({ label, id, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label htmlFor={id} className="text-[11px] font-bold text-[#0F5132]/85 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-white/80 border border-[#0F5132]/20 rounded-md text-[#112c1e] placeholder:text-[#0F5132]/35 focus:outline-none focus:ring-2 focus:ring-[#0F5132] focus:border-[#0F5132] shadow-sm h-11 px-3 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
