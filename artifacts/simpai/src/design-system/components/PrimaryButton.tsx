import React from 'react';

export function PrimaryButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={`bg-gradient-to-r from-[#0F5132] to-[#1E7E5A] hover:from-[#0b3c25] hover:to-[#176246] text-white font-bold tracking-wide shadow-[0_4px_14px_rgba(15,81,50,0.25)] transition-all active:scale-[0.98] h-11 px-6 rounded-md border border-[#1E7E5A]/30 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
