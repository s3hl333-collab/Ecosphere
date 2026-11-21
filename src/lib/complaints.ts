import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getStore } from './storage';
import { RequestError } from './http';
import { isDemoPhoto } from './upload-limits';
import type { Complaint, ComplaintComment } from './types';
import { GUWAHATI_CONSTITUENCIES } from '../data/constituencies';
import { resolveConstituency } from './geo';

export const FEED_PAGE_SIZE = 24;
const COMMENT_LIMIT = 100;
const GUEST = { authorName: 'Guest User', authorHandle: '@guest_user', authorRole: 'Guest Contributor' };
const ROW_COLUMNS = 'id,user_display_name,caption,description,category,latitude,longitude,address,constituency_id,constituency_name,prototype_representative,status,created_at,likes_count,comments_count';
let database: SupabaseClient | undefined;

function getDatabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error('Missing Supabase URL');
  return database ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isDemoStorage() {
  return !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

interface ComplaintRow {
  id: string;
  user_display_name: string;
  caption: string;
  description: string | null;
  category: Complaint['category'];
  latitude: number;
  longitude: number;
  address: string;
  constituency_id: string | null;
  constituency_name: string | null;
  prototype_representative: string | null;
  status: Complaint['status'];
  created_at: string;
  likes_count: number;
  comments_count: number;
}

function fromRow(row: ComplaintRow): Complaint {
  const coordinates: Complaint['coordinates'] = [row.longitude, row.latitude];
  return {
    id: row.id,
    userDisplayName: row.user_display_name,
    userRole: 'Guest Contributor',
    caption: row.caption,
    description: row.description ?? '',
    category: row.category,
    coordinates,
    address: row.address,
    imageUrl: photoPath(row.id),
    constituencyId: row.constituency_id ?? resolveConstituency(coordinates, GUWAHATI_CONSTITUENCIES)?.id,
    constituencyName: row.constituency_name ?? undefined,
    prototypeRepresentative: row.prototype_representative ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
  };
}

export function photoPath(id: string) {
  return `/api/complaints/${id}/photo`;
}

export async function listComplaints({
  offset = 0, limit = FEED_PAGE_SIZE, category, status, search,
}: {
  offset?: number;
  limit?: number;
  category?: Complaint['category'];
  status?: Complaint['status'];
  search?: string;
} = {}): Promise<Complaint[]> {
  const db = getDatabase();
  if (!db) {
    const key = search?.toLowerCase();
    return getStore().getComplaints()
      .filter((item) => (!category || item.category === category) && (!status || item.status === status) &&
        (!key || [item.caption, item.address, item.description, item.userDisplayName, item.constituencyName]
          .some((field) => field?.toLowerCase().includes(key))))
      .slice(offset, offset + limit)
      .map(({ comments, ...item }) => ({ ...item, commentsCount: item.commentsCount ?? comments?.length ?? 0 }));
  }

  let query = db.from('complaints').select(ROW_COLUMNS).eq('moderation_flag', false);
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (search) {
    const pattern = `%${search.replace(/[\\%_*]/g, '\\$&')}%`;
    const quoted = `"${pattern.replace(/[\\"]/g, '\\$&')}"`;
    query = query.or(`caption.ilike.${quoted},address.ilike.${quoted},description.ilike.${quoted},user_display_name.ilike.${quoted},constituency_name.ilike.${quoted}`);
  }
  const { data, error } = await query.order('created_at', { ascending: false })
    .order('id', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return data.map(fromRow);
}

export async function findComplaint(id: string) {
  const db = getDatabase();
  if (!db) return getStore().getComplaintById(id);
  if (!isUuid(id)) return undefined;
  const { data, error } = await db.from('complaints').select(ROW_COLUMNS)
    .eq('id', id).eq('moderation_flag', false).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}

export async function getCivicTotals() {
  const db = getDatabase();
  const rows = db ? await db.rpc('civic_totals') : {
    data: getStore().getComplaints().map(({ category, status }) => ({ category, status, total: 1 })),
    error: null,
  };
  if (rows.error) throw rows.error;
  const categories: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  let total = 0;
  for (const row of rows.data as { category: string; status: string; total: number }[]) {
    categories[row.category] = (categories[row.category] ?? 0) + row.total;
    statuses[row.status] = (statuses[row.status] ?? 0) + row.total;
    total += row.total;
  }
  return { total, categories, statuses };
}

export async function saveComplaint(item: Complaint, photo?: Buffer) {
  const db = getDatabase();
  if (!db) {
    if (getStore().getComplaints().length >= 100) {
      throw new RequestError(503, 'Demo report storage is full.');
    }
    return getStore().addComplaint(item, photo);
  }
  if (!photo) throw new RequestError(400, 'Attach a photo from your device.');
  const { error } = await db.from('complaints').insert({
    id: item.id,
    user_display_name: item.userDisplayName,
    caption: item.caption,
    description: item.description,
    category: item.category,
    longitude: item.coordinates[0],
    latitude: item.coordinates[1],
    address: item.address,
    image_url: `data:image/jpeg;base64,${photo.toString('base64')}`,
    constituency_name: item.constituencyName,
    prototype_representative: item.prototypeRepresentative,
    created_at: item.createdAt,
  });
  if (error) throw error;
  return item;
}

export async function findPhoto(id: string): Promise<Buffer | string | undefined> {
  const db = getDatabase();
  if (!db) return getStore().getPhoto(id);
  if (!isUuid(id)) return;
  const { data, error } = await db.from('complaints').select('image_url')
    .eq('id', id).eq('moderation_flag', false).maybeSingle();
  if (error) throw error;
  const url = data?.image_url as string | undefined;
  if (url?.startsWith('data:image/jpeg;base64,')) return Buffer.from(url.slice(23), 'base64');
  if (url && isDemoPhoto(url)) return url;
}

function isUuid(id: string) {
  return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);
}

export async function listComments(id: string): Promise<ComplaintComment[] | null> {
  const db = getDatabase();
  const complaint = await findComplaint(id);
  if (!complaint) return null;
  if (!db) return complaint.comments ?? [];
  const { data, error } = await db.from('complaint_comments').select('id,content,created_at')
    .eq('complaint_id', id).order('created_at', { ascending: false })
    .order('id', { ascending: false }).limit(COMMENT_LIMIT);
  if (error) throw error;
  return data.reverse().map(({ id: commentId, content, created_at }) => ({
    ...GUEST, id: commentId, complaintId: id, content, createdAt: created_at,
  }));
}

export async function saveComment(id: string, content: string): Promise<ComplaintComment | null> {
  const db = getDatabase();
  if (!db) {
    const existing = getStore().getComplaintById(id);
    if ((existing?.comments?.length ?? 0) >= COMMENT_LIMIT) throw new RequestError(409, 'This demo thread is full.');
    return getStore().addComment(id, { ...GUEST, content });
  }
  if (!await findComplaint(id)) return null;
  const { data, error } = await db.from('complaint_comments').insert({ complaint_id: id, content })
    .select('id,created_at').single();
  if (error) throw error;
  return { ...GUEST, id: data.id, complaintId: id, content, createdAt: data.created_at };
}

export async function saveReaction(id: string, visitorId: string, liked: boolean) {
  const db = getDatabase();
  if (!db) return getStore().setReaction(id, visitorId, liked);
  if (!await findComplaint(id)) return null;
  const table = db.from('complaint_reactions');
  const { error } = await (liked
    ? table.upsert({ complaint_id: id, visitor_id: visitorId }, { onConflict: 'complaint_id,visitor_id', ignoreDuplicates: true })
    : table.delete().eq('complaint_id', id).eq('visitor_id', visitorId));
  if (error) throw error;
  const complaint = await findComplaint(id);
  return complaint ? { likesCount: complaint.likesCount ?? 0, isLiked: liked } : null;
}
