import { NextRequest, NextResponse } from 'next/server';
import { constituencyQuerySchema } from '@/lib/validations';
import { resolveConstituency } from '@/lib/geo';
import { GUWAHATI_CONSTITUENCIES } from '@/data/constituencies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const parseResult = constituencyQuerySchema.safeParse({
      latitude: lat,
      longitude: lng,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates provided',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { latitude, longitude } = parseResult.data;
    const matched = resolveConstituency([longitude, latitude], GUWAHATI_CONSTITUENCIES);

    if (!matched) {
      return NextResponse.json({
        matched: false,
        message: 'Constituency information unavailable for this coordinate.',
      });
    }

    return NextResponse.json({
      matched: true,
      constituencyId: matched.id,
      constituencyName: matched.name,
      district: matched.district,
      prototypeRepresentative: matched.prototypeRepresentative,
      disclaimer: matched.prototypeDisclaimer,
      dataSource: matched.dataSource,
    });
  } catch (error) {
    console.error('API Error in /api/constituency:', error);
    return NextResponse.json(
      { error: 'Internal server error resolving constituency' },
      { status: 500 }
    );
  }
}
