'use client';

import dynamic from 'next/dynamic';
export const MapWrapper = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div role="status" className="w-full min-h-56 rounded-2xl bg-[#0a1411] flex flex-col items-center justify-center text-zinc-400 gap-3 border border-zinc-800 shadow-inner">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
          Initializing Guwahati Satellite GIS...
        </span>
      </div>
    ),
  }
);
