import { NextResponse } from 'next/server';
import { saveReaction } from '@/lib/complaints';
import { apiError, guardMutation, readJson, RequestError } from '@/lib/http';
import { reactionSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardMutation(request, 'like');
    const parsed = reactionSchema.safeParse(await readJson(request, 512));
    if (!parsed.success) throw new RequestError(400, 'Invalid reaction.');
    const result = await saveReaction((await params).id, parsed.data.visitorId, parsed.data.liked);
    if (!result) throw new RequestError(404, 'Complaint not found.');
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return apiError(error);
  }
}
