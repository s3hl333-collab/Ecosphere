import Link from 'next/link';

export default function GuestAccessPage() {
  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Guest access</h1>
      <p className="text-sm text-zinc-700">
        Explore local environmental data, publish civic reports, and join the discussion as a guest.
        Reports and comments are public.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/complaints" className="rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white">Open civic feed</Link>
        <Link href="/complaints/new" className="rounded-lg border border-zinc-300 px-4 py-3 text-sm">Report an issue</Link>
      </div>
    </section>
  );
}
