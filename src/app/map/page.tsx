import React from 'react';
import { getStore } from '@/lib/storage';
import { listComplaints } from '@/lib/complaints';
import { MapWrapper as MapComponent } from '@/components/MapWrapper';
import { AccessibleListView } from '@/components/AccessibleListView';
import {
  MapPin,
  Info,
  Trash2,
  Droplet,
  Wind,
  Car,
  AlertTriangle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function MapPage() {
  const store = getStore();
  const wasteBins = store.getWasteBins();
  const recyclingFacilities = store.getRecyclingFacilities();
  const waterbodies = store.getWaterbodies();
  const aqiStations = store.getAQIStations();
  const trafficObservations = store.getTrafficObservations();
  const complaints = await listComplaints({ limit: 100 });

  const bioBinsCount = wasteBins.filter((b) => b.category === 'biodegradable').length;
  const nonBioBinsCount = wasteBins.filter((b) => b.category === 'non_biodegradable').length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Environmental GIS Intelligence Map
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold">
              Guwahati Pilot
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Explore demonstration waste, water, air quality, and traffic data alongside the latest 100 civic reports.
          </p>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Bio:</span>
            <span className="font-semibold text-zinc-900">{bioBinsCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-zinc-500">Non-Bio:</span>
            <span className="font-semibold text-zinc-900">{nonBioBinsCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-zinc-500">River Channels:</span>
            <span className="font-semibold text-zinc-900">{waterbodies.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-500">Air Stations:</span>
            <span className="font-semibold text-zinc-900">{aqiStations.length}</span>
          </div>
        </div>
      </div>

      {/* Traffic-Air Quality & River Correlation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* River Condition Signal */}
        <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <Droplet className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 text-[11px]">
              Bharalu Canal: Critical Hypoxia
            </div>
            <p className="text-[10px] text-zinc-500">
              DO: 0.8 mg/L &bull; Anaerobic black sludge from unsegregated solid discards.
            </p>
          </div>
        </div>

        {/* Traffic Air Pollution Correlation Signal */}
        <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
            <Car className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 text-[11px]">
              GS Road & Jalukbari: Heavy Emissions
            </div>
            <p className="text-[10px] text-zinc-500">
              Severe traffic bottleneck contributing +32% to +48% localized PM2.5 surge.
            </p>
          </div>
        </div>

        {/* Atmospheric Station Peak */}
        <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 shrink-0">
            <Wind className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 text-[11px]">
              Boragaon Perimeter: Peak NAQI 284
            </div>
            <p className="text-[10px] text-zinc-500">
              High particulate concentration near municipal processing buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Prototype GIS Map */}
      <MapComponent
        wasteBins={wasteBins}
        recyclingFacilities={recyclingFacilities}
        waterbodies={waterbodies}
        aqiStations={aqiStations}
        trafficObservations={trafficObservations}
        complaints={complaints}
        heightClass="h-[520px] sm:h-[720px] lg:h-[800px]"
      />

      {/* Accessible List View Fallback (WCAG 2.2 AA) */}
      <div className="pt-2">
        <AccessibleListView
          wasteBins={wasteBins}
          recyclingFacilities={recyclingFacilities}
          waterbodies={waterbodies}
          aqiStations={aqiStations}
          complaints={complaints}
        />
      </div>

      {/* Prototype Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-zinc-100/70 border border-zinc-200 text-xs text-zinc-500">
        <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-zinc-800">Geospatial Prototype Disclosure: </span>
          Guwahati municipal dustbins, scrap facilities, and assembly boundaries represent authentic local coordinates. Waterbody pollution indicators (DO/BOD) and traffic emission correlations represent calibrated demonstration datasets modeled after regional CPCB/SPCB Assam benchmarks.
        </div>
      </div>
    </div>
  );
}
