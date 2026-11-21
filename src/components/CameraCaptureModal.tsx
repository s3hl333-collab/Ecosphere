'use client';

import React, { useRef, useState, useEffect, useId } from 'react';
import { Camera, X, RefreshCw, SwitchCamera, AlertCircle } from 'lucide-react';
import { captureJpeg } from '@/lib/client-image';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Photo',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    dialog.showModal();
    return () => dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isOpen || !video) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    async function startCamera(target: HTMLVideoElement) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        target.srcObject = stream;
        await target.play();
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setError('Could not access the camera. Check permissions or upload a photo.');
      } finally {
        if (!cancelled) setStarting(false);
      }
    }
    void startCamera(video);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [isOpen, facingMode]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    try {
      onCapture(captureJpeg(video, video.videoWidth, video.videoHeight));
      close();
    } catch {
      setError('Could not capture the photo. Try switching cameras or uploading a file.');
    }
  };

  const toggleCamera = () => {
    setStarting(true);
    setError(null);
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };
  const close = () => {
    dialogRef.current?.close();
    setStarting(true);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-transparent backdrop:bg-black/80"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 text-white overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-400" />
            <span id={titleId} className="text-xs font-semibold tracking-wide uppercase font-mono">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-3 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close camera"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {starting && (
            <div role="status" className="absolute flex flex-col items-center gap-2 text-zinc-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
              <span>Starting camera viewfinder...</span>
            </div>
          )}

          {error && (
            <div role="alert" className="absolute p-6 text-center space-y-2 max-w-xs">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-xs text-zinc-300 leading-relaxed">{error}</p>
            </div>
          )}
            <video
              ref={videoRef}
              aria-hidden="true"
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-contain ${starting || error ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            />

          {/* Viewfinder Guides / Target Crosshairs */}
          {!error && !starting && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-5/6 h-5/6 border border-white/20 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-sm" />
              </div>
            </div>
          )}

        </div>

        {/* Action Controls */}
        <div className="px-4 py-4 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center justify-around">
          {/* Switch Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            aria-label="Switch front or rear camera"
            disabled={starting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            title="Switch front/rear camera"
          >
            <SwitchCamera className="h-4 w-4" />
            <span className="hidden sm:inline">Flip</span>
          </button>

          {/* Shutter Button */}
          <button
            type="button"
            onClick={capturePhoto}
            disabled={starting || !!error}
            className="h-14 w-14 rounded-full border-4 border-white/30 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center shadow-lg disabled:opacity-40"
            aria-label="Take picture"
          >
            <div className="h-10 w-10 rounded-full bg-white shadow-inner" />
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={close}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
};
