import { IMAGE_TYPES, MAX_UPLOAD_BYTES } from './upload-limits';

export function captureJpeg(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, 1200 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Photo processing is unavailable in this browser.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function preparePhoto(file: File) {
  if (!IMAGE_TYPES.some((type) => type === file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP photo.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a photo under 10 MiB.');

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 50_000_000) {
      throw new Error('This photo is too large to process.');
    }
    const jpeg = captureJpeg(image, image.naturalWidth, image.naturalHeight);
    if ((jpeg.length - 23) * 0.75 > MAX_UPLOAD_BYTES) throw new Error('Processed photo exceeds 2 MiB.');
    return jpeg;
  } finally {
    URL.revokeObjectURL(url);
  }
}
