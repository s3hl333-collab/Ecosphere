'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Locate,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { MapWrapper as MapComponent } from '@/components/MapWrapper';
import { StatusBadge } from '@/components/StatusBadge';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { resolveConstituency } from '@/lib/geo';
import { GUWAHATI_CONSTITUENCIES } from '@/data/constituencies';
import { publishReport } from '../feed-api';
import { usePhotoUpload } from '@/components/usePhotoUpload';

export default function NewComplaintPage() {
  const router = useRouter();

  // Form Fields
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('garbage_dumping');
  const [userDisplayName, setUserDisplayName] = useState('Guest User');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([91.7485, 26.1882]); // Default Panbazar, Guwahati
  const [imageUrl, setImageUrl] = useState<string>('');

  // Constituency resolution
  const matchedConstituency = resolveConstituency(coordinates, GUWAHATI_CONSTITUENCIES);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [coordinateDraft, setCoordinateDraft] = useState<{ latitude: string; longitude: string } | null>(null);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Preset quick landmarks for Guwahati location selection
  const GUWAHATI_LOCATIONS = [
    { name: 'Pan Bazar (Central Guwahati)', coords: [91.7485, 26.1882] },
    { name: 'Fancy Bazar Ghat (Riverfront)', coords: [91.7412, 26.1856] },
    { name: 'Dispur Capital Complex (South)', coords: [91.7892, 26.1415] },
    { name: 'Jalukbari Flyover (West Gate)', coords: [91.6621, 26.1524] },
    { name: 'Maligaon Chariali Market', coords: [91.6984, 26.1582] },
    { name: 'Bharalu Channel Crossing', coords: [91.7342, 26.1741] },
    { name: 'Deepor Beel North Edge', coords: [91.6625, 26.1287] },
  ];

  const handleLocationSelect = useCallback((coords: [number, number]) => {
    setCoordinates(coords);
    setCoordinateDraft(null);
    setLocationConfirmed(false);
    setAddress((current) => current || `Location (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`);
  }, []);

  const { preparing, choosePhoto, handleFileChange } = usePhotoUpload((dataUrl) => {
    setImageUrl(dataUrl);
    setError(null);
    setLocationConfirmed(false);
  }, setError);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is unavailable. Choose a landmark or enter coordinates.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        handleLocationSelect(coords);
        setAddress(`Near My Location (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`);
      },
      () => {
        setError('Could not determine your location. Choose a landmark or enter coordinates.');
      },
      { timeout: 10_000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || preparing || coordinateDraft) return;
    setError(null);

    if (!caption.trim()) {
      setError('Please enter a caption for your report.');
      return;
    }

    if (!address.trim()) {
      setError('Please enter or verify the location address.');
      return;
    }

    if (!imageUrl) {
      setError('Please snap or upload a photo of the environmental condition.');
      return;
    }

    if (!locationConfirmed) {
      setError('Please check the confirmation box verifying this public location.');
      return;
    }

    setSubmitting(true);

    try {
      const complaint = await publishReport({
        caption: caption.trim(),
        description: description.trim(),
        category,
        latitude: coordinates[1],
        longitude: coordinates[0],
        address: address.trim(),
        imageUrl,
        locationConfirmed,
        userDisplayName: userDisplayName.trim() || 'Guest User',
      });
      router.push(`/complaints/${complaint.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-28 sm:pb-16 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          <Camera className="h-3 w-3 text-emerald-600" />
          <span>Civic Incident Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          Report an Environmental Issue
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Capture garbage dumps, overflowing waste, or channel pollution. Each report is geotagged and matched with its legislative assembly constituency.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Image Capture / Upload */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-mono font-bold">1</span>
              <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 uppercase tracking-wide">
                Photograph Evidence
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-zinc-600">Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Buttons */}
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Snap a live photo directly from your device or upload an existing file:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Live Web Viewfinder Modal Button */}
                <button
                  type="button"
                  onClick={(event) => { event.currentTarget.focus(); setCameraModalOpen(true); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                >
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>Take Photo</span>
                </button>

                {/* Device Native Camera Picker */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-medium transition-colors"
                >
                  <Upload className="h-4 w-4 text-zinc-600" />
                  <span>Choose File</span>
                </button>
              </div>

              {/* Hidden Native File & Camera Inputs */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload photo from device"
              />

              <p role="status">{preparing ? 'Preparing photo…' : ''}</p>
            </div>

            {/* Photo Preview Frame */}
            <div className="h-48 sm:h-52 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center relative shadow-inner">
              {imageUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={imageUrl}
                    alt="Complaint preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => choosePhoto('')}
                      className="px-2.5 py-1.5 rounded-md bg-white text-zinc-900 text-[11px] font-medium shadow-sm hover:bg-zinc-100"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-600 text-xs space-y-2 p-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-200/60 flex items-center justify-center mx-auto text-zinc-500">
                    <Camera className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-zinc-600">No image attached yet</p>
                  <p className="text-[11px] text-zinc-600">
                    Click &quot;Take Photo&quot; to open camera
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Information */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-mono font-bold">2</span>
              <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 uppercase tracking-wide">
                Issue Classification
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-zinc-600">Required</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Reporter Display Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="userDisplayName" className="font-medium text-zinc-800 block">
                  Reported As (Display Name)
                </label>
                <span className="text-[10px] text-zinc-600">Defaults to Guest User</span>
              </div>
              <input
                id="userDisplayName"
                type="text"
                maxLength={60}
                placeholder="Guest User"
                value={userDisplayName}
                onChange={(e) => setUserDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
              />
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label htmlFor="caption" className="font-medium text-zinc-800 block">
                Summary Title *
              </label>
              <input
                id="caption"
                type="text"
                required
                maxLength={160}
                placeholder="e.g., Plastic heap blocking canal pathway near Bharalumukh"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
              />
              <div className="text-[10px] text-zinc-600 text-right">
                {caption.length}/160 characters
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label htmlFor="category" className="font-medium text-zinc-800 block">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
              >
                <option value="garbage_dumping">Garbage Dumping / Open Waste Piles</option>
                <option value="overflowing_bin">Overflowing Municipal Dustbin</option>
                <option value="water_pollution">Polluted River / Waterbody Discharge</option>
                <option value="hazardous_waste">Hazardous Chemical / Electronic Waste</option>
                <option value="blocked_drain">Blocked Drain / Canal Obstruction</option>
                <option value="other">Other Environmental Issue</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="description" className="font-medium text-zinc-800 block">
                Additional Details (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={1000}
                placeholder="Describe specific odors, duration of accumulation, hazards to nearby residents or wildlife..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location & Geotag */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-mono font-bold">3</span>
              <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 uppercase tracking-wide">
                Geotag & Constituency
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-zinc-600">GIS Match</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label htmlFor="address" className="font-medium text-zinc-800 block">
                Street Address / Landmark *
              </label>
              <input
                id="address"
                type="text"
                required
                maxLength={300}
                placeholder="e.g., Near Santipur Railway Crossing, Guwahati"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setLocationConfirmed(false); }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
              />
            </div>

            {/* Quick jump pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-zinc-600">Guwahati Landmarks:</span>
              {GUWAHATI_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    handleLocationSelect(loc.coords as [number, number]);
                    setAddress(loc.name);
                  }}
                  className="px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[10px] text-zinc-700 transition-colors"
                >
                  {loc.name}
                </button>
              ))}
              <button
                type="button"
                onClick={handleLocateMe}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium"
              >
                <Locate className="h-3 w-3" />
                <span>My GPS</span>
              </button>
            </div>

            <fieldset className="flex flex-wrap items-end gap-2">
              <legend className="font-medium text-zinc-800">Set the pin using coordinates</legend>
              {(['latitude', 'longitude'] as const).map((field, index) => (
                <label key={field} className="flex flex-col gap-1 capitalize">
                  {field === 'latitude' ? 'Latitude' : 'Longitude'}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={coordinateDraft?.[field] ?? String(coordinates[1 - index])}
                    onChange={(event) => {
                      setCoordinateDraft({
                        latitude: String(coordinates[1]),
                        longitude: String(coordinates[0]),
                        ...coordinateDraft,
                        [field]: event.currentTarget.value,
                      });
                      setLocationConfirmed(false);
                    }}
                    className="w-28 rounded-md border border-zinc-300 p-2"
                  />
                </label>
              ))}
              <button type="button" className="rounded-md border border-zinc-300 px-3 py-2" onClick={() => {
                if (!coordinateDraft) return;
                const { latitude, longitude } = coordinateDraft;
                const lat = Number(latitude);
                const lng = Number(longitude);
                if (!latitude.trim() || !longitude.trim() || !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
                  setError('Enter a latitude from −90 to 90 and longitude from −180 to 180.');
                  return;
                }
                handleLocationSelect([lng, lat]);
                setError(null);
              }}>Set pin</button>
            </fieldset>

            {/* Interactive Map Pin Selection */}
            <div className="pt-2">
              <MapComponent
                wasteBins={[]}
                recyclingFacilities={[]}
                waterbodies={[]}
                aqiStations={[]}
                trafficObservations={[]}
                complaints={[]}
                selectedLocation={coordinates}
                onLocationSelect={handleLocationSelect}
                heightClass="h-[280px] sm:h-[320px]"
              />
            </div>

            {/* Constituency Resolution Badge */}
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 text-xs">
                  Assembly Constituency Resolution
                </span>
                {matchedConstituency ? (
                  <StatusBadge label="Matched Boundary" variant="green" />
                ) : (
                  <StatusBadge label="Outside Known Boundary" variant="gray" />
                )}
              </div>

              {matchedConstituency ? (
                <div className="space-y-1 text-xs">
                  <div className="text-zinc-800 font-medium">
                    Sector: <span className="text-emerald-700 font-semibold">{matchedConstituency.name}</span>
                  </div>
                  <div className="text-amber-800 text-[11px] font-medium">
                    Contextual MLA: {matchedConstituency.prototypeRepresentative}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    {matchedConstituency.prototypeDisclaimer}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  Constituency information unavailable for these exact coordinates.
                </p>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={locationConfirmed}
                onChange={(e) => setLocationConfirmed(e.target.checked)}
                className="mt-0.5 rounded accent-zinc-900"
              />
              <span className="text-xs text-zinc-600 leading-relaxed">
                I confirm that the map pin matches the incident. I agree to publish this location and photo, and have checked the photo for faces, plates, and other personal information.
              </span>
            </label>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div role="alert" className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Desktop Buttons */}
        <div className="hidden sm:flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/complaints')}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || preparing || !!coordinateDraft}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Publishing Complaint...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Publish Civic Complaint</span>
              </>
            )}
          </button>
        </div>

        {/* Sticky Mobile Action Bar */}
        <div className="fixed sm:hidden bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => { event.currentTarget.focus(); setCameraModalOpen(true); }}
            className="p-2.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            title="Snap photo"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={submitting || preparing || !!coordinateDraft}
            className="flex-1 py-3 px-4 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Publish Civic Complaint</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={choosePhoto}
        title="Snap Environmental Evidence"
      />
    </div>
  );
}
