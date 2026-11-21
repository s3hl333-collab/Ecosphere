import { Constituency } from './types';

/**
 * Checks if a point [lng, lat] is inside a polygon [[lng, lat], ...]
 * using the Ray-Casting algorithm.
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point; // x is longitude, y is latitude
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Computes Haversine distance in kilometers between two lat/lng points.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Resolves the constituency for a coordinate strictly using Point-In-Polygon.
 * If not inside any known boundary, returns null.
 */
export function resolveConstituency(
  coordinates: [number, number], // [longitude, latitude]
  constituencies: Constituency[]
): Constituency | null {
  for (const constituency of constituencies) {
    if (isPointInPolygon(coordinates, constituency.boundary)) {
      return constituency;
    }
  }
  return null;
}
