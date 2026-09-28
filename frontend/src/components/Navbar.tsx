'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck, Activity, UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-gray-800 bg-surface/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight text-white">AI ModelOps</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Platform
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-800 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-gray-300 font-medium">Model-Agnostic Core Active</span>
        </div>

        <div className="flex items-center space-x-2 bg-indigo-950/40 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-800/40 text-xs font-medium">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>Org: Acme Enterprise ML</span>
        </div>

        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer border border-gray-700">
          <UserCircle className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}
