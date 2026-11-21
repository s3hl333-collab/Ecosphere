import { describe, it, expect } from 'vitest';
import {
  createComplaintSchema,
  scanRequestSchema,
  wasteScanResultSchema,
} from '../lib/validations';

describe('Validation Schemas (Zod)', () => {
  it('validates a correct complaint submission payload', () => {
    const validPayload = {
      caption: 'Severe waste dumping near Bharalu channel',
      description: 'Multiple sacks of garbage left uncollected for days.',
      category: 'garbage_dumping',
      latitude: 26.1741,
      longitude: 91.7342,
      address: 'Bharalumukh Channel Bridge, Guwahati',
      imageUrl: 'https://example.com/waste.jpg',
      userDisplayName: 'Concerned Citizen',
      locationConfirmed: true,
    };

    const result = createComplaintSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects complaint submission with short caption or invalid coordinates', () => {
    const invalidPayload = {
      caption: 'No', // too short (<3)
      category: 'garbage_dumping',
      latitude: 105, // out of range (>90)
      longitude: 91.7342,
      address: 'Guwahati',
      imageUrl: 'https://example.com/waste.jpg',
    };

    const result = createComplaintSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('rejects complaint with unsupported category', () => {
    const invalidPayload = {
      caption: 'Valid caption description',
      category: 'unsupported_category_name',
      latitude: 26.18,
      longitude: 91.74,
      address: 'Pan Bazar',
      imageUrl: 'https://example.com/photo.jpg',
    };

    const result = createComplaintSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('validates waste scanner input requests', () => {
    const validScan = {
      image: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
    expect(scanRequestSchema.safeParse(validScan).success).toBe(true);

    const invalidMime = {
      image: 'some_base64_string_here_with_sufficient_length',
      mimeType: 'application/pdf', // invalid mime
    };
    expect(scanRequestSchema.safeParse(invalidMime).success).toBe(false);
  });

  it('rejects whitespace-only titles and requires location confirmation', () => {
    const fields = {
      category: 'other', latitude: 26, longitude: 91, address: 'Market',
      imageUrl: 'https://example.com/test.jpg',
    };
    expect(createComplaintSchema.safeParse({ ...fields, caption: '   ', locationConfirmed: true }).success).toBe(false);
    expect(createComplaintSchema.safeParse({ ...fields, caption: 'Valid title' }).success).toBe(false);
  });

  it('keeps explicit demos separate from image requests', () => {
    expect(scanRequestSchema.safeParse({ sample: 'battery' }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ sample: 'made-up' }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ image: 'long image string goes here', sample: 'battery' }).success).toBe(false);
  });

  it('validates structured AI waste scan outputs correctly', () => {
    const validScanResult = {
      objectName: 'PET Drink Bottle',
      primaryCategory: 'recyclable',
      secondaryCategory: 'non_biodegradable',
      materialAttributes: ['Polyethylene terephthalate'],
      explanation: 'Thermoplastic suitable for mechanical recycling.',
      disposalInstructions: ['Rinse and place in blue bin.'],
      recyclingConsiderations: 'Highly recyclable into rPET fiber.',
      safetyWarnings: [],
      isHazardous: false,
      clarificationNeeded: false,
    };

    const parseResult = wasteScanResultSchema.safeParse(validScanResult);
    expect(parseResult.success).toBe(true);
  });
});
