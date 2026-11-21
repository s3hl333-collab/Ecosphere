-- EcoSphere Database Schema
-- Compatible with PostgreSQL 15+ and PostGIS

-- Enable PostGIS extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Constituencies (Assembly boundaries & MLA link)
CREATE TABLE IF NOT EXISTS constituencies (
  id TEXT PRIMARY KEY, -- e.g., 'guwahati-east', 'guwahati-west', 'dispur', 'jalukbari'
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Assam',
  district TEXT NOT NULL DEFAULT 'Kamrup Metropolitan',
  boundary_geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Prototype Representatives (MLAs)
CREATE TABLE IF NOT EXISTS representatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  constituency_id TEXT NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  office_title TEXT NOT NULL DEFAULT 'Member of Legislative Assembly (Prototype)',
  is_prototype BOOLEAN NOT NULL DEFAULT TRUE,
  prototype_disclaimer TEXT NOT NULL DEFAULT 'Prototype representative information — not verified official data.',
  data_source TEXT NOT NULL DEFAULT 'EcoSphere Demonstration Dataset',
  contact_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Waste Bins (Biodegradable & Non-Biodegradable)
CREATE TABLE IF NOT EXISTS waste_bins (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('biodegradable', 'non_biodegradable')),
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity_liters INTEGER DEFAULT 240,
  fill_status TEXT DEFAULT 'normal' CHECK (fill_status IN ('empty', 'normal', 'near_full', 'full')),
  verified_by TEXT NOT NULL DEFAULT 'Guwahati Municipal Corporation (Demo)',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Junkyards & Recycling Facilities
CREATE TABLE IF NOT EXISTS recycling_facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('material_recovery_facility', 'scrap_dealer', 'e_waste_center', 'compost_plant')),
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accepted_categories TEXT[] NOT NULL, -- e.g., ['metals', 'plastics', 'e_waste', 'paper']
  operating_hours TEXT NOT NULL DEFAULT '09:00 - 18:00',
  contact_phone TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'prototype', 'pending')),
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Polluted Rivers & Waterbodies
CREATE TABLE IF NOT EXISTS waterbodies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  waterbody_type TEXT NOT NULL CHECK (waterbody_type IN ('river', 'lake', 'wetland', 'channel')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  pollution_level TEXT NOT NULL CHECK (pollution_level IN ('critical', 'severe', 'moderate', 'monitored')),
  primary_pollutants TEXT[] NOT NULL, -- e.g., ['untreated_sewage', 'solid_waste', 'siltation']
  dissolved_oxygen_mg_l DOUBLE PRECISION,
  bod_mg_l DOUBLE PRECISION,
  data_source TEXT NOT NULL DEFAULT 'Prototype dataset — synthetic for demonstration',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  last_tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Environmental Measurements (AQI Stations)
CREATE TABLE IF NOT EXISTS environmental_measurements (
  id TEXT PRIMARY KEY,
  station_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  aqi_value INTEGER NOT NULL,
  aqi_scale TEXT NOT NULL DEFAULT 'Indian National AQI (NAQI)',
  category TEXT NOT NULL CHECK (category IN ('Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe')),
  pm25 DOUBLE PRECISION,
  pm10 DOUBLE PRECISION,
  dominant_pollutant TEXT DEFAULT 'PM2.5',
  source_label TEXT NOT NULL DEFAULT 'State Pollution Control Board (Prototype/Live)',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Traffic Observations
CREATE TABLE IF NOT EXISTS traffic_observations (
  id TEXT PRIMARY KEY,
  road_name TEXT NOT NULL,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  congestion_level TEXT NOT NULL CHECK (congestion_level IN ('low', 'moderate', 'heavy', 'severe')),
  average_speed_kmh INTEGER NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Public Civic Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_display_name TEXT NOT NULL DEFAULT 'Anonymous Citizen',
  caption TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('garbage_dumping', 'overflowing_bin', 'water_pollution', 'hazardous_waste', 'blocked_drain', 'other')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  image_url TEXT NOT NULL,
  constituency_id TEXT REFERENCES constituencies(id),
  constituency_name TEXT,
  prototype_representative TEXT,
  status TEXT NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Under Review', 'Resolved')),
  status_updated_at TIMESTAMPTZ,
  moderation_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Civic writes are mediated by the application server. Apply this file to new
-- or existing databases before configuring the server-only service role.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE waterbodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public complaints are readable by everyone" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Users can edit or delete their own complaints" ON complaints;
REVOKE ALL ON complaints, profiles FROM anon, authenticated;
REVOKE ALL ON constituencies, representatives, waste_bins, recycling_facilities, waterbodies,
  environmental_measurements, traffic_observations FROM anon, authenticated;

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS complaint_reactions (
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  PRIMARY KEY (complaint_id, visitor_id)
);
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON complaint_comments, complaint_reactions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON complaints, complaint_comments, complaint_reactions TO service_role;

CREATE OR REPLACE FUNCTION public.update_complaint_counter()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  target_id UUID;
  delta INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_id := NEW.complaint_id;
    delta := 1;
  ELSE
    target_id := OLD.complaint_id;
    delta := -1;
  END IF;
  IF TG_TABLE_NAME = 'complaint_reactions' THEN
    UPDATE public.complaints SET likes_count = GREATEST(0, likes_count + delta) WHERE id = target_id;
  ELSE
    UPDATE public.complaints SET comments_count = GREATEST(0, comments_count + delta) WHERE id = target_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_complaint_likes ON complaint_reactions;
CREATE TRIGGER sync_complaint_likes AFTER INSERT OR DELETE ON complaint_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_complaint_counter();
DROP TRIGGER IF EXISTS sync_complaint_comments ON complaint_comments;
CREATE TRIGGER sync_complaint_comments AFTER INSERT OR DELETE ON complaint_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_complaint_counter();

CREATE OR REPLACE FUNCTION public.civic_totals()
RETURNS TABLE (category TEXT, status TEXT, total INTEGER)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT c.category, c.status, count(*)::INTEGER
  FROM public.complaints c WHERE c.moderation_flag = FALSE
  GROUP BY c.category, c.status;
$$;
REVOKE ALL ON FUNCTION public.civic_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.civic_totals() TO service_role;

-- Geospatial Indexes
CREATE INDEX IF NOT EXISTS idx_waste_bins_coords ON waste_bins(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_recycling_coords ON recycling_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_complaints_coords ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_public_feed ON complaints(created_at DESC, id DESC) WHERE moderation_flag = FALSE;
CREATE INDEX IF NOT EXISTS idx_complaint_comments_recent ON complaint_comments(complaint_id, created_at DESC, id DESC);
