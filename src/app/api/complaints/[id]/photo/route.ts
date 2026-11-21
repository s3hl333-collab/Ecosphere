import { findPhoto } from '@/lib/complaints';
import { apiError, RequestError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const photo = await findPhoto((await params).id);
    if (!photo) throw new RequestError(404, 'Photo not found.');
    if (typeof photo === 'string') return Response.redirect(photo, 302);
    return new Response(new Uint8Array(photo), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(photo.byteLength),
        'Cache-Control': 'private, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
