import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface text-text-secondary text-xs">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-text-primary">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-subtle text-primary border border-primary-border">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold tracking-tight text-sm">
                EcoSphere
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-text-secondary">
              Unified environmental intelligence, municipal waste segregation,
              and public civic reporting platform. Piloted for Guwahati, Assam,
              with scalable geospatial architecture for Indian urban centers.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F5F6F4] border border-border text-[11px] text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>WCAG 2.2 AA Accessible &bull; PostGIS Ready</span>
            </div>
          </div>

          {/* Platform navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/map"
                  className="hover:text-text-primary transition-colors"
                >
                  Interactive GIS Map
                </Link>
              </li>
              <li>
                <Link
                  href="/scan"
                  className="hover:text-text-primary transition-colors"
                >
                  AI Waste Segregation Scanner
                </Link>
              </li>
              <li>
                <Link
                  href="/complaints"
                  className="hover:text-text-primary transition-colors"
                >
                  Public Civic Complaints
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-text-primary transition-colors"
                >
                  Environmental Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Prototype Disclosure */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
              Demonstration Notice
            </h4>
            <p className="text-[11px] leading-relaxed text-text-muted">
              Prototype dataset. All MLA representations and synthetic pollution
              measurements are strictly for demonstration purposes and do not
              represent official municipal endorsement.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted">
          <div>
            &copy; {new Date().getFullYear()} EcoSphere. Built for environmental
            transparency and civic stewardship.
          </div>
          <div className="flex items-center gap-4">
            <span>Guwahati Demonstration Deployment</span>
            <span>&bull;</span>
            <Link href="/auth" className="hover:text-text-primary underline">
              Demo Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
