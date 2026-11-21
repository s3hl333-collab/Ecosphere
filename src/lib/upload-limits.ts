export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_PAYLOAD_CHARS = 32 + Math.ceil(MAX_UPLOAD_BYTES / 3) * 4;
export const MAX_UPLOAD_JSON_BYTES = MAX_IMAGE_PAYLOAD_CHARS + 8192;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const SAMPLE_IDS = ['battery', 'bottle', 'fruit', 'syringe', 'wrapper'] as const;
export const DEMO_PHOTO_IDS = [
  'photo-1605600659908-0ef719419d41',
  'photo-1530587191325-3db32d826c18',
  'photo-1550989460-0adf9ea622e2',
  'photo-1611288870280-4a87a22a36b3',
] as const;

export function isDemoPhoto(value: string): boolean {
  if (value.length > 250) return false;
  return DEMO_PHOTO_IDS.some(
    (id) => value === `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`
  );
}
