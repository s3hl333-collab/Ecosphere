'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, Camera, CheckCircle2, RefreshCw, Upload, X } from 'lucide-react';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { usePhotoUpload } from '@/components/usePhotoUpload';
import { errorMessage, publishReport } from '../feed-api';

const GUWAHATI_LANDMARKS: { name: string; coords: [number, number] }[] = [
  { name: 'Fancy Bazar Market, Guwahati', coords: [91.7425, 26.1839] },
  { name: 'Bharalumukh Channel Bridge, Guwahati', coords: [91.7342, 26.1741] },
  { name: 'Pan Bazar High Road, Guwahati', coords: [91.7485, 26.1882] },
  { name: 'Dispur Capital Complex, Guwahati', coords: [91.7892, 26.1415] },
  { name: 'Jalukbari Rotary, Guwahati', coords: [91.6621, 26.1524] },
  { name: 'Maligaon Station Area, Guwahati', coords: [91.6984, 26.1582] },
];

const SAMPLE_PHOTOS = [
  {
    label: 'Overflowing Waste Dump',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Plastic in Storm Drain',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Discarded Battery Scrap',
    url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Market Vegetable Pileup',
    url: 'https://images.unsplash.com/photo-1611288870280-4a87a22a36b3?auto=format&fit=crop&w=800&q=80',
  },
];

interface ReportComposerProps {
  open: boolean;
  demoStorage: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export function ReportComposer({ open, demoStorage, onClose, onPublished }: ReportComposerProps) {
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('garbage_dumping');
  const [address, setAddress] = useState('Fancy Bazar Commercial Hub, Guwahati');
  const [coordinates, setCoordinates] = useState<[number, number]>([91.7425, 26.1839]);
  const [imageUrl, setImageUrl] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { preparing, choosePhoto, handleFileChange } = usePhotoUpload((photo) => {
    setImageUrl(photo);
    setPostError(null);
    setLocationConfirmed(false);
  }, setPostError);

  const handlePostComplaint = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingPost || preparing) return;
    setPostError(null);
    if (!imageUrl) {
      setPostError('Attach or take a photo of the incident.');
      return;
    }
    setSubmittingPost(true);
    try {
      await publishReport({
        caption, description, category, latitude: coordinates[1], longitude: coordinates[0],
        address, imageUrl, locationConfirmed,
      });
      setCaption('');
      setDescription('');
      choosePhoto('');
      onPublished();
    } catch (error) {
      setPostError(errorMessage(error));
    } finally {
      setSubmittingPost(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <form
        id="civic-composer"
        onSubmit={handlePostComplaint}
        className="rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              G
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <span>Guest User</span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Posting Anonymously
                </span>
              </div>
              <div className="text-[10px] text-zinc-600">@guest_user &bull; No sign-in required</div>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase text-zinc-600">Instant Public Publication</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Title, Category, Description */}
          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="quick-caption" className="font-medium text-zinc-800 block mb-1">
                Incident Title / Summary *
              </label>
              <input
                id="quick-caption"
                type="text"
                required
                minLength={3}
                maxLength={160}
                placeholder="e.g., Uncollected plastic waste along Fancy Bazar footpath"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              />
            </div>

            <div>
              <label htmlFor="quick-category" className="font-medium text-zinc-800 block mb-1">
                Category *
              </label>
              <select
                id="quick-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              >
                <option value="garbage_dumping">Garbage Dumping / Open Waste Piles</option>
                <option value="overflowing_bin">Overflowing Municipal Dustbin</option>
                <option value="water_pollution">Polluted River / Waterbody Discharge</option>
                <option value="hazardous_waste">Hazardous Chemical / Battery Waste</option>
                <option value="blocked_drain">Blocked Drain / Canal Obstruction</option>
                <option value="other">Other Environmental Issue</option>
              </select>
            </div>

            <div>
              <label htmlFor="quick-address" className="font-medium text-zinc-800 block mb-1">
                Address / Guwahati Location *
              </label>
              <input
                id="quick-address"
                type="text"
                required
                minLength={3}
                maxLength={300}
                placeholder="e.g., Near SRC Bhaban, Fancy Bazar, Guwahati"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setLocationConfirmed(false); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              />
              {/* Quick Landmark Pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {GUWAHATI_LANDMARKS.map((landmark) => (
                  <button
                    key={landmark.name}
                    type="button"
                    onClick={() => {
                      setAddress(landmark.name);
                      setCoordinates(landmark.coords);
                      setLocationConfirmed(false);
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-700 transition-colors"
                  >
                    {landmark.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="quick-description" className="font-medium text-zinc-800 block mb-1">
                Description (Optional)
              </label>
              <textarea
                id="quick-description"
                maxLength={1000}
                rows={2}
                placeholder="Describe foul odor, overflow duration, or safety hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              />
            </div>
          </div>

          {/* Right Column: Photo Attachment */}
          <div className="space-y-3 text-xs">
            <p className="font-medium text-zinc-800 block">
              Photo Evidence *
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(event) => { event.currentTarget.focus(); setCameraModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all active:scale-95"
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Snap Live Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-medium transition-colors"
              >
                <Upload className="h-4 w-4 text-zinc-600" />
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                aria-label="Attach report photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Sample test photos */}
            {demoStorage && <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-600">Choose a demo image</span>
              <div className="flex flex-wrap gap-1">
                {SAMPLE_PHOTOS.map((photo) => (
                  <button
                    key={photo.label}
                    type="button"
                    onClick={() => choosePhoto(photo.url)}
                    className="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[10px] text-zinc-700"
                  >
                    {photo.label}
                  </button>
                ))}
              </div>
            </div>}
            <p role="status">{preparing ? 'Preparing photo…' : ''}</p>

            {/* Photo Preview */}
            <div className="h-36 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden relative shadow-inner">
              {imageUrl ? (
                <div className="relative w-full h-full group">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => choosePhoto('')}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-zinc-600 text-xs space-y-1">
                  <Camera className="h-5 w-5 mx-auto text-zinc-300" />
                  <span>No image attached</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-zinc-700">
          <input
            type="checkbox" required checked={locationConfirmed}
            onChange={(event) => setLocationConfirmed(event.currentTarget.checked)}
          />
          <span>I confirm the public incident pin ({coordinates[1]}, {coordinates[0]}) and agree to publish this location and photo. I checked the photo for personal information.</span>
        </label>
        <Link href="/complaints/new" className="inline-block text-xs text-emerald-800 underline">Use the map to choose a different pin</Link>
        {postError && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{postError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submittingPost || preparing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            {submittingPost ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Publish as Guest User</span>
              </>
            )}
          </button>
        </div>
      </form>
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={choosePhoto}
        title="Snap Environmental Evidence"
      />
    </>
  );
}
