'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Scan,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  Compass,
  Camera,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: '/map', label: 'GIS Map', icon: MapPin },
    { href: '/scan', label: 'AI Scanner', icon: Scan },
    { href: '/complaints', label: 'Civic Feed', icon: AlertTriangle },
    { href: '/dashboard', label: 'Intelligence', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md transition-all"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileMenuOpen) {
          setMobileMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 text-zinc-900 group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white shadow-sm group-hover:bg-zinc-800 transition-colors">
            <Compass className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              EcoSphere
            </span>
            <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-zinc-600 bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200/60">
              v1.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-1 bg-zinc-100/70 p-1 rounded-full border border-zinc-200/60"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/auth"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Guest access
          </Link>
          <Link
            href="/complaints/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-[0.98]"
          >
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span>Report Issue</span>
          </Link>
        </div>

        {/* Mobile Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/complaints/new"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium shadow-sm active:scale-95 transition-all"
            aria-label="Report an Issue"
          >
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span>Report</span>
          </Link>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-11 w-11 shrink-0 grid place-items-center rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
        <nav id="mobile-navigation" hidden={!mobileMenuOpen} aria-label="Mobile navigation" className="md:hidden border-b border-zinc-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-zinc-100 mt-2 flex flex-col gap-2">
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs text-center font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Guest access
            </Link>
            <Link
              href="/complaints/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-zinc-900 text-white"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Photograph & Report Issue</span>
            </Link>
          </div>
        </nav>
    </header>
  );
};
