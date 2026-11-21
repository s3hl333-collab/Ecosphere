import type { Complaint, ComplaintComment } from '@/lib/types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body as T;
}

export function fetchFeed(query: string, offset: number, signal: AbortSignal) {
  return fetchJson<{ data: Complaint[]; nextOffset: number | null; demo: boolean }>(
    `/api/complaints?${query}&offset=${offset}`, { signal },
  );
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function postJson<T>(url: string, payload: unknown) {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

interface ReportInput {
  userDisplayName?: string;
  caption: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  locationConfirmed: boolean;
}

export async function publishReport(report: ReportInput): Promise<Complaint> {
  const result = await postJson<{ success: boolean; data: Complaint }>('/api/complaints', report);
  if (!result.success) throw new Error('Failed to submit complaint');
  return result.data;
}

export async function setReaction(id: string, visitorId: string, liked: boolean) {
  const { data } = await postJson<{ data: { likesCount: number; isLiked: boolean } }>(
    `/api/complaints/${id}/like`, { visitorId, liked },
  );
  return data;
}

export async function fetchComments(id: string) {
  const { data } = await fetchJson<{ data: ComplaintComment[] }>(`/api/complaints/${id}/comments`);
  return data;
}

export async function postComment(id: string, content: string) {
  const { data } = await postJson<{ data: ComplaintComment }>(`/api/complaints/${id}/comments`, { content });
  return data;
}
