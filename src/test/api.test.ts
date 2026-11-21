import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GET as feed, POST as report } from '@/app/api/complaints/route';
import { GET as photo } from '@/app/api/complaints/[id]/photo/route';
import { GET as comments, POST as comment } from '@/app/api/complaints/[id]/comments/route';
import { POST as react } from '@/app/api/complaints/[id]/like/route';
import { POST as scan } from '@/app/api/scan/route';
import { GET as envData } from '@/app/api/env-data/route';
import { readJson } from '@/lib/http';
import { constituencyQuerySchema } from '@/lib/validations';

function json(payload: unknown, headers?: HeadersInit) {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

let imageUrl: string;
beforeAll(async () => {
  const buffer = await sharp({ create: { width: 12, height: 12, channels: 3, background: '#333333' } })
    .withMetadata().jpeg().toBuffer();
  imageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const fields = {
  caption: 'Broken municipal rubbish bin', address: 'Pan Bazar', category: 'overflowing_bin',
  latitude: 26.1882, longitude: 91.7485, userDisplayName: 'City volunteer', locationConfirmed: true,
};

describe('Civic API workflow', () => {
  it('publishes a normalized photo, shows it in the feed and map, and supports comments and reactions', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const created = await report(json({ ...fields, userRole: 'Moderator', imageUrl }));
    expect(created.status).toBe(201);
    const { data } = await created.json();
    expect(data.userRole).toBe('Guest Contributor');
    expect(data.imageUrl).toMatch(/^\/api\/complaints\/.+\/photo$/);
    const route = { params: Promise.resolve({ id: data.id }) };

    const asset = await photo(new Request('http://localhost/photo'), route);
    expect(asset.headers.get('content-type')).toBe('image/jpeg');
    const metadata = await sharp(Buffer.from(await asset.arrayBuffer())).metadata();
    expect(metadata.exif).toBeUndefined();

    const response = await feed(new Request('http://localhost/api/complaints?category=overflowing_bin&q=broken%20municipal'));
    expect((await response.json()).data).toEqual([expect.objectContaining({ id: data.id, imageUrl: data.imageUrl })]);
    expect((await (await envData()).json()).data.complaints).toContainEqual(expect.objectContaining({ id: data.id }));

    expect((await comment(json({ content: 'A useful update', authorRole: 'Admin' }), route)).status).toBe(400);
    expect((await comment(json({ content: ' A useful update ' }), route)).status).toBe(201);
    const thread = await comments(new Request('http://localhost/comments'), route);
    expect((await thread.json()).data[0]).toMatchObject({ content: 'A useful update', authorRole: 'Guest Contributor' });

    const visitorId = randomUUID();
    for (const [liked, likesCount] of [[true, 1], [true, 1], [false, 0], [false, 0]] as const) {
      const reaction = await react(json({ visitorId, liked }), route);
      expect((await reaction.json()).data).toEqual({ isLiked: liked, likesCount });
    }
  });

  it('rejects missing consent, remote photos, and mismatched media', async () => {
    expect((await report(json({ ...fields, locationConfirmed: false, imageUrl }))).status).toBe(400);
    expect((await report(json({ ...fields, imageUrl: 'https://example.test/report.jpg' }))).status).toBe(400);
    expect((await report(json({ ...fields, imageUrl: imageUrl.replace('image/jpeg', 'image/png') }))).status).toBe(400);
  });

  it('returns a failure when configured cloud storage rejects a write', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://storage.example.test');
    const upstream = vi.fn(async () => new Response(
      JSON.stringify({ message: 'database rejected write', code: '23514' }), { status: 400 },
    ));
    vi.stubGlobal('fetch', upstream);
    const response = await report(json({ ...fields, imageUrl, caption: 'Cloud failure marker' }));
    expect(response.status).toBe(500);
    expect(upstream).toHaveBeenCalledOnce();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const results = await feed(new Request('http://localhost/api/complaints?q=Cloud+failure+marker'));
    expect((await results.json()).data).toHaveLength(0);
  });
});

describe('Request and scanner protections', () => {
  it('rejects oversize chunked bodies without a declared length', async () => {
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(9)); controller.close(); },
    });
    await expect(readJson({
      body: stream,
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Request, 8)).rejects.toMatchObject({ status: 413 });
  });

  it('distinguishes invalid JSON, media types, and cross-origin writes', async () => {
    const malformed = new Request('http://localhost/api', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    });
    expect((await scan(malformed)).status).toBe(400);
    expect((await scan(new Request('http://localhost/api', { method: 'POST', body: 'text' }))).status).toBe(415);
    expect((await scan(json({ sample: 'battery' }, { Origin: 'https://other.example.test' }))).status).toBe(403);
  });

  it('provides explicit demos and returns errors for real photos when analysis is unavailable', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const demo = await scan(json({ sample: 'battery' }));
    expect((await demo.json()).data).toMatchObject({ isDemoAnalysis: true, primaryCategory: 'hazardous' });
    expect((await scan(json({ image: imageUrl }))).status).toBe(503);
    vi.stubEnv('GEMINI_API_KEY', 'fake-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })));
    expect((await scan(json({ image: imageUrl }))).status).toBe(502);
  });

  it('renders a validated provider classification as live analysis', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'fake-key');
    const classification = {
      objectName: 'Bottle',
      primaryCategory: 'recyclable',
      secondaryCategory: null,
      materialAttributes: ['Glass'],
      explanation: 'Glass can be recycled.',
      disposalInstructions: ['Check your local collection rules.'],
      recyclingConsiderations: 'Keep intact bottles separate from broken glass.',
      safetyWarnings: [],
      isHazardous: false,
      clarificationNeeded: false,
    };
    const provider = vi.fn(async () => Response.json({
      candidates: [{ content: { parts: [{ text: JSON.stringify(classification) }] } }],
    }));
    vi.stubGlobal('fetch', provider);
    const response = await scan(json({ image: imageUrl }));
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ objectName: 'Bottle', isDemoAnalysis: false });
    expect(provider).toHaveBeenCalledWith(expect.stringContaining('https://generativelanguage.googleapis.com/'), expect.objectContaining({
      method: 'POST', redirect: 'error',
    }));
  });

  it('rejects missing coordinates while allowing explicit zeroes', () => {
    expect(constituencyQuerySchema.safeParse({ latitude: null, longitude: '' }).success).toBe(false);
    expect(constituencyQuerySchema.parse({ latitude: '0', longitude: '0' })).toEqual({ latitude: 0, longitude: 0 });
  });
});
