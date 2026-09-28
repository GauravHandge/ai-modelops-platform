'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo'
}: MetricCardProps) {
  const colorStyles = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-400 border-indigo-500/20 icon-bg:bg-indigo-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20 icon-bg:bg-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20 icon-bg:bg-amber-500/20',
    rose: 'from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/20 icon-bg:bg-rose-500/20',
    violet: 'from-violet-500/10 to-violet-600/5 text-violet-400 border-violet-500/20 icon-bg:bg-violet-500/20',
  }[color];

  return (
    <div className={`p-5 glass-panel bg-gradient-to-br ${colorStyles} border flex flex-col justify-between space-y-4`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg bg-gray-800/80 border border-gray-700/50`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
          <span className="text-gray-400">{trend}</span>
        </div>
      )}
    </div>
  );
}
