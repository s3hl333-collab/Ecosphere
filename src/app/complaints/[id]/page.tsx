import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findComplaint, listComments } from '@/lib/complaints';
import { StatusBadge } from '@/components/StatusBadge';
import { MapWrapper as MapComponent } from '@/components/MapWrapper';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Info,
  Heart,
  MessageSquare,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface ComplaintDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0;

export default async function ComplaintDetailPage({ params }: ComplaintDetailPageProps) {
  const { id } = await params;
  const complaint = await findComplaint(id);

  if (!complaint) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-semibold text-zinc-900">
          Complaint Record Not Found
        </h1>
        <p className="text-xs text-zinc-500">
          The requested complaint identifier does not exist or may have been moderated.
        </p>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Complaints Feed</span>
        </Link>
      </div>
    );
  }

  const commentsList = complaint.comments ?? await listComments(id) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Complaints Feed</span>
        </Link>
      </div>

      {/* Main Card */}
      <article className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden shadow-xs">
        {/* Full Image */}
        <div className="relative w-full h-72 sm:h-96 bg-zinc-950 overflow-hidden">
          <img
            src={complaint.imageUrl}
            alt={complaint.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <StatusBadge
              label={complaint.status}
              variant={
                complaint.status === 'Resolved'
                  ? 'green'
                  : complaint.status === 'Under Review'
                  ? 'yellow'
                  : 'blue'
              }
              size="md"
            />
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-medium text-white capitalize border border-white/20">
              {complaint.category.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-100 flex-wrap">
            <div className="flex items-center gap-3">
              {complaint.userAvatarUrl ? (
                <img
                  src={complaint.userAvatarUrl}
                  alt={complaint.userDisplayName}
                  className="w-11 h-11 rounded-full object-cover border border-zinc-200 shadow-2xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  {complaint.userDisplayName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">
                    {complaint.userDisplayName}
                  </span>
                  {complaint.userHandle && (
                    <span className="text-xs font-mono text-zinc-600">
                      {complaint.userHandle}
                    </span>
                  )}
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {complaint.userRole || 'Citizen Contributor'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Reported on {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
                    {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Signal Badges */}
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                <span className="font-semibold text-zinc-900">{complaint.likesCount || 0}</span>
                <span>Likes</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <MessageSquare className="h-4 w-4 text-zinc-500" />
                <span className="font-semibold text-zinc-900">{complaint.commentsCount || commentsList.length}</span>
                <span>Comments</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 leading-snug">
              {complaint.caption}
            </h1>
          </div>

          {complaint.description && (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Citizen Account
              </h2>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed bg-zinc-50/80 p-4 rounded-xl border border-zinc-200/80">
                {complaint.description}
              </p>
            </div>
          )}

          {/* Location & Constituency Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            {/* Geotag */}
            <div className="space-y-2 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Geotagged Location</span>
              </div>
              <p className="text-zinc-700">{complaint.address}</p>
              <div className="text-[11px] text-zinc-600 font-mono">
                Lat: {complaint.coordinates[1].toFixed(5)}, Lng: {complaint.coordinates[0].toFixed(5)}
              </div>
              <div className="pt-2">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold text-xs"
                >
                  <span>Explore on Environmental GIS Map</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Constituency & MLA Context */}
            <div className="space-y-2 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
              <div className="font-semibold text-zinc-900">
                Assembly Constituency Context
              </div>
              <div className="text-emerald-800 font-semibold text-sm">
                {complaint.constituencyName || 'Constituency unavailable'}
              </div>
              {complaint.prototypeRepresentative ? (
                <div className="text-amber-800 text-xs font-medium">
                  {complaint.prototypeRepresentative}
                </div>
              ) : (
                <div className="text-zinc-600 text-xs">
                  No representative mapping found for coordinates
                </div>
              )}
              <p className="text-[10px] text-zinc-600 leading-relaxed border-t border-zinc-200 pt-1.5">
                Prototype representative information — not verified official data. MLA information is contextual metadata only.
              </p>
            </div>
          </div>

          {/* Geographic Pin Verification */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Geographic Pin Verification
            </h3>
            <MapComponent
              wasteBins={[]}
              recyclingFacilities={[]}
              waterbodies={[]}
              aqiStations={[]}
              trafficObservations={[]}
              complaints={[complaint]}
              selectedLocation={complaint.coordinates}
              heightClass="h-[300px]"
              interactive={true}
            />
          </div>

          {/* Comments Discussion Block */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>Community & Municipal Discussion ({commentsList.length})</span>
              </h3>
              <Link href="/complaints" className="text-xs text-emerald-700 hover:underline font-medium">
                Add Comment in Feed
              </Link>
            </div>

            {commentsList.length === 0 ? (
              <p className="text-xs text-zinc-600 py-3 bg-zinc-50 rounded-xl px-4">
                No discussion comments on this record yet.
              </p>
            ) : (
              <div className="space-y-3">
                {commentsList.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{cmt.authorName}</span>
                        {cmt.authorHandle && (
                          <span className="font-mono text-[10px] text-zinc-600">{cmt.authorHandle}</span>
                        )}
                        {cmt.authorRole && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-200/70 text-zinc-700">
                            {cmt.authorRole}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(cmt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-700 leading-relaxed">{cmt.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
