import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GUWAHATI_CONSTITUENCIES } from '@/data/constituencies';
import { FEED_PAGE_SIZE, isDemoStorage, listComplaints, photoPath, saveComplaint } from '@/lib/complaints';
import { resolveConstituency } from '@/lib/geo';
import { apiError, guardMutation, readJson, RequestError } from '@/lib/http';
import { normalizeImage } from '@/lib/server-image';
import { isDemoPhoto, MAX_UPLOAD_JSON_BYTES } from '@/lib/upload-limits';
import { complaintCategoryEnum, complaintStatusEnum, createComplaintSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const filterSchema = z.object({
  category: complaintCategoryEnum.optional(),
  status: complaintStatusEnum.optional(),
  q: z.string().trim().max(100).optional(),
  offset: z.string().regex(/^\d{1,6}$/).transform(Number).optional().default(0),
});

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const parsed = filterSchema.safeParse({
      category: params.get('category') === 'all' ? undefined : params.get('category') ?? undefined,
      status: params.get('status') === 'all' ? undefined : params.get('status') ?? undefined,
      q: params.get('q') ?? undefined,
      offset: params.get('offset') ?? undefined,
    });
    if (!parsed.success) throw new RequestError(400, 'Invalid feed filters.');
    const { category, status, q: search, offset } = parsed.data;
    const results = await listComplaints({ category, status, search, offset, limit: FEED_PAGE_SIZE + 1 });
    const data = results.slice(0, FEED_PAGE_SIZE);
    return NextResponse.json({
      success: true, count: data.length, data, demo: isDemoStorage(),
      nextOffset: results.length > FEED_PAGE_SIZE ? offset + FEED_PAGE_SIZE : null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    guardMutation(request, 'report');
    const parsed = createComplaintSchema.safeParse(await readJson(request, MAX_UPLOAD_JSON_BYTES));
    if (!parsed.success) throw new RequestError(400, parsed.error.issues[0].message);

    const data = parsed.data;
    const id = randomUUID();
    const sample = isDemoStorage() && isDemoPhoto(data.imageUrl);
    const photo = sample ? undefined : await normalizeImage(data.imageUrl);
    const coordinates: [number, number] = [data.longitude, data.latitude];
    const matched = resolveConstituency(coordinates, GUWAHATI_CONSTITUENCIES);
    const complaint = await saveComplaint({
      id,
      userDisplayName: data.userDisplayName || 'Guest User',
      userRole: 'Guest Contributor',
      caption: data.caption,
      description: data.description,
      category: data.category,
      coordinates,
      address: data.address,
      imageUrl: sample ? data.imageUrl : photoPath(id),
      constituencyId: matched?.id,
      constituencyName: matched?.name,
      prototypeRepresentative: matched?.prototypeRepresentative,
      status: 'Reported',
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    }, photo);
    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
