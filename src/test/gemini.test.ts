import { describe, it, expect } from 'vitest';
import { getDemoClassification } from '../lib/gemini';
import { wasteScanResultSchema } from '../lib/validations';

describe('AI Waste Analysis Adapter & Fallbacks', () => {
  it('identifies batteries as hazardous waste with appropriate safety warnings', () => {
    const batteryResult = getDemoClassification('household aa battery');

    expect(batteryResult.primaryCategory).toBe('hazardous');
    expect(batteryResult.isHazardous).toBe(true);
    expect(batteryResult.safetyWarnings.length).toBeGreaterThan(0);
    expect(batteryResult.isDemoAnalysis).toBe(true);

    // Validates against Zod schema
    const validation = wasteScanResultSchema.safeParse(batteryResult);
    expect(validation.success).toBe(true);
  });

  it('classifies organic discards as biodegradable with composting guidelines', () => {
    const organicResult = getDemoClassification('banana peels and vegetable discards');

    expect(organicResult.primaryCategory).toBe('biodegradable');
    expect(organicResult.isHazardous).toBe(false);
    expect(organicResult.disposalInstructions.some((i) => i.toLowerCase().includes('green'))).toBe(true);
  });

  it('classifies plastics and beverage bottles into recyclable stream', () => {
    const bottleResult = getDemoClassification('plastic mineral water bottle');

    expect(bottleResult.primaryCategory).toBe('recyclable');
    expect(bottleResult.disposalInstructions.some((i) => i.toLowerCase().includes('blue'))).toBe(true);
  });

  it('classifies syringes as sanitary and biohazard waste', () => {
    const medicalResult = getDemoClassification('used syringe and medical bandage');

    expect(medicalResult.primaryCategory).toBe('sanitary');
    expect(medicalResult.isHazardous).toBe(true);
  });
});
