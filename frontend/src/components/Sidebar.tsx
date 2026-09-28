'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Box, 
  FlaskConical, 
  Rocket, 
  Activity, 
  AlertTriangle,
  Lock
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Model Registry', href: '/models', icon: Box },
  { name: 'Experiments', href: '/experiments', icon: FlaskConical },
  { name: 'Deployments', href: '/deployments', icon: Rocket },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Drift Alerts', href: '/alerts', icon: AlertTriangle, badgeKey: 'alerts' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-800 bg-surface/50 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            MLOps Operations
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badgeKey && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Alerts
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 glass-panel border-gray-800 text-xs text-gray-400 space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
          <Lock className="h-3.5 w-3.5" />
          <span>Role: MLOps Admin</span>
        </div>
        <p className="text-[11px] text-gray-500">
          Generic Standard Contract v1.0. Model-agnostic adapter engine ready.
        </p>
      </div>
    </aside>
  );
}
