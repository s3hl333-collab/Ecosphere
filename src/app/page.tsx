import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Scan,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Recycle,
  Droplet,
  Compass,
  CheckCircle2,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getStore } from '@/lib/storage';
import { listComplaints } from '@/lib/complaints';
import { MapWrapper as MapComponent } from '@/components/MapWrapper';

export const revalidate = 0;

export default async function LandingPage() {
  const store = getStore();
  const wasteBins = store.getWasteBins();
  const recycling = store.getRecyclingFacilities();
  const waterbodies = store.getWaterbodies();
  const aqi = store.getAQIStations();
  const traffic = store.getTrafficObservations();
  const complaints = await listComplaints({ limit: 15 });

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute inset-0 -top-10 -z-10 h-[480px] w-full bg-grid-pattern opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono uppercase tracking-wider text-zinc-700 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Guwahati Environmental Intelligence Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
            A clearer view of your environment.
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            Explore waste infrastructure, monitor ambient environmental conditions,
            and photograph civic issues through one connected platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              href="/complaints/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-sm transition-all active:scale-95"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Photograph & Report Issue</span>
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-medium hover:bg-zinc-50 shadow-xs transition-colors"
            >
              <MapPin className="h-4 w-4 text-zinc-600" />
              <span>Explore GIS Map</span>
            </Link>

            <Link
              href="/scan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-medium hover:bg-zinc-50 shadow-xs transition-colors"
            >
              <Scan className="h-4 w-4 text-emerald-600" />
              <span>AI Waste Scanner</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Map Preview Block */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="border border-zinc-200/90 rounded-2xl bg-white p-2.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 pb-2 border-b border-zinc-100 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-zinc-900">
                Guwahati Metropolitan Demonstration Layer
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#176B50]" /> Bins: {wasteBins.length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Facilities: {recycling.length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B74444]" /> Waterbodies: {waterbodies.length}
              </span>
            </div>
          </div>

          <MapComponent
            wasteBins={wasteBins}
            recyclingFacilities={recycling}
            waterbodies={waterbodies}
            aqiStations={aqi}
            trafficObservations={traffic}
            complaints={complaints}
            heightClass="h-[460px] sm:h-[540px]"
          />
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Engineered for municipal ecology and civic engagement.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Waste Identification */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all group">
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Scan className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Multimodal Waste Scanner
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Take a photo or upload discards. AI categorizes items into
                biodegradable, recyclable, hazardous, e-waste, sanitary, or
                non-biodegradable residual streams with safety guidelines.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-600 pt-3 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Battery & chemical hazard warnings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Dry vs wet municipal bin routing</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/scan"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-emerald-700 transition-colors"
              >
                <span>Launch Scanner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Environmental GIS Mapping */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all group">
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="h-5 w-5 text-sky-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Environmental GIS Intelligence
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Discover segregated dustbins, authorized recyclers, and scrap dealers.
                Observe continuous NAQI air quality stations, traffic overlays, and
                threatened wetlands like Deepor Beel.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-600 pt-3 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Independent layer filtering controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>DO and BOD water quality indices</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-sky-700 transition-colors"
              >
                <span>Open GIS Map</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. Civic Reporting */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all group">
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Camera className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Civic Reporting & Constituency
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Photograph garbage dumping or blocked conduits from your phone.
                Coordinates are matched against assembly constituency polygons to
                display contextual representative metadata.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-600 pt-3 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Point-in-polygon constituency lookup</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Live community accountability feed</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/complaints"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-amber-700 transition-colors"
              >
                <span>View Civic Feed</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Ethical Data & Demonstration Architecture</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              EcoSphere explicitly denotes verified real-world infrastructure vs
              synthetic demonstration records. Prototype MLA metadata provides
              civic contextual awareness without implying direct municipal resolution.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-sm transition-all"
          >
            Open Intelligence Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
