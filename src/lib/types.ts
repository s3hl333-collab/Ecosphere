// Core Domain Types for EcoSphere

export type WasteCategory =
  | 'biodegradable'
  | 'recyclable'
  | 'non_biodegradable'
  | 'hazardous'
  | 'e_waste'
  | 'sanitary';

export type BinCategory = 'biodegradable' | 'non_biodegradable';

export interface WasteBin {
  id: string;
  category: BinCategory;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  capacityLiters: number;
  fillStatus: 'empty' | 'normal' | 'near_full' | 'full';
  verifiedBy: string;
  isDemo: boolean;
  lastVerifiedAt: string;
}

export type FacilityType =
  | 'material_recovery_facility'
  | 'scrap_dealer'
  | 'e_waste_center'
  | 'compost_plant';

export interface RecyclingFacility {
  id: string;
  name: string;
  facilityType: FacilityType;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  acceptedCategories: string[];
  operatingHours: string;
  contactPhone?: string;
  verificationStatus: 'verified' | 'prototype' | 'pending';
  isDemo: boolean;
  dataSource: string;
}

export type WaterbodyType = 'river' | 'lake' | 'wetland' | 'channel';
export type PollutionLevel = 'critical' | 'severe' | 'moderate' | 'monitored';

export interface Waterbody {
  id: string;
  name: string;
  waterbodyType: WaterbodyType;
  coordinates: [number, number]; // [longitude, latitude]
  polylineCoordinates?: [number, number][]; // for rivers/channels
  pollutionLevel: PollutionLevel;
  primaryPollutants: string[];
  dissolvedOxygenMgL?: number;
  bodMgL?: number;
  dataSource: string;
  isDemo: boolean;
  lastTestedAt: string;
}

export type AQICategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface AQIMeasurement {
  id: string;
  stationName: string;
  coordinates: [number, number]; // [longitude, latitude]
  aqiValue: number;
  aqiScale: string; // e.g. "Indian National AQI (NAQI)"
  category: AQICategory;
  pm25?: number;
  pm10?: number;
  dominantPollutant: string;
  sourceLabel: string;
  isDemo: boolean;
  measuredAt: string;
}

export type TrafficCongestion = 'low' | 'moderate' | 'heavy' | 'severe';

export interface TrafficObservation {
  id: string;
  roadName: string;
  coordinates: [number, number][]; // line segment coordinates
  congestionLevel: TrafficCongestion;
  averageSpeedKmh: number;
  emissionImpact?: string;
  airPollutionIndex?: 'Low' | 'Moderate' | 'High' | 'Severe';
  isDemo: boolean;
  updatedAt: string;
}

export interface Constituency {
  id: string;
  name: string;
  state: string;
  district: string;
  boundary: [number, number][]; // polygon coordinates [[lng, lat], ...]
  prototypeRepresentative: string;
  prototypeDisclaimer: string;
  dataSource: string;
}

export type ComplaintCategory =
  | 'garbage_dumping'
  | 'overflowing_bin'
  | 'water_pollution'
  | 'hazardous_waste'
  | 'blocked_drain'
  | 'other';

export type ComplaintStatus = 'Reported' | 'Under Review' | 'Resolved';

export interface ComplaintComment {
  id: string;
  complaintId: string;
  authorName: string;
  authorHandle?: string;
  authorRole?: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId?: string;
  userDisplayName: string;
  userHandle?: string;
  userRole?: string;
  userAvatarUrl?: string;
  caption: string;
  description?: string;
  category: ComplaintCategory;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  imageUrl: string;
  constituencyId?: string;
  constituencyName?: string;
  prototypeRepresentative?: string;
  status: ComplaintStatus;
  statusUpdatedAt?: string;
  likesCount?: number;
  commentsCount?: number;
  comments?: ComplaintComment[];
  createdAt: string;
}

export interface WasteScanResult {
  objectName: string;
  primaryCategory: WasteCategory;
  secondaryCategory?: WasteCategory;
  materialAttributes: string[];
  explanation: string;
  disposalInstructions: string[];
  recyclingConsiderations: string;
  safetyWarnings: string[];
  isHazardous: boolean;
  clarificationNeeded: boolean;
  isDemoAnalysis?: boolean;
}
