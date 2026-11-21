# EcoSphere — Unified Environmental Intelligence, Waste Management & Civic Reporting

EcoSphere is a unified civic environmental technology platform designed to resolve urban waste segregation challenges, empower citizens with multimodal AI waste classification, and map municipal environmental infrastructure (segregated dustbins, recycling facilities, NAQI air quality, traffic congestion, and polluted waterbodies) alongside a public geotagged complaints reporting pipeline.

EcoSphere is a responsive web app for **Guwahati, Assam, India**. It includes a keyboard-accessible environmental directory and prototype constituency matching. It uses demonstration environmental datasets.

---

## 1. Key Features

### 🗺️ Interactive Environmental GIS Map (`/map`)
- **Leaflet** renders Esri satellite imagery and CARTO street basemaps. A directory provides the environmental data when tiles are unavailable.
- **Segregated Bins**: Distinct Green markers for Biodegradable waste and Blue markers for Non-biodegradable waste with capacity and verification details.
- **Recycling & Junkyards**: Locations of material recovery facilities, scrap dealers, e-waste dismantlers, and composting centers with accepted material manifests.
- **NAQI Air Quality**: Monitoring stations (e.g., Pan Bazar, IIT Guwahati, Boragaon) displaying National Air Quality Index values, PM2.5/PM10 readings, and health categories.
- **Traffic Congestion Overlays**: Color-coded arterial road corridors (GS Road, MG Road, Jalukbari Rotary) displaying speed and delay metrics.
- **Ecologically Threatened Waterbodies**: Point and boundary observations for critical channels and wetlands (Deepor Beel Ramsar site, Bharalu River, Borsola Beel) with dissolved oxygen (DO) and biochemical oxygen demand (BOD) metrics.
- **Accessible List Alternative**: Dedicated tabular directory allowing full screen-reader and keyboard accessibility without requiring WebGL canvas interaction.

### 🤖 Multimodal AI Waste Segregation Scanner (`/scan`)
- **Multimodal AI Analysis**: Integrates the Gemini API to identify items from photos or live camera feeds.
- **Comprehensive Waste Streams**: Classifies items into *Biodegradable*, *Recyclable*, *Non-Biodegradable (Residual)*, *Hazardous*, *E-Waste*, or *Sanitary* streams.
- **Safety Cautions**: Provides critical hazard warnings for lithium batteries, chemicals, and biohazard sharps; prevents improper disposal into general municipal bins.
- **Deterministic Demo Mode**: Interactive preset items (Batteries, PET Bottles, Kitchen Biomass, Medical Syringes, Multilayer Packaging) enabling instant evaluation even without an API key.

### 📢 Public Civic Complaint Feed & Geotagged Reporting (`/complaints`, `/complaints/new`, `/complaints/[id]`)
- **Citizen Issue Reporting**: Photograph and document uncollected garbage, overflowing containers, or polluted stormwater canals.
- **Point-in-Polygon Constituency Resolution**: Automatically checks coordinates against geometric boundaries for Guwahati Assembly Constituencies (*Jalukbari No. 51*, *Gauhati West No. 52*, *Gauhati East No. 53*, *Dispur No. 54*).
- **Prototype MLA Representation**: Shows contextual representative metadata accompanied by an explicit prototype notice.
- **Privacy & Location Confirmation**: Citizens review and confirm public coordinate exposure before final publishing.

### 📊 Environmental Intelligence Dashboard (`/dashboard`)
- High-level KPIs: Segregated bin counts (Bio vs Non-Bio ratio), registered recyclers, monitored waterbodies, and civic complaint pipeline progress (Reported, Under Review, Resolved).
- Station-by-station NAQI air quality rankings.
- Waterbody health summaries with DO/BOD contamination levels.

---

## 2. Technical Stack

| Tier | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| **GIS & Mapping** | Leaflet and point-in-polygon matching |
| **AI Integration** | Gemini and Zod output validation |
| **Persistence** | Supabase PostgreSQL or bounded, per-process demo memory |
| **Testing** | Vitest, Playwright, axe |
| **Accessibility** | Keyboard navigation, labeled forms, native dialogs and a map data directory |

---

## 3. Local Startup Instructions

### Prerequisites
- Node.js 22.13+ or a supported newer even-numbered LTS release
- npm or pnpm

### Quick Start
```bash
# 1. Navigate to the project directory
cd ecosphere

# 2. Install dependencies (if not already installed)
npm install

# 3. Configure environment variables (optional for demo mode)
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Next.js Public
NEXT_PUBLIC_APP_NAME="EcoSphere"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase (use both settings for persistent civic reports)
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""

# Gemini (optional for examples, required for analyzing an uploaded photo)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.5-flash"
```

In demo mode, reports and reactions reset on restart. Basemaps require an internet connection. Only the scanner’s labeled examples work without a Gemini key. Citizen contributions are public guest submissions. Display names are self-reported.

---

## 5. Database Setup (Supabase / PostgreSQL)

To provision durable civic storage:
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Apply `schema.sql` to a staging or new Supabase project first. For an existing project it removes the previous public Data API grants on Civic tables.
4. Set the Supabase project URL and server-only service role key in `.env.local`. Reports, photos, comments, and reactions use the same configured database. A storage error is returned to the caller.

---

## 6. Automated Testing

Run the quality checks and desktop/mobile-sized browser tests:
```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Microsoft Edge. Browser tests use demo storage, a generated photo, and mocked tile/stock-image requests. The suite covers key WCAG checks, but a full accessibility conformance review also needs manual assistive-technology testing.

The automated test suite verifies:
- GIS Point-in-Polygon ray-casting algorithm (`src/test/geo.test.ts`)
- Haversine distance calculations
- Assembly constituency coordinate matching
- Zod schema validations for complaint submissions and waste scan results (`src/test/validations.test.ts`)
- Multimodal AI waste classification and hazardous item warnings (`src/test/gemini.test.ts`)
- Data store operations and complaint persistence (`src/test/storage.test.ts`)

---

## 7. Production Deployment (Vercel)

EcoSphere is optimized for deployment on Vercel:
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Select Next.js framework preset.
4. Set optional environment variables (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.).
5. Click **Deploy**.

---

## 8. Demonstration Notice & Known Limitations

- **Prototype Representative Data**: MLA names and constituency associations represent demonstration metadata to show technical capability. They are clearly denoted with a prototype disclaimer.
- **Waterbody Pollution Indicators**: DO (Dissolved Oxygen) and BOD measurements for Deepor Beel and Bharalu River reflect synthetic demonstration data modeled after typical regional reports.
- **Traffic Corridors**: Traffic delays are demonstration values.
- **Public deployment**: Apply the schema and verify with staging credentials. Set shared per-client rate limits for civic and AI writes at the edge, plus an operational process for moderation and takedowns. In-app rate limits operate per server process. Guest reactions indicate community interest and are not verified votes.
