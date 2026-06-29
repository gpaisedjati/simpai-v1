import React from 'react';

export function SecondaryButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={`bg-[#0F5132]/8 hover:bg-[#0F5132]/15 text-[#0F5132] font-semibold tracking-wide transition-all active:scale-[0.98] h-11 px-6 rounded-md border border-[#0F5132]/15 hover:border-[#0F5132]/25 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
