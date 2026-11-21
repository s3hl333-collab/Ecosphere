import { NextResponse } from 'next/server';

export class RequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof RequestError) {
    return NextResponse.json({ error: error.message }, {
      status: error.status,
      headers: error.status === 429 ? { 'Retry-After': '60' } : undefined,
    });
  }
  // SDK errors may include request payloads, URLs, or credentials.
  console.error('EcoSphere request failed', error instanceof Error ? error.name : 'Unknown error');
  return NextResponse.json({ error: 'The request could not be completed.' }, { status: 500 });
}

export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new RequestError(415, 'Expected a JSON request.');
  const tooLarge = () => new RequestError(413, 'Request exceeds the upload limit.');
  if (Number(request.headers.get('content-length')) > maxBytes) throw tooLarge();
  if (!request.body) throw new RequestError(400, 'JSON request body required.');

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  const chunks: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw tooLarge();
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return JSON.parse(chunks.join('')) as unknown;
  } catch (error) {
    void reader.cancel().catch(() => {});
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, 'Malformed JSON request.');
  } finally {
    reader.releaseLock();
  }
}

type Operation = 'report' | 'scan' | 'comment' | 'like';
const limits: Record<Operation, number> = { report: 20, scan: 30, comment: 60, like: 120 };
const windows = new Map<Operation, { expiresAt: number; count: number }>();

export function guardMutation(request: Request, operation: Operation) {
  // JSON endpoints require a preflight cross-origin. Reject cross-site browser writes as well.
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' ||
      (fetchSite !== 'same-origin' && origin && origin !== new URL(request.url).origin && origin !== allowedOrigin)) {
    throw new RequestError(403, 'Cross-origin requests are not allowed.');
  }

  // Fixed-size, per-process backstop. Deploy a shared per-client limit at the edge.
  const now = Date.now();
  let window = windows.get(operation);
  if (!window || window.expiresAt <= now) {
    window = { expiresAt: now + 60_000, count: 0 };
    windows.set(operation, window);
  }
  if (window.count >= limits[operation]) throw new RequestError(429, 'Too many requests. Try again shortly.');
  window.count++;
}
