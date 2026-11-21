import { randomUUID } from 'node:crypto';
import {
  Complaint,
  ComplaintComment,
  WasteBin,
  RecyclingFacility,
  Waterbody,
  AQIMeasurement,
  TrafficObservation,
} from './types';
import {
  INITIAL_COMPLAINTS,
  SEED_WASTE_BINS,
  SEED_RECYCLING_FACILITIES,
  SEED_WATERBODIES,
  SEED_AQI_STATIONS,
  SEED_TRAFFIC_OBSERVATIONS,
} from '../data/seedData';

// In-memory persistent store for development & demo fallback
class InMemoryStore {
  private complaints: Complaint[] = structuredClone(INITIAL_COMPLAINTS)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  private reactions = new Map<string, Set<string>>();
  private photos = new Map<string, Buffer>();
  private wasteBins: WasteBin[] = [...SEED_WASTE_BINS];
  private recyclingFacilities: RecyclingFacility[] = [...SEED_RECYCLING_FACILITIES];
  private waterbodies: Waterbody[] = [...SEED_WATERBODIES];
  private aqiStations: AQIMeasurement[] = [...SEED_AQI_STATIONS];
  private trafficObservations: TrafficObservation[] = [...SEED_TRAFFIC_OBSERVATIONS];

  getComplaints(): Complaint[] {
    return [...this.complaints];
  }

  getComplaintById(id: string): Complaint | undefined {
    return this.complaints.find((c) => c.id === id);
  }

  addComplaint(complaint: Complaint, photo?: Buffer): Complaint {
    const enriched: Complaint = {
      ...complaint,
      likesCount: complaint.likesCount ?? 0,
      commentsCount: complaint.commentsCount ?? 0,
      comments: complaint.comments ?? [],
      userRole: complaint.userRole || 'Guest User',
      userHandle: complaint.userHandle || '@guest_user',
    };
    this.complaints.unshift(enriched);
    if (photo) this.photos.set(complaint.id, photo);
    return enriched;
  }

  getPhoto(id: string) {
    return this.photos.get(id);
  }

  setReaction(id: string, visitorId: string, liked: boolean) {
    const complaint = this.getComplaintById(id);
    if (!complaint) return null;
    let visitors = this.reactions.get(id);
    if (!visitors) {
      visitors = new Set();
      this.reactions.set(id, visitors);
    }
    const wasLiked = visitors.has(visitorId);
    if (liked === wasLiked) return { likesCount: complaint.likesCount ?? 0, isLiked: liked };
    if (liked && visitors.size >= 2000) return { likesCount: complaint.likesCount ?? 0, isLiked: false };
    if (liked) visitors.add(visitorId);
    else visitors.delete(visitorId);
    complaint.likesCount = (complaint.likesCount ?? 0) + (liked ? 1 : -1);
    return { likesCount: complaint.likesCount, isLiked: liked };
  }

  addComment(
    id: string,
    commentData: {
      authorName: string;
      authorRole?: string;
      authorHandle?: string;
      authorAvatarUrl?: string;
      content: string;
    }
  ): ComplaintComment | null {
    const complaint = this.complaints.find((c) => c.id === id);
    if (!complaint) return null;
    if (!complaint.comments) complaint.comments = [];

    const newComment: ComplaintComment = {
      id: randomUUID(),
      complaintId: id,
      authorName: commentData.authorName || 'Guest Contributor',
      authorHandle: commentData.authorHandle || '@guest_user',
      authorRole: commentData.authorRole || 'Guest User',
      authorAvatarUrl: commentData.authorAvatarUrl,
      content: commentData.content,
      createdAt: new Date().toISOString(),
    };

    complaint.comments.push(newComment);
    complaint.commentsCount = complaint.comments.length;
    return newComment;
  }

  getWasteBins(): WasteBin[] {
    return [...this.wasteBins];
  }

  getRecyclingFacilities(): RecyclingFacility[] {
    return [...this.recyclingFacilities];
  }

  getWaterbodies(): Waterbody[] {
    return [...this.waterbodies];
  }

  getAQIStations(): AQIMeasurement[] {
    return [...this.aqiStations];
  }

  getTrafficObservations(): TrafficObservation[] {
    return [...this.trafficObservations];
  }
}

// Global singleton to persist during development server hot-reloads
declare global {
  var __ecosphere_store__: InMemoryStore | undefined;
}

export const getStore = (): InMemoryStore => {
  if (!global.__ecosphere_store__) {
    global.__ecosphere_store__ = new InMemoryStore();
  }
  return global.__ecosphere_store__;
};

