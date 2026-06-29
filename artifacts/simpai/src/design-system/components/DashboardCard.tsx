import React from 'react';
import { GlassCard } from './GlassCard';

export function DashboardCard({ title, value, subtitle, icon, className = '' }: { title: string, value: string | React.ReactNode, subtitle?: string, icon?: React.ReactNode, className?: string }) {
  return (
    <GlassCard className={`p-5 flex flex-col ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-[#D4AF37]/90">{icon}</div>}
      </div>
      <div className="mt-auto">
        <div className="text-2xl font-extrabold text-white">{value}</div>
        {subtitle && <div className="text-[11px] text-white/60 mt-1">{subtitle}</div>}
      </div>
    </GlassCard>
  );
}
