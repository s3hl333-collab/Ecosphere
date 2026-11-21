import { WasteScanResult } from './types';
import { wasteScanResultSchema } from './validations';
import { RequestError } from './http';

const SYSTEM_INSTRUCTION = `You are EcoSphere's senior environmental waste classification intelligence system.
Analyze the provided waste object image carefully.

You must categorize the waste into:
- 'biodegradable' (organic, kitchen scraps, food, paper without plastic coating, garden waste)
- 'recyclable' (clean dry plastics #1-#5, aluminum, tin cans, glass bottles, clean cardboard)
- 'hazardous' (batteries, chemical cleaners, paint, pesticides, toxic residues, mercury bulbs)
- 'e_waste' (circuit boards, cables, phones, peripherals, broken electronics)
- 'sanitary' (diapers, sanitary pads, medical bandages, syringes, tissues)
- 'non_biodegradable' (multilayer snack packaging, plastic wraps, contaminated plastic, residual refuse)

Crucial Safety Instructions:
1. For batteries, chemicals, or medical sharps, ALWAYS classify as 'hazardous' or 'sanitary'. Never suggest throwing in standard bins.
2. Clearly state secondary categories if materials are mixed (e.g., disposable coffee cup has paper exterior and plastic polyethylene lining).
3. Do NOT make up arbitrary numerical confidence percentage scores.
4. Output strictly valid JSON matching this schema:
{
  "objectName": "Identified item name",
  "primaryCategory": "biodegradable" | "recyclable" | "non_biodegradable" | "hazardous" | "e_waste" | "sanitary",
  "secondaryCategory": "biodegradable" | "recyclable" | "non_biodegradable" | "hazardous" | "e_waste" | "sanitary" | null,
  "materialAttributes": ["material 1", "material 2"],
  "explanation": "Detailed concise explanation of why this item belongs to this category",
  "disposalInstructions": ["Step 1", "Step 2"],
  "recyclingConsiderations": "Can it be recycled? How should it be cleaned or separated?",
  "safetyWarnings": ["Warning 1 if applicable"],
  "isHazardous": true/false,
  "clarificationNeeded": true/false
}`;

export async function analyzeWasteImage(photo: Buffer, signal: AbortSignal): Promise<WasteScanResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new RequestError(503, 'Live photo analysis is unavailable. Try a labeled demo sample.');
  const model = encodeURIComponent(process.env.GEMINI_MODEL || 'gemini-3.5-flash');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ inlineData: { data: photo.toString('base64'), mimeType: 'image/jpeg' } }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
        }),
      }
    );
    if (!response.ok) {
      console.warn('Gemini request failed with HTTP status', response.status);
      throw new Error('Provider request failed');
    }
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const content = payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought)
      .map((part) => part.text ?? '').join('');
    return { ...wasteScanResultSchema.parse(JSON.parse(content ?? '')), isDemoAnalysis: false };
  } catch {
    throw new RequestError(502, 'Photo analysis is temporarily unavailable. Please try again.');
  }
}

/**
 * Deterministic fallback analysis for demonstration and testing when GEMINI_API_KEY is not configured.
 * Clearly labeled as synthetic demonstration analysis.
 */
export function getDemoClassification(sampleIdentifier?: string): WasteScanResult {
  const id = (sampleIdentifier || '').toLowerCase();

  if (id.includes('battery') || id.includes('cell') || id.includes('alkaline')) {
    return {
      objectName: 'Lithium / Alkaline Household Battery',
      primaryCategory: 'hazardous',
      secondaryCategory: 'e_waste',
      materialAttributes: ['Heavy metals (Lead/Cadmium/Lithium)', 'Steel casing', 'Electrolyte gel'],
      explanation:
        'Batteries contain toxic heavy metals and corrosive electrolytes that cause severe soil and groundwater contamination if disposed of in landfills.',
      disposalInstructions: [
        'Tape both terminal ends with non-conductive electrical tape.',
        'Store in a cool, dry plastic container away from flammable materials.',
        'Deposit at an authorized municipal e-waste collection centre or hazardous battery drop box.',
      ],
      recyclingConsiderations:
        'Specialized pyrometallurgical or hydrometallurgical recycling recovers valuable nickel, cobalt, and lithium.',
      safetyWarnings: [
        'DANGER: Do NOT puncture, crush, or incinerate. Risk of thermal runaway and fire.',
        'Never dispose of in regular biodegradable or non-biodegradable municipal dustbins.',
      ],
      isHazardous: true,
      clarificationNeeded: false,
      isDemoAnalysis: true,
    };
  }

  if (id.includes('bottle') || id.includes('plastic') || id.includes('pet')) {
    return {
      objectName: 'Polyethylene Terephthalate (PET) Beverage Bottle',
      primaryCategory: 'recyclable',
      secondaryCategory: 'non_biodegradable',
      materialAttributes: ['Type 1 PET Plastic', 'High tensile polymer', 'HDPE cap'],
      explanation:
        'PET plastic is a 100% recyclable thermoplastic widely accepted by mechanical recycling facilities for conversion into rPET flakes and polyester fiber.',
      disposalInstructions: [
        'Empty all residual liquid completely.',
        'Rinse lightly with graywater if sticky.',
        'Crush the bottle flat to conserve collection volume and replace the cap loosely.',
        'Place into the designated BLUE non-biodegradable / dry recyclables bin.',
      ],
      recyclingConsiderations:
        'Highly recyclable. Caps are often made of PP/HDPE and should be recycled together.',
      safetyWarnings: [],
      isHazardous: false,
      clarificationNeeded: false,
      isDemoAnalysis: true,
    };
  }

  if (id.includes('banana') || id.includes('fruit') || id.includes('vegetable') || id.includes('food') || id.includes('organic')) {
    return {
      objectName: 'Organic Kitchen Biomass (Fruit / Vegetable Discards)',
      primaryCategory: 'biodegradable',
      materialAttributes: ['Organic moisture', 'Cellulose fiber', 'Nitrogenous compostable matter'],
      explanation:
        'Natural kitchen discards decompose aerobically within 2 to 6 weeks, providing vital nutrients for vermicomposting and biogas generation.',
      disposalInstructions: [
        'Separate from plastic bags or cling wrap wrappers.',
        'Deposit into the GREEN biodegradable dustbin or home compost composter.',
        'Keep dry to avoid premature foul anaerobic leachate.',
      ],
      recyclingConsiderations:
        'Convertible into high-grade organic manure or methane biogas.',
      safetyWarnings: [],
      isHazardous: false,
      clarificationNeeded: false,
      isDemoAnalysis: true,
    };
  }

  if (id.includes('medicine') || id.includes('syringe') || id.includes('bandage') || id.includes('sanitary')) {
    return {
      objectName: 'Used Medical Syringe',
      primaryCategory: 'sanitary',
      secondaryCategory: 'hazardous',
      materialAttributes: ['Sharp metal needle', 'Plastic syringe body'],
      explanation:
        'Sanitary and biomedical waste carries biological pathogens that pose serious public health risks to sanitation workers and scavenging animals.',
      disposalInstructions: [
        'Avoid handling the needle or trying to recap it.',
        'Ask your local health facility or authorized waste collector about safe sharps collection.',
      ],
      recyclingConsiderations: 'Keep sharps out of household recycling.',
      safetyWarnings: [
        'Never flush down toilets or discard in open water channels.',
        'Do not mix with organic composting waste.',
      ],
      isHazardous: true,
      clarificationNeeded: false,
      isDemoAnalysis: true,
    };
  }

  // General fallback for sample packaging / miscellaneous items
  return {
    objectName: 'Multilayer Metalized Plastic Packaging (Chip / Biscuit Pouch)',
    primaryCategory: 'non_biodegradable',
    secondaryCategory: 'recyclable',
    materialAttributes: ['Biaxially-oriented polypropylene (BOPP)', 'Vaporized aluminum barrier film'],
    explanation:
      'Multilayer plastics feature bonded layers of plastic and aluminum film, rendering traditional single-stream mechanical recycling challenging without advanced chemical pyrolysis.',
    disposalInstructions: [
      'Clean out all food residues.',
      'Deposit in the dry waste / non-biodegradable blue bin.',
      'Can be routed to authorized cement kilns for energy recovery (RDF) or road-surfacing plastic composite.',
    ],
    recyclingConsiderations:
      'Not easily recyclable via standard municipal shredding; requires specialized Refuse-Derived Fuel (RDF) processing.',
    safetyWarnings: [
      'Do not burn in open air. Open combustion emits harmful dioxins and toxic fumes.',
    ],
    isHazardous: false,
    clarificationNeeded: false,
    isDemoAnalysis: true,
  };
}
