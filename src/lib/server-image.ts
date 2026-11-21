import sharp from 'sharp';
import { RequestError } from './http';
import { MAX_UPLOAD_BYTES } from './upload-limits';

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_PIXELS = 16_000_000;
let activeTransforms = 0;

export async function normalizeImage(dataUrl: string): Promise<Buffer> {
  const match = DATA_URL.exec(dataUrl);
  const invalid = () => new RequestError(400, 'Upload a valid JPEG, PNG, or WebP photo.');
  if (!match || match[2].length % 4 !== 0) throw invalid();

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_UPLOAD_BYTES) throw new RequestError(413, 'Photo exceeds the 2 MiB upload limit.');
  if (activeTransforms >= 3) throw new RequestError(429, 'Image processing is busy. Try again shortly.');
  activeTransforms++;
  try {
    const image = sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'warning' });
    const metadata = await image.metadata();
    if (metadata.format !== match[1] || (metadata.pages ?? 1) > 1) throw invalid();
    // Re-encoding strips EXIF location data and any trailing contents.
    return await image.rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw invalid();
  } finally {
    activeTransforms--;
  }
}
