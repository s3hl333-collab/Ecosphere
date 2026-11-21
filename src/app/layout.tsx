import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'EcoSphere — Environmental Intelligence, Waste Management & Civic Reporting',
  description:
    'Explore waste infrastructure, understand environmental conditions, identify waste with AI, and report civic issues through one connected platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col bg-background text-text-primary antialiased selection:bg-primary-subtle selection:text-primary">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
