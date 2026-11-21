# EcoSphere — Agent Continuity & Architecture Guide

## 1. Project Overview
**EcoSphere** is a unified environmental intelligence, waste management, and civic reporting web application built for hackathons and production deployment. It addresses improper waste disposal, segregation confusion, and civic environmental monitoring with a primary demonstration deployment in Guwahati, Assam, India.

Core pillars:
1. **Interactive Environmental GIS Map** (`/map`): Leaflet renders bins, recycling facilities, demonstration air and water quality data, traffic, and recent civic complaints. An accessible directory presents the same records.
2. **AI Waste Segregation Scanner** (`/scan`): Multimodal Gemini API with server-side Zod validation to classify waste into biodegradable, recyclable, hazardous, e-waste, sanitary, or non-biodegradable residual waste. Provides safety warnings, material attributes, disposal guidelines, and deterministic demo fallbacks.
3. **Public Civic Complaint Feed & Reporting** (`/complaints`, `/complaints/new`, `/complaints/[id]`): Geotagged civic issue reporting with image upload, location pin selection, assembly constituency point-in-polygon matching (Jalukbari, Dispur, Gauhati East, Gauhati West), prototype MLA metadata, and status tracking (Reported, Under Review, Resolved).
4. **Environmental Dashboard** (`/dashboard`): Aggregate metrics, waste bin distribution, recycling facilities directory, AQI summaries, and waterbody health indicators.
5. **Guest access** (`/auth`): Public guest access. There are no authenticated or moderator sessions in the web app.

---

## 2. Architecture & File Structure
```
ecosphere/
├── AGENTS.md                   # This project continuity documentation
├── README.md                   # User guide & documentation
├── schema.sql                  # PostgreSQL & PostGIS migration schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── .env.example
├── public/                     # Static assets & map markers
└── src/
    ├── app/
    │   ├── layout.tsx          # Root layout with responsive header & footer
    │   ├── page.tsx            # Editorial landing page
    │   ├── globals.css         # Tailwind & custom map styles
    │   ├── map/page.tsx        # Interactive Environmental GIS map
    │   ├── scan/page.tsx       # AI waste scanner with camera & upload
    │   ├── complaints/
    │   │   ├── page.tsx        # Public civic complaints feed
    │   │   ├── new/page.tsx    # Complaint creation with map picker & MLA preview
    │   │   └── [id]/page.tsx   # Detailed complaint view
    │   ├── dashboard/page.tsx  # Environmental metrics & statistics
    │   ├── auth/page.tsx       # Sign-in & demo account access
    │   └── api/
    │       ├── scan/route.ts        # AI waste analysis API (Gemini + fallback)
    │       ├── complaints/route.ts  # Complaints CRUD & upload API
    │       ├── constituency/route.ts# Geo polygon lookup API
    │       └── env-data/route.ts    # Map layers GeoJSON & data API
    ├── components/
    │   ├── Navbar.tsx          # Responsive navigation bar
    │   ├── Footer.tsx          # Editorial footer with prototype disclaimers
    │   ├── MapComponent.tsx    # Leaflet map and layer controls
    │   ├── StatusBadge.tsx     # Semantic accessible status badge
    │   └── AccessibleListView.tsx # WCAG 2.2 accessible data view
    ├── data/
    │   ├── seedData.ts         # High-fidelity Guwahati geospatial datasets
    │   └── constituencies.ts   # Assembly constituency polygons & prototype MLAs
    ├── lib/
    │   ├── types.ts            # TypeScript interfaces and domain types
    │   ├── validations.ts      # Zod validation schemas
    │   ├── geo.ts              # PostGIS-style point-in-polygon & spatial calculations
    │   ├── storage.ts          # Seed environmental data and bounded local demo store
    │   ├── complaints.ts       # Civic report persistence and public queries
    │   └── gemini.ts           # Gemini API adapter & prompt construction
    └── test/                   # Vitest unit & integration test suites
        ├── geo.test.ts         # 4 passing tests
        ├── validations.test.ts # 5 passing tests
        ├── gemini.test.ts      # 4 passing tests
        └── storage.test.ts     # 2 passing tests
```

---

## 3. Design System & Tokens
A restrained, editorial SaaS aesthetic inspired by Linear, Vercel, and Stripe:
- Background: `#FAFAF8`
- Surface: `#FFFFFF`
- Primary text: `#171C19`
- Secondary text: `#66716B`
- Primary Green: `#176B50` (subtle: `#EAF2EC`)
- Borders: `#E5E9E5`
- Error: `#B74444` (subtle: `#FDF0F0`)
- Warning: `#A66A20` (subtle: `#FEF7EC`)
- Blue Accent: `#2B6CB0` (subtle: `#EBF3FB`)

---

## 4. Setup & Running Instructions
1. **Install Dependencies**: `npm install` (or `npm.cmd install` on Windows)
2. **Environment Configuration**: Copy `.env.example` to `.env.local`
3. **Development Server**: `npm run dev` (starts on `http://localhost:3000`)
4. **Run Tests**: `npm run test`
5. **Build for Production**: `npm run build`

---

## 5. Current Implementation Status
- [x] Initial architecture definition
- [x] Database migration schema (`schema.sql`)
- [x] Strict TypeScript configuration
- [x] Tailwind CSS design tokens & theme setup
- [x] Seed datasets for Guwahati (bins, recycling centers, waterbodies, AQI, traffic, constituencies)
- [x] Core libraries (`geo.ts`, `validations.ts`, `storage.ts`, `gemini.ts`)
- [x] UI Navigation and Layout (`Navbar.tsx`, `Footer.tsx`, `layout.tsx`)
- [x] Interactive GIS Map with Leaflet (`MapComponent.tsx`, `/map`)
- [x] AI Waste Scanner (`/scan`, `/api/scan`)
- [x] Civic Complaints Feed, Creator & Details (`/complaints`, `/complaints/new`, `/complaints/[id]`)
- [x] Environmental Dashboard (`/dashboard`)
- [x] Guest access page (`/auth`)
- [x] Automated Vitest and Playwright suites

---

## 6. Verification and Test Results
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run test:e2e` after building and installing Playwright Chromium.
- Apply `schema.sql` before enabling Supabase storage. Local demo reports reset when the server restarts.
- Basemap imagery requires remote tiles. Scanner presets work without a Gemini key. Uploaded photos require live AI access and return an error if analysis fails.
