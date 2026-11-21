'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Info,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { WasteScanResult } from '@/lib/types';
import { usePhotoUpload } from '@/components/usePhotoUpload';

export default function ScanPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<WasteScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const analysisRequest = useRef<AbortController | null>(null);
  useEffect(() => () => analysisRequest.current?.abort(), []);

  const SAMPLE_ITEMS = [
    {
      label: 'AA Lithium Battery',
      tag: 'battery',
      icon: '🔋',
      desc: 'Toxic heavy metals',
    },
    {
      label: 'PET Beverage Bottle',
      tag: 'bottle',
      icon: '🍾',
      desc: 'Type 1 recyclable',
    },
    {
      label: 'Organic Fruit Peels',
      tag: 'fruit',
      icon: '🍌',
      desc: 'Wet compostable',
    },
    {
      label: 'Biomedical Syringe',
      tag: 'syringe',
      icon: '💉',
      desc: 'Biohazard sanitary',
    },
    {
      label: 'Foil Snack Wrapper',
      tag: 'wrapper',
      icon: '🍿',
      desc: 'Multilayer non-bio',
    },
  ];

  async function analyzeImage(payload: { image: string } | { sample: string }) {
    analysisRequest.current?.abort();
    const controller = new AbortController();
    analysisRequest.current = controller;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to analyze waste image');
      }

      if (!controller.signal.aborted) setResult(json.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error ? err.message : 'An error occurred during analysis.'
      );
    } finally {
      if (!controller.signal.aborted) setAnalyzing(false);
    }
  }

  const { preparing, choosePhoto, handleFileChange, cancelPreparation } = usePhotoUpload((dataUrl) => {
    setSelectedImage(dataUrl);
    void analyzeImage({ image: dataUrl });
  }, setError);

  const handleSelectSample = (sampleTag: string) => {
    cancelPreparation();
    setSelectedImage(null);
    void analyzeImage({ sample: sampleTag });
  };

  const resetScanner = () => {
    cancelPreparation();
    analysisRequest.current?.abort();
    setAnalyzing(false);
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono uppercase tracking-wider text-zinc-700">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Multimodal Neural Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          AI Waste Segregation Scanner
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Upload a photo for guidance on sorting discarded items, or try a labeled demo sample. Avoid photos with faces, addresses, or other personal details.
        </p>
      </div>

      {/* Main Upload / Camera Box */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Input Actions */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-900 uppercase font-mono tracking-wider">
              Input Media Stream
            </h2>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Take Photo Viewfinder Button */}
              <button
                type="button"
                onClick={(event) => { event.currentTarget.focus(); setCameraModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Snap Photo</span>
              </button>

              {/* Upload File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-900 transition-colors"
              >
                <Upload className="h-4 w-4 text-zinc-600" />
                <span>Upload File</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload waste image"
              />

              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Capture with mobile camera"
              />
            </div>

            <p className="text-[11px] text-zinc-600">
              Supports JPEG, PNG, WebP with client-side EXIF sanitization.
            </p>

            {/* Quick Demo Test Presets */}
            <div className="pt-3 border-t border-zinc-100 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 block">
                Instant sample classifiers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectSample(item.tag)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-800 hover:border-zinc-400 hover:bg-white transition-all shadow-xs"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview or Empty State */}
          <div className="h-56 sm:h-64 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center p-4 overflow-hidden text-center relative shadow-inner">
            {selectedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={selectedImage}
                  alt="Uploaded waste item"
                  className="w-full h-full object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={resetScanner}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-sm"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : analyzing ? (
              <div className="space-y-3">
                <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-medium text-zinc-900">
                  Decomposing material layers & safety thresholds...
                </p>
                <p className="text-[11px] text-zinc-600 font-mono">
                  Validating structured Zod environmental rules
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-zinc-600">
                <div className="w-10 h-10 rounded-full bg-zinc-200/60 flex items-center justify-center mx-auto text-zinc-500">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-zinc-700">
                  No image stream connected
                </p>
                <p className="text-[11px]">
                  Click &quot;Snap Photo&quot; to inspect any item
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        <p role="status" className="text-xs text-zinc-700">
          {preparing ? 'Preparing photo…' : analyzing ? 'Analyzing…' : result ? `Analysis ready: ${result.objectName}` : ''}
        </p>
        {error && (
          <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Structured Analysis Results Panel */}
      {result && (
        <section
          aria-label="Waste Classification Result"
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200"
        >
          {/* Header & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-600 font-semibold">
                Intelligence Output
              </span>
              <h2 className="text-lg sm:text-2xl font-semibold text-zinc-900">
                {result.objectName}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={`STREAM: ${result.primaryCategory.toUpperCase()}`}
                variant={
                  result.primaryCategory === 'biodegradable'
                    ? 'green'
                    : result.primaryCategory === 'recyclable'
                    ? 'blue'
                    : result.primaryCategory === 'hazardous'
                    ? 'red'
                    : 'yellow'
                }
                size="md"
              />
              {result.secondaryCategory && (
                <StatusBadge
                  label={`Sub: ${result.secondaryCategory}`}
                  variant="gray"
                  size="md"
                />
              )}
              {result.isDemoAnalysis && (
                <StatusBadge label="VERIFIED DEMO PROFILE" variant="prototype" />
              )}
            </div>
          </div>

          {/* Hazardous Warning Banner */}
          {result.isHazardous && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800 shadow-xs">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <span className="font-semibold text-sm text-red-900 block">
                  Mandatory Hazard Protocol
                </span>
                <p className="leading-relaxed">
                  Contains toxic electrolytic, heavy metal, or biomedical pathogen elements. Discharging into municipal general garbage streams violates environmental safety standards.
                </p>
              </div>
            </div>
          )}

          {/* Grid: Material Attributes & Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Explanation & Materials */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  Scientific Rationale
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-zinc-900 mb-1.5">
                  Material Composition
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.materialAttributes.map((mat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-800 border border-zinc-200/60"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  Recycling & Circular Economy Impact
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {result.recyclingConsiderations}
                </p>
              </div>
            </div>

            {/* Disposal Steps */}
            <div className="space-y-4 bg-zinc-50 p-5 rounded-xl border border-zinc-200/80">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Prescribed Segregation Steps</span>
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed">
                {result.disposalInstructions.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    <span className="font-medium text-zinc-800">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              {result.safetyWarnings.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-800 block">
                    Critical Safety Alerts:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
                    {result.safetyWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={choosePhoto}
        title="AI Waste Viewfinder"
      />
    </div>
  );
}
