'use client';

import React, { useState } from 'react';
import {
  WasteBin,
  RecyclingFacility,
  Waterbody,
  AQIMeasurement,
  Complaint,
} from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import Link from 'next/link';
import {
  Trash2,
  Recycle,
  Droplet,
  Wind,
  AlertCircle,
  ExternalLink,
  Search,
} from 'lucide-react';

interface AccessibleListViewProps {
  wasteBins: WasteBin[];
  recyclingFacilities: RecyclingFacility[];
  waterbodies: Waterbody[];
  aqiStations: AQIMeasurement[];
  complaints: Complaint[];
}

export const AccessibleListView: React.FC<AccessibleListViewProps> = ({
  wasteBins,
  recyclingFacilities,
  waterbodies,
  aqiStations,
  complaints,
}) => {
  const [activeTab, setActiveTab] = useState<
    'bins' | 'recycling' | 'waterbodies' | 'aqi' | 'complaints'
  >('bins');
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.toLowerCase().trim();

  const filteredBins = wasteBins.filter(
    (b) =>
      b.address.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query)
  );

  const filteredRecycling = recyclingFacilities.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.address.toLowerCase().includes(query) ||
      f.acceptedCategories.some((c) => c.toLowerCase().includes(query))
  );

  const filteredWaterbodies = waterbodies.filter(
    (w) =>
      w.name.toLowerCase().includes(query) ||
      w.pollutionLevel.toLowerCase().includes(query) ||
      w.primaryPollutants.some((p) => p.toLowerCase().includes(query))
  );

  const filteredAQI = aqiStations.filter(
    (a) =>
      a.stationName.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query)
  );

  const filteredComplaints = complaints.filter(
    (c) =>
      c.caption.toLowerCase().includes(query) ||
      c.address.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
  );

  return (
    <section
      aria-label="Accessible Data List View"
      className="bg-surface rounded-lg border border-border p-4 shadow-subtle"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Accessible Environmental Directory
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Tabular text directory for screen readers, keyboard users, and low-bandwidth exploration.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="search"
            placeholder="Search directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-[#FAFAF8] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
            aria-label="Filter directory entries"
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        role="group"
        aria-label="Environmental data categories"
        className="flex flex-wrap items-center gap-1.5 py-3 border-b border-border text-xs"
      >
        <button
          type="button"
          aria-pressed={activeTab === 'bins'}
          onClick={() => setActiveTab('bins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            activeTab === 'bins'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-[#F5F6F4]'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Waste Bins ({filteredBins.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'recycling'}
          onClick={() => setActiveTab('recycling')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            activeTab === 'recycling'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-[#F5F6F4]'
          }`}
        >
          <Recycle className="h-3.5 w-3.5" />
          <span>Recycling & Junkyards ({filteredRecycling.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'waterbodies'}
          onClick={() => setActiveTab('waterbodies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            activeTab === 'waterbodies'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-[#F5F6F4]'
          }`}
        >
          <Droplet className="h-3.5 w-3.5" />
          <span>Waterbodies ({filteredWaterbodies.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'aqi'}
          onClick={() => setActiveTab('aqi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            activeTab === 'aqi'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-[#F5F6F4]'
          }`}
        >
          <Wind className="h-3.5 w-3.5" />
          <span>AQI Stations ({filteredAQI.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'complaints'}
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            activeTab === 'complaints'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-[#F5F6F4]'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Public Complaints ({filteredComplaints.length})</span>
        </button>
      </div>

      {/* Content Panels */}
      <div className="mt-4 overflow-x-auto" role="region" aria-label="Environmental data table" tabIndex={0}>
        {activeTab === 'bins' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-[#FAFAF8]">
                <th className="py-2 px-3 font-semibold">Category</th>
                <th className="py-2 px-3 font-semibold">Location / Address</th>
                <th className="py-2 px-3 font-semibold">Capacity</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBins.map((bin) => (
                <tr key={bin.id} className="hover:bg-[#FBFDFB]">
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      label={
                        bin.category === 'biodegradable'
                          ? 'Biodegradable (Green)'
                          : 'Non-Biodegradable (Blue)'
                      }
                      variant={
                        bin.category === 'biodegradable' ? 'green' : 'blue'
                      }
                    />
                  </td>
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    {bin.address}
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Lat: {bin.coordinates[1].toFixed(4)}, Lng:{' '}
                      {bin.coordinates[0].toFixed(4)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    {bin.capacityLiters} L
                  </td>
                  <td className="py-2.5 px-3 capitalize text-text-secondary">
                    {bin.fillStatus.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    {bin.verifiedBy}
                  </td>
                </tr>
              ))}
              {filteredBins.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No matching dustbins found in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'recycling' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-[#FAFAF8]">
                <th className="py-2 px-3 font-semibold">Facility Name</th>
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Accepted Materials</th>
                <th className="py-2 px-3 font-semibold">Address & Hours</th>
                <th className="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecycling.map((fac) => (
                <tr key={fac.id} className="hover:bg-[#FBFDFB]">
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    {fac.name}
                    {fac.contactPhone && (
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Tel: {fac.contactPhone}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary capitalize">
                    {fac.facilityType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {fac.acceptedCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-[#F4F6F4] text-[10px] text-text-secondary border border-border"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    <div>{fac.address}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {fac.operatingHours}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      label={fac.verificationStatus}
                      variant={
                        fac.verificationStatus === 'verified'
                          ? 'green'
                          : 'yellow'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'waterbodies' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-[#FAFAF8]">
                <th className="py-2 px-3 font-semibold">Waterbody</th>
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Pollution Severity</th>
                <th className="py-2 px-3 font-semibold">Key Pollutants</th>
                <th className="py-2 px-3 font-semibold">Sample Indicators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWaterbodies.map((w) => (
                <tr key={w.id} className="hover:bg-[#FBFDFB]">
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    {w.name}
                    <div className="text-[10px] text-text-muted">
                      {w.dataSource}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 capitalize text-text-secondary">
                    {w.waterbodyType}
                  </td>
                  <td className="py-2.5 px-3">
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
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    <ul className="list-disc list-inside">
                      {w.primaryPollutants.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    <div>DO: {w.dissolvedOxygenMgL} mg/L</div>
                    <div>BOD: {w.bodMgL} mg/L</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'aqi' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-[#FAFAF8]">
                <th className="py-2 px-3 font-semibold">Station Name</th>
                <th className="py-2 px-3 font-semibold">NAQI Value</th>
                <th className="py-2 px-3 font-semibold">Air Quality Category</th>
                <th className="py-2 px-3 font-semibold">Pollutant Readings</th>
                <th className="py-2 px-3 font-semibold">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAQI.map((aqi) => (
                <tr key={aqi.id} className="hover:bg-[#FBFDFB]">
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    {aqi.stationName}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-text-primary text-sm">
                    {aqi.aqiValue}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      label={aqi.category}
                      variant={
                        aqi.category === 'Good'
                          ? 'green'
                          : aqi.category === 'Satisfactory'
                          ? 'green'
                          : aqi.category === 'Moderate'
                          ? 'yellow'
                          : 'red'
                      }
                    />
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    <div>PM2.5: {aqi.pm25} &mu;g/m&sup3;</div>
                    <div>PM10: {aqi.pm10} &mu;g/m&sup3;</div>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-text-muted">
                    {aqi.sourceLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'complaints' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-[#FAFAF8]">
                <th className="py-2 px-3 font-semibold">Issue</th>
                <th className="py-2 px-3 font-semibold">Category</th>
                <th className="py-2 px-3 font-semibold">Location & Constituency</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-[#FBFDFB]">
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    {c.caption}
                    <div className="text-[10px] text-text-muted">
                      {new Date(c.createdAt).toLocaleDateString()} by{' '}
                      {c.userDisplayName}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 capitalize text-text-secondary">
                    {c.category.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    <div>{c.address}</div>
                    <div className="text-[10px] text-primary font-medium mt-0.5">
                      {c.constituencyName || 'Constituency unavailable'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      label={c.status}
                      variant={
                        c.status === 'Resolved'
                          ? 'green'
                          : c.status === 'Under Review'
                          ? 'yellow'
                          : 'blue'
                      }
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <Link
                      href={`/complaints/${c.id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
