'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  MapPin,
  Filter,
  Search,
  ExternalLink,
  Camera,
  Layers,
  Heart,
  MessageSquare,
  Share2,
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
} from 'lucide-react';
import type { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { ReportComposer } from './_components/ReportComposer';
import { errorMessage, fetchComments, fetchFeed, postComment, setReaction } from './feed-api';

const VISITOR_KEY = 'ecosphere-reactions-v1';

function readVisitor(): { id: string; liked: Set<string> } | null {
  try {
    const value = JSON.parse(localStorage.getItem(VISITOR_KEY) ?? 'null');
    if (value && typeof value.id === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.id) &&
        Array.isArray(value.liked) && value.liked.length <= 200 && value.liked.every((id: unknown) => typeof id === 'string')) {
      return { id: value.id, liked: new Set(value.liked) };
    }
  } catch { /* Private browsing and disabled storage are supported. */ }
  return null;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

// Role Badge Color Helper
const getRoleBadgeStyle = (role?: string) => {
  if (!role) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  if (role.includes('Guest')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  if (role.includes('Volunteer')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (role.includes('Resident')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (role.includes('Municipal') || role.includes('Authority')) return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
};

const CATEGORIES = [
  { label: 'All Categories', value: 'all' },
  { label: 'Garbage Dumping', value: 'garbage_dumping' },
  { label: 'Overflowing Bins', value: 'overflowing_bin' },
  { label: 'Water Pollution', value: 'water_pollution' },
  { label: 'Hazardous Waste', value: 'hazardous_waste' },
  { label: 'Blocked Drains', value: 'blocked_drain' },
  { label: 'Other', value: 'other' },
];

const STATUSES = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Reported', value: 'Reported' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Resolved', value: 'Resolved' },
];

export default function ComplaintsFeedPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [demoStorage, setDemoStorage] = useState(false);
  const feedRequest = useRef<AbortController | null>(null);
  const visitorSession = useRef<ReturnType<typeof readVisitor>>(null);
  const pendingLikes = useRef(new Set<string>());

  // Interactive like tracking: Set of complaint IDs liked by this user
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Interactive comments: Set of complaint IDs whose comment drawer is open
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set());

  // Per-complaint draft comment text
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  // Share feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const query = new URLSearchParams({ category: categoryFilter, status: statusFilter, q: searchQuery.trim() }).toString();

  useEffect(() => {
    const controller = new AbortController();
    feedRequest.current = controller;
    const timer = setTimeout(async () => {
      setFeedError(null);
      setLoading(true);
      try {
        const data = await fetchFeed(query, 0, controller.signal);
        if (controller.signal.aborted) return;
        setComplaints(data.data);
        setNextOffset(data.nextOffset);
        setDemoStorage(data.demo);
        setLikedIds(readVisitor()?.liked ?? visitorSession.current?.liked ?? new Set());
      } catch (error) {
        if (!controller.signal.aborted) setFeedError(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 230);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, refresh]);

  async function loadMore() {
    const signal = feedRequest.current?.signal;
    if (nextOffset === null || loadingMore || !signal || signal.aborted) return;
    setLoadingMore(true);
    try {
      const data = await fetchFeed(query, nextOffset, signal);
      if (signal.aborted) return;
      setComplaints((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...data.data.filter((item) => !ids.has(item.id))];
      });
      setNextOffset(data.nextOffset);
    } catch (error) {
      if (!signal.aborted) setToastMessage(errorMessage(error));
    } finally {
      setLoadingMore(false);
    }
  }

  const handleToggleLike = async (id: string) => {
    if (pendingLikes.current.has(id)) return;
    pendingLikes.current.add(id);
    try {
      const visitor = readVisitor() ?? visitorSession.current ?? { id: crypto.randomUUID(), liked: new Set<string>() };
      visitorSession.current = visitor;
      const liked = !visitor.liked.has(id);
      const data = await setReaction(id, visitor.id, liked);
      const next = new Set((readVisitor() ?? visitorSession.current).liked);
      if (data.isLiked) next.add(id);
      else next.delete(id);
      visitorSession.current = { id: visitor.id, liked: next };
      try {
        localStorage.setItem(VISITOR_KEY, JSON.stringify({ id: visitor.id, liked: [...next].slice(-200) }));
      } catch { /* Reactions still work for the current page session. */ }
      setLikedIds(next);
      setComplaints((current) => current.map((item) => item.id === id ? { ...item, likesCount: data.likesCount } : item));
    } catch (error) {
      setToastMessage(errorMessage(error));
    } finally {
      pendingLikes.current.delete(id);
    }
  };

  const handleToggleComments = async (id: string) => {
    const opening = !expandedCommentIds.has(id);
    setExpandedCommentIds((current) => {
      const next = new Set(current);
      if (opening) next.add(id);
      else next.delete(id);
      return next;
    });
    if (!opening) return;
    setCommentLoading((current) => ({ ...current, [id]: true }));
    try {
      const data = await fetchComments(id);
      setComplaints((current) => current.map((item) => item.id === id ? { ...item, comments: data } : item));
    } catch (error) {
      setToastMessage(errorMessage(error));
    } finally {
      setCommentLoading((current) => ({ ...current, [id]: false }));
    }
  };

  const handleAddComment = async (id: string) => {
    const content = (commentDrafts[id] || '').trim();
    if (!content || submittingCommentId || commentLoading[id]) return;
    setSubmittingCommentId(id);
    try {
      const data = await postComment(id, content);
      setComplaints((current) => current.map((item) => item.id === id ? {
        ...item, comments: [...(item.comments ?? []), data], commentsCount: (item.commentsCount ?? 0) + 1,
      } : item));
      setCommentDrafts((current) => ({ ...current, [id]: current[id]?.trim() === content ? '' : current[id] }));
      setToastMessage('Comment published.');
    } catch (error) {
      setToastMessage(errorMessage(error));
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const handleShare = async (complaint: Complaint) => {
    try {
      await navigator.clipboard.writeText(new URL(`/complaints/${complaint.id}`, location.origin).href);
      setToastMessage('Link copied to clipboard.');
    } catch {
      setToastMessage('Could not copy the link. Open Full Report to share its address.');
    }
  };

  function handleReportPublished() {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setRefresh((current) => current + 1);
    setPostSuccess(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 pb-28 sm:pb-16 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 sm:left-auto z-50 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
          <span role="status">{toastMessage}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setToastMessage(null)} className="p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Civic Incident Feed
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Live Community Stream
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Citizen-reported garbage dumping, overflowing bins, and water channel pollution across Guwahati.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen(!composerOpen)}
          aria-expanded={composerOpen}
          aria-controls={composerOpen ? 'civic-composer' : undefined}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Camera className="h-4 w-4 text-emerald-400" />
          <span>{composerOpen ? 'Close Composer' : 'Post as Guest User'}</span>
          {composerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Quick Post Success Banner */}
      {postSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium" role="status">
              Your report has been published to the feed as <strong>Guest User</strong>!
            </span>
          </div>
          <button type="button" aria-label="Dismiss report confirmation" onClick={() => setPostSuccess(false)} className="p-2 text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ReportComposer
        open={composerOpen}
        demoStorage={demoStorage}
        onClose={() => setComposerOpen(false)}
        onPublished={handleReportPublished}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Select */}
          <div className="flex items-center gap-1.5 border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-zinc-50">
            <Filter className="h-3.5 w-3.5 text-zinc-600" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-zinc-800 focus:outline-none"
              aria-label="Filter by category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-1.5 border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-zinc-50">
            <Layers className="h-3.5 w-3.5 text-zinc-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-zinc-800 focus:outline-none"
              aria-label="Filter by status"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="search"
            placeholder="Search address, issue, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
            aria-label="Search civic complaints"
            maxLength={100}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div role="status" className="py-20 text-center text-xs text-zinc-600 flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Synchronizing civic incident feed...</span>
        </div>
      )}

      {/* Complaints Feed List */}
      {!loading && feedError && (
        <div className="rounded-lg border border-red-200 p-4 text-sm text-red-800">
          <p role="alert">{feedError}</p>
          <button type="button" className="mt-2 underline" onClick={() => setRefresh((value) => value + 1)}>Retry</button>
        </div>
      )}
      {!loading && !feedError && (
        <div className="space-y-6">
          {complaints.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-xs border border-dashed border-zinc-200 rounded-2xl p-8 space-y-2">
              <AlertTriangle className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="font-semibold text-zinc-700">No civic complaints found</p>
              <p className="text-[11px]">Adjust your filters or submit the first report above!</p>
            </div>
          ) : (
            complaints.map((item) => {
              const isLiked = likedIds.has(item.id);
              const isCommentsOpen = expandedCommentIds.has(item.id);
              const commentsList = item.comments || [];
              const commentCount = item.commentsCount || commentsList.length;

              return (
                <article
                  key={item.id}
                  id={item.id}
                  className="rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  {/* Top Author Bar */}
                  <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {item.userAvatarUrl ? (
                          <img
                            src={item.userAvatarUrl}
                            alt={item.userDisplayName}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                            {item.userDisplayName.charAt(0)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                        </span>
                      </div>

                      {/* Name & Handle */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-zinc-900">
                            {item.userDisplayName}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-600">
                            {item.userHandle || `@${item.userDisplayName.toLowerCase().replace(/\s+/g, '_')}`}
                          </span>
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full border ${getRoleBadgeStyle(
                              item.userRole
                            )} font-medium`}
                          >
                            {item.userRole || 'Citizen Contributor'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5">
                          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                          <span>&bull;</span>
                          <span className="capitalize">{item.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <StatusBadge
                      label={item.status}
                      variant={
                        item.status === 'Resolved'
                          ? 'green'
                          : item.status === 'Under Review'
                          ? 'yellow'
                          : 'blue'
                      }
                      size="sm"
                    />
                  </div>

                  {/* Body: Caption, Description, Location */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h2 className="text-base font-semibold text-zinc-900 leading-snug">
                      {item.caption}
                    </h2>

                    {item.description && (
                      <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50/70 p-3 rounded-xl border border-zinc-100">
                        {item.description}
                      </p>
                    )}

                    {/* Location & Assembly Constituency Info */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/80 text-zinc-700 text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                        <span className="font-medium">{item.address}</span>
                      </div>

                      {item.constituencyName && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[11px]">
                          <span className="font-semibold">{item.constituencyName}</span>
                          {item.prototypeRepresentative && (
                            <>
                              <span className="text-emerald-400">&bull;</span>
                              <span className="text-amber-800 font-medium">MLA: {item.prototypeRepresentative}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* High Quality Photo Display */}
                  <div className="relative w-full h-72 sm:h-96 bg-zinc-950 overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono font-medium text-white shadow-sm">
                        Geotagged Photo
                      </span>
                    </div>
                  </div>

                  {/* Interactive Action Bar (Like, Comment, Share, Details) */}
                  <div className="px-4 sm:px-5 py-3 border-t border-zinc-100 flex flex-wrap gap-2 items-center justify-between text-xs">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                      {/* Like / Upvote Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(item.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
                          isLiked
                            ? 'bg-rose-50 text-rose-600 font-semibold'
                            : 'text-zinc-600 hover:text-rose-600 hover:bg-zinc-50'
                        }`}
                        title="Upvote / Like this report"
                        aria-label={`Like report, ${item.likesCount ?? 0} likes`}
                        aria-pressed={isLiked}
                      >
                        <Heart
                          className={`h-4 w-4 transition-transform ${
                            isLiked ? 'fill-rose-600 text-rose-600 scale-110' : ''
                          }`}
                        />
                        <span>{item.likesCount || 0}</span>
                      </button>

                      {/* Comments Drawer Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleComments(item.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                          isCommentsOpen
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                        }`}
                        title="View or add comments"
                        aria-expanded={isCommentsOpen}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
                      </button>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                        title="Share link"
                        aria-label="Share report"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/complaints/${item.id}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:text-emerald-700 text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                      >
                        <span>Full Report</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="px-4 sm:px-5 py-4 bg-zinc-50/80 border-t border-zinc-100 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                          Community Discussion ({commentCount})
                        </span>
                        <span className="text-[10px] text-zinc-600">Guwahati Ward Discussions</span>
                      </div>

                      {/* Comments List */}
                      {commentLoading[item.id] ? <p role="status">Loading comments…</p> : commentsList.length === 0 ? (
                        <p className="text-xs text-zinc-600 py-2">
                          No comments yet. Share your observation or municipal update below!
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {commentsList.map((cmt) => (
                            <div
                              key={cmt.id}
                              className="p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900">
                                    {cmt.authorName}
                                  </span>
                                  {cmt.authorHandle && (
                                    <span className="font-mono text-[10px] text-zinc-600">
                                      {cmt.authorHandle}
                                    </span>
                                  )}
                                  {cmt.authorRole && (
                                    <span
                                      className={`font-mono text-[8px] px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(
                                        cmt.authorRole
                                      )}`}
                                    >
                                      {cmt.authorRole}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-600">
                                  <time dateTime={cmt.createdAt}>{formatDate(cmt.createdAt)}</time>
                                </span>
                              </div>
                              <p className="text-zinc-700 leading-relaxed pt-0.5">
                                {cmt.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input Form */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          G
                        </div>
                        <input
                          type="text"
                          aria-label="Comment as Guest User"
                          maxLength={1000}
                          placeholder="Write a comment as Guest User..."
                          value={commentDrafts[item.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts({
                              ...commentDrafts,
                              [item.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(item.id);
                            }
                          }}
                          className="min-w-0 flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(item.id)}
                          disabled={!!submittingCommentId || commentLoading[item.id] || !(commentDrafts[item.id] || '').trim()}
                          className="p-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-95 shrink-0"
                          title="Post Comment"
                          aria-label="Post comment"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
          {nextOffset !== null && (
            <button type="button" disabled={loadingMore} onClick={loadMore} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">
              {loadingMore ? 'Loading more…' : 'Load more reports'}
            </button>
          )}
        </div>
      )}

      {/* Floating Mobile Snap Action Button */}
      <div className="fixed sm:hidden bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setComposerOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-2xl active:scale-95 transition-all"
        >
          <Camera className="h-4 w-4 text-emerald-400" />
          <span>Report as Guest</span>
        </button>
      </div>

    </div>
  );
}
