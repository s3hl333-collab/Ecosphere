import { z } from 'zod';
import { MAX_IMAGE_PAYLOAD_CHARS, SAMPLE_IDS } from './upload-limits';

export const complaintCategoryEnum = z.enum([
  'garbage_dumping',
  'overflowing_bin',
  'water_pollution',
  'hazardous_waste',
  'blocked_drain',
  'other',
]);

export const complaintStatusEnum = z.enum([
  'Reported',
  'Under Review',
  'Resolved',
]);

export const createComplaintSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(3, 'Caption must be at least 3 characters')
    .max(160, 'Caption cannot exceed 160 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  category: complaintCategoryEnum,
  latitude: z
    .number()
    .min(-90)
    .max(90),
  longitude: z
    .number()
    .min(-180)
    .max(180),
  address: z
    .string()
    .trim()
    .min(3, 'Location description must be at least 3 characters')
    .max(300, 'Location description is too long'),
  imageUrl: z
    .string()
    .min(10, 'Attach a photo.')
    .max(MAX_IMAGE_PAYLOAD_CHARS),
  userDisplayName: z
    .string()
    .trim()
    .max(60)
    .optional()
    .default('Guest User'),
  locationConfirmed: z.literal(true),
});

export const commentSchema = z.object({ content: z.string().trim().min(1).max(1000) }).strict();
export const reactionSchema = z.object({ visitorId: z.uuid(), liked: z.boolean() }).strict();

export const wasteCategoryEnum = z.enum([
  'biodegradable',
  'recyclable',
  'non_biodegradable',
  'hazardous',
  'e_waste',
  'sanitary',
]);

export const wasteScanResultSchema = z.object({
  objectName: z.string().trim().min(1).max(160),
  primaryCategory: wasteCategoryEnum,
  secondaryCategory: wasteCategoryEnum.nullish().transform((value) => value ?? undefined),
  materialAttributes: z.array(z.string().max(240)).max(12),
  explanation: z.string().trim().min(5).max(2000),
  disposalInstructions: z.array(z.string().trim().min(1).max(600)).min(1).max(12),
  recyclingConsiderations: z.string().max(1500),
  safetyWarnings: z.array(z.string().max(600)).max(12),
  isHazardous: z.boolean(),
  clarificationNeeded: z.boolean(),
  isDemoAnalysis: z.boolean().optional(),
});

export const scanRequestSchema = z.union([
  z.object({ image: z.string().min(20).max(MAX_IMAGE_PAYLOAD_CHARS) }).strict(),
  z.object({ sample: z.enum(SAMPLE_IDS) }).strict(),
]);

const coordinate = z.string().trim().min(1).pipe(z.coerce.number());
export const constituencyQuerySchema = z.object({
  latitude: coordinate.pipe(z.number().min(-90).max(90)),
  longitude: coordinate.pipe(z.number().min(-180).max(180)),
});
