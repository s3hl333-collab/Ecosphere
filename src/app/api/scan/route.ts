import { NextResponse } from 'next/server';
import { apiError, guardMutation, readJson, RequestError } from '@/lib/http';
import { analyzeWasteImage, getDemoClassification } from '@/lib/gemini';
import { normalizeImage } from '@/lib/server-image';
import { MAX_UPLOAD_JSON_BYTES } from '@/lib/upload-limits';
import { scanRequestSchema } from '@/lib/validations';

export const runtime = 'nodejs';
let activeScans = 0;

export async function POST(request: Request) {
  try {
    guardMutation(request, 'scan');
    const parsed = scanRequestSchema.safeParse(await readJson(request, MAX_UPLOAD_JSON_BYTES));
    if (!parsed.success) throw new RequestError(400, 'Provide a supported photo or select a demo sample.');
    if ('sample' in parsed.data) {
      return NextResponse.json({ success: true, data: getDemoClassification(parsed.data.sample) });
    }
    if (activeScans >= 3) throw new RequestError(429, 'Photo analysis is busy. Try again shortly.');
    activeScans++;
    try {
      const photo = await normalizeImage(parsed.data.image);
      const data = await analyzeWasteImage(photo, request.signal);
      return NextResponse.json({ success: true, data });
    } finally {
      activeScans--;
    }
  } catch (error) {
    return apiError(error);
  }
}
