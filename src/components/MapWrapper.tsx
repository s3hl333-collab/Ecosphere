'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import {
  WasteBin,
  RecyclingFacility,
  Waterbody,
  AQIMeasurement,
  TrafficObservation,
  Complaint,
} from '@/lib/types';

interface MapWrapperProps {
  wasteBins: WasteBin[];
  recyclingFacilities: RecyclingFacility[];
  waterbodies: Waterbody[];
  aqiStations: AQIMeasurement[];
  trafficObservations: TrafficObservation[];
  complaints: Complaint[];
  interactive?: boolean;
  selectedLocation?: [number, number]; // [lng, lat]
  onLocationSelect?: (coords: [number, number]) => void;
  heightClass?: string;
}

const DynamicMap = dynamic(
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

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return <DynamicMap {...props} />;
};
