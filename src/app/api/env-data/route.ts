import { NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';
import { listComplaints } from '@/lib/complaints';
import { apiError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = getStore();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      region: 'Guwahati, Assam, India',
      data: {
        wasteBins: store.getWasteBins(),
        recyclingFacilities: store.getRecyclingFacilities(),
        waterbodies: store.getWaterbodies(),
        aqiStations: store.getAQIStations(),
        trafficObservations: store.getTrafficObservations(),
        complaints: await listComplaints({ limit: 100 }),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
