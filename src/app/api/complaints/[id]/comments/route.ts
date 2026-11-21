import { NextResponse } from 'next/server';
import { listComments, saveComment } from '@/lib/complaints';
import { apiError, guardMutation, readJson, RequestError } from '@/lib/http';
import { commentSchema } from '@/lib/validations';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: Context) {
  try {
    const data = await listComments((await params).id);
    if (!data) throw new RequestError(404, 'Complaint not found.');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    guardMutation(request, 'comment');
    const parsed = commentSchema.safeParse(await readJson(request, 8192));
    if (!parsed.success) throw new RequestError(400, 'Enter a comment of 1–1,000 characters.');
    const data = await saveComment((await params).id, parsed.data.content);
    if (!data) throw new RequestError(404, 'Complaint not found.');
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
