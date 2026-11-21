import React from 'react';
import { getStore } from '@/lib/storage';
import { getCivicTotals } from '@/lib/complaints';
import {
  Trash2,
  Recycle,
  Droplet,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const store = getStore();
  const wasteBins = store.getWasteBins();
  const recycling = store.getRecyclingFacilities();
  const waterbodies = store.getWaterbodies();
  const aqi = store.getAQIStations();
  const { total, categories: categoryCounts, statuses } = await getCivicTotals();

  const bioBins = wasteBins.filter((b) => b.category === 'biodegradable').length;
  const nonBioBins = wasteBins.filter((b) => b.category === 'non_biodegradable').length;

  const resolvedComplaints = statuses.Resolved ?? 0;
  const underReviewComplaints = statuses['Under Review'] ?? 0;
  const reportedComplaints = statuses.Reported ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              Environmental Intelligence Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary-border text-[11px] font-medium">
              Guwahati Analytics
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Aggregated municipal waste infrastructure metrics, NAQI atmospheric readings, and civic complaint resolution tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>Environmental measurements are demonstration data</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Dustbins */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Segregated Bins</span>
            <Trash2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {wasteBins.length}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span className="text-[#176B50] font-medium">{bioBins} Bio</span>
            <span>&bull;</span>
            <span className="text-[#2B6CB0] font-medium">{nonBioBins} Non-Bio</span>
          </div>
        </div>

        {/* Metric 2: Recycling Centers */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Recovery & Recycling</span>
            <Recycle className="h-4 w-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {recycling.length}
          </div>
          <div className="text-[11px] text-text-muted">
            MRFs, scrap dealers & compost hubs
          </div>
        </div>

        {/* Metric 3: Waterbodies Monitored */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Threatened Waterbodies</span>
            <Droplet className="h-4 w-4 text-[#B74444]" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {waterbodies.length}
          </div>
          <div className="text-[11px] text-accent-error font-medium">
            Deepor Beel & Bharalu critical zones
          </div>
        </div>

        {/* Metric 4: Civic Complaints */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Civic Reports Published</span>
            <AlertTriangle className="h-4 w-4 text-accent-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {total}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span className="text-primary font-medium">{resolvedComplaints} resolved</span>
            <span>&bull;</span>
            <span>{underReviewComplaints} in review</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Air Quality Station Summary */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Wind className="h-4 w-4 text-primary" />
              <span>National Air Quality Index (NAQI)</span>
            </h2>
            <span className="text-[10px] uppercase font-semibold text-text-muted">
              Continuous Monitoring
            </span>
          </div>

          <div className="space-y-3">
            {aqi.map((station) => (
              <div
                key={station.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF8] border border-border text-xs"
              >
                <div>
                  <div className="font-medium text-text-primary">
                    {station.stationName}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Dominant: {station.dominantPollutant} | PM2.5: {station.pm25} &mu;g/m&sup3;
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-bold text-text-primary">
                      {station.aqiValue}
                    </div>
                    <div className="text-[10px] text-text-muted">NAQI</div>
                  </div>
                  <StatusBadge
                    label={station.category}
                    variant={
                      station.category === 'Good' || station.category === 'Satisfactory'
                        ? 'green'
                        : station.category === 'Moderate'
                        ? 'yellow'
                        : 'red'
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
            <span>Standard: Central Pollution Control Board (CPCB) NAQI scale</span>
            <Link href="/map" className="text-primary hover:underline font-medium">
              View on Map &rarr;
            </Link>
          </div>
        </div>

        {/* Civic Complaint Category & Status Distribution */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-warning" />
              <span>Civic Complaint Distribution</span>
            </h2>
            <Link href="/complaints" className="text-[11px] font-medium text-primary hover:underline">
              View All ({total})
            </Link>
          </div>

          {/* Status Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Resolution Pipeline</span>
              <span>
                {Math.round((resolvedComplaints / (total || 1)) * 100)}% Resolved
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E5E9E5] overflow-hidden flex">
              <div
                style={{
                  width: `${(resolvedComplaints / (total || 1)) * 100}%`,
                }}
                className="bg-[#176B50] h-full"
                title="Resolved"
              />
              <div
                style={{
                  width: `${(underReviewComplaints / (total || 1)) * 100}%`,
                }}
                className="bg-[#D97706] h-full"
                title="Under Review"
              />
              <div
                style={{
                  width: `${(reportedComplaints / (total || 1)) * 100}%`,
                }}
                className="bg-[#2B6CB0] h-full"
                title="Reported"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#176B50]" /> Resolved ({resolvedComplaints})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Under Review ({underReviewComplaints})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2B6CB0]" /> Reported ({reportedComplaints})
              </span>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2 pt-2 border-t border-border text-xs">
            <span className="font-semibold text-text-primary text-[11px] uppercase tracking-wider block">
              Breakdown by Problem Type:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2 rounded bg-[#FAFAF8] border border-border"
                >
                  <span className="text-text-secondary capitalize">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waterbody Health Summary */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-accent-blue" />
            <h2 className="text-sm font-semibold text-text-primary">
              Waterbody Ecological Monitoring Status
            </h2>
          </div>
          <StatusBadge label="PROTOTYPE ASSAM WATER RECORDS" variant="prototype" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {waterbodies.map((w) => (
            <div
              key={w.id}
              className="p-3.5 rounded-lg bg-[#FAFAF8] border border-border space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary line-clamp-1">
                    {w.name}
                  </span>
                  <StatusBadge
                    label={w.pollutionLevel.toUpperCase()}
                    variant={
                      w.pollutionLevel === 'critical'
                        ? 'red'
                        : w.pollutionLevel === 'severe'
                        ? 'yellow'
                        : 'blue'
                    }
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 capitalize">
                  {w.waterbodyType} ecosystem
                </p>
              </div>

              <div className="space-y-1 text-text-secondary pt-2 border-t border-border">
                <div className="flex justify-between">
                  <span>Dissolved Oxygen (DO):</span>
                  <span className="font-medium text-text-primary">
                    {w.dissolvedOxygenMgL} mg/L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biochemical Oxygen Demand:</span>
                  <span className="font-medium text-text-primary">
                    {w.bodMgL} mg/L
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-text-muted pt-1">
                Primary Threat: {w.primaryPollutants[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
