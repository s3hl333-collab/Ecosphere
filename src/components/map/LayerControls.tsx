import { AlertTriangle, Car, Droplet, Wind } from 'lucide-react';

const layerOptions = [
  {
    id: 'bioBins', label: 'Bio Bins', shortLabel: 'Bio',
    activeClass: 'bg-emerald-600',
    symbol: <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 sm:h-2 sm:w-2" />,
  },
  {
    id: 'nonBioBins', label: 'Non-Bio Bins', shortLabel: 'Dry',
    activeClass: 'bg-sky-600',
    symbol: <span className="h-1.5 w-1.5 rounded-full bg-sky-300 sm:h-2 sm:w-2" />,
  },
  {
    id: 'waterbodies', label: 'River Hypoxia', shortLabel: 'River',
    activeClass: 'bg-rose-600',
    symbol: <Droplet size={12} />,
  },
  {
    id: 'aqi', label: 'NAQI Stations', shortLabel: 'NAQI',
    activeClass: 'bg-amber-600',
    symbol: <Wind size={12} className="sm:text-amber-300" />,
  },
  {
    id: 'traffic', label: 'Traffic Emissions', shortLabel: 'Traffic',
    activeClass: 'bg-red-600',
    symbol: <Car size={12} />,
  },
  {
    id: 'complaints', label: 'Complaints', shortLabel: 'Reports',
    activeClass: 'bg-zinc-700',
    symbol: <AlertTriangle size={12} className="text-amber-400" />,
  },
] as const;

export type LayerId = typeof layerOptions[number]['id'];

interface LayerControlsProps {
  visible: Record<LayerId, boolean>;
  onToggle: (id: LayerId) => void;
}

export function LayerControls({ visible, onToggle }: LayerControlsProps) {
  return (
    <div
      role="group"
      aria-label="Environmental layers"
      className="absolute top-14 left-2.5 right-2.5 z-[400] flex items-center gap-1.5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/92 p-1 shadow-xl backdrop-blur-md no-scrollbar sm:top-3 sm:left-auto sm:right-16 sm:flex-wrap sm:overflow-visible sm:p-1.5 sm:shadow-2xl"
    >
      {layerOptions.map(({ id, label, shortLabel, activeClass, symbol }) => (
        <button
          key={id}
          type="button"
          onClick={() => onToggle(id)}
          aria-pressed={visible[id]}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium sm:gap-1.5 sm:text-[11px] sm:transition-all ${
            visible[id] ? `${activeClass} text-white sm:font-semibold sm:shadow-xs` : 'bg-zinc-900 text-zinc-400 sm:bg-transparent sm:hover:bg-zinc-800 sm:hover:text-white'
          }`}
        >
          {symbol}
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
