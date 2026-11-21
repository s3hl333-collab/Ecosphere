import { describe, it, expect } from 'vitest';
import { isPointInPolygon, calculateDistanceKm, resolveConstituency } from '../lib/geo';
import { GUWAHATI_CONSTITUENCIES } from '../data/constituencies';

describe('GIS and Geolocation Utilities', () => {
  it('correctly detects if a coordinate is inside a polygon using Ray-Casting', () => {
    // Polygon around Guwahati center approx [91.70, 26.15] to [91.80, 26.20]
    const polygon: [number, number][] = [
      [91.70, 26.15],
      [91.80, 26.15],
      [91.80, 26.20],
      [91.70, 26.20],
      [91.70, 26.15],
    ];

    // Inside
    expect(isPointInPolygon([91.75, 26.18], polygon)).toBe(true);

    // Outside (far away)
    expect(isPointInPolygon([91.60, 26.10], polygon)).toBe(false);
  });

  it('calculates accurate Haversine distance in kilometers', () => {
    // Distance between Pan Bazar (26.1882, 91.7485) and Dispur (26.1415, 91.7892)
    const distance = calculateDistanceKm(26.1882, 91.7485, 26.1415, 91.7892);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(12);
  });

  it('resolves the correct Guwahati Assembly Constituency via Point-in-Polygon', () => {
    // Jalukbari campus point [91.6621, 26.1524]
    const jalukbari = resolveConstituency([91.6621, 26.1524], GUWAHATI_CONSTITUENCIES);
    expect(jalukbari).not.toBeNull();
    expect(jalukbari?.id).toBe('jalukbari');
    expect(jalukbari?.prototypeRepresentative).toContain('Jalukbari');

    // Dispur point [91.7892, 26.1415]
    const dispur = resolveConstituency([91.7892, 26.1415], GUWAHATI_CONSTITUENCIES);
    expect(dispur).not.toBeNull();
    expect(dispur?.id).toBe('dispur');
  });

  it('returns null when a coordinate is outside all known constituency polygons', () => {
    // Coordinate far outside Guwahati (e.g. Delhi coords)
    const outside = resolveConstituency([77.2090, 28.6139], GUWAHATI_CONSTITUENCIES);
    expect(outside).toBeNull();
  });
});
