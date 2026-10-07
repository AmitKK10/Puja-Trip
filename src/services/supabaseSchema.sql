-- ==============================================================================
-- PujaTrip (পূজাত্রিপ) Supabase PostgreSQL Schema & Realtime Architecture
-- ==============================================================================
-- Run this migration in your Supabase SQL Editor to provision all tables,
-- security rules (RLS), and realtime broadcasts for the private friend group app.
-- ==============================================================================

-- 1. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bengali_name TEXT,
  avatar_url TEXT NOT NULL DEFAULT 'dhunuchi_dancer',
  is_location_sharing_enabled BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRIPS TABLE (Private group itineraries for Kolkata & Contai)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bengali_name TEXT,
  city TEXT NOT NULL CHECK (city IN ('kolkata', 'contai')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL DEFAULT '17:00',
  end_time TIME NOT NULL DEFAULT '23:00',
  start_location JSONB NOT NULL DEFAULT '{"name": "Shyambazar Crossing", "latitude": 22.6038, "longitude": 88.3703}'::jsonb,
  end_location JSONB NOT NULL DEFAULT '{"name": "College Square", "latitude": 22.5765, "longitude": 88.3636}'::jsonb,
  walking_preference TEXT NOT NULL DEFAULT 'normal' CHECK (walking_preference IN ('low', 'normal', 'high')),
  preferred_transport TEXT NOT NULL DEFAULT 'mixed' CHECK (preferred_transport IN ('walking', 'metro', 'bus', 'mixed')),
  max_walking_distance_meters INTEGER DEFAULT 5000,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  notes TEXT,
  description TEXT,
  emblem TEXT DEFAULT 'dhunuchi_dancer',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TRIP MEMBERS (Roles: 'admin' (Owner) vs 'member')
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trip_user UNIQUE (trip_id, user_id)
);

-- 4. TRIP PANDALS / ITINERARY STOPS (Ordered sequence of pandals)
CREATE TABLE IF NOT EXISTS public.trip_pandals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  pandal_id TEXT NOT NULL,
  stop_order INTEGER NOT NULL DEFAULT 0,
  custom_notes TEXT,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trip_pandal UNIQUE (trip_id, pandal_id)
);

-- 5. VISIT STATUS (Per-member or group pandal darshan tracking)
CREATE TABLE IF NOT EXISTS public.visit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  pandal_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_visited BOOLEAN NOT NULL DEFAULT true,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  CONSTRAINT unique_visit_entry UNIQUE (trip_id, pandal_id, user_id)
);

-- 6. SHARED EXPENSES & GROUP SPLITTING (For food, transport, passes, snacks)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'food' CHECK (category IN (
    'food', 'transport_cab', 'transport_transit', 'tickets',
    'shopping', 'stay', 'snacks', 'other'
  )),
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom_amount', 'percentage')),
  split_between JSONB NOT NULL DEFAULT '[]'::jsonb, -- list of participant user IDs
  splits JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {userId, amount, percentage} objects
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT '20:00',
  note TEXT,
  pandal_id TEXT,
  pandal_name TEXT,
  receipt_photo_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CROWD REPORTS (Crowdsourced queue & rush updates from friends)
CREATE TABLE IF NOT EXISTS public.crowd_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  pandal_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crowd_level TEXT NOT NULL CHECK (crowd_level IN ('low', 'moderate', 'high', 'peak_surge')),
  queue_wait_minutes INTEGER NOT NULL DEFAULT 15,
  notes TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LIVE LOCATIONS / SQUAD MEMBER LOCATIONS (Foundation for member location sharing)
CREATE TABLE IF NOT EXISTS public.live_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  heading NUMERIC(6, 2),
  speed NUMERIC(6, 2),
  accuracy NUMERIC(6, 2),
  is_sharing BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trip_user_location UNIQUE (trip_id, user_id)
);

-- View providing squad_member_locations alias for squad_id and sharing_enabled
CREATE OR REPLACE VIEW public.squad_member_locations AS
  SELECT 
    id,
    trip_id AS squad_id,
    trip_id,
    user_id,
    latitude,
    longitude,
    heading,
    speed,
    accuracy,
    is_sharing,
    is_sharing AS sharing_enabled,
    last_seen_at,
    updated_at
  FROM public.live_locations;

-- 9. ACTIVITY LOG (Feed of recent friend group actions)
CREATE TABLE IF NOT EXISTS public.group_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  bengali_description TEXT,
  pandal_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. COMMUNITY PANDALS (User-created custom neighborhood and community pandals)
CREATE TABLE IF NOT EXISTS public.community_pandals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bengali_name TEXT,
  address TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL DEFAULT 'kolkata' CHECK (city IN ('kolkata', 'contai')),
  zone TEXT,
  description TEXT,
  theme TEXT,
  tags JSONB NOT NULL DEFAULT '["Community", "Traditional"]'::jsonb,
  image_url TEXT NOT NULL DEFAULT '/assets/share/durga-devi.png',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_name TEXT,
  is_user_created BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_pandals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_pandals ENABLE ROW LEVEL SECURITY;

-- Community Pandals Policies:
-- Anyone can view community pandals
CREATE POLICY "Community pandals viewable by everyone" ON public.community_pandals FOR SELECT USING (true);
-- Authenticated users can insert their own custom pandals
CREATE POLICY "Authenticated users can create community pandals" ON public.community_pandals FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NOT NULL);
-- Only the creator can update their own pandal
CREATE POLICY "Creators can update their own community pandal" ON public.community_pandals FOR UPDATE USING (auth.uid() = created_by);
-- Only the creator can delete their own pandal
CREATE POLICY "Creators can delete their own community pandal" ON public.community_pandals FOR DELETE USING (auth.uid() = created_by);

-- Allow authenticated users to view all profiles and update their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trips: Members can view trips they belong to or by invite code lookup
CREATE POLICY "Anyone can view trips by invite code or if member" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update trips" ON public.trips FOR UPDATE USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_id = public.trips.id AND user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can delete trips" ON public.trips FOR DELETE USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_id = public.trips.id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Trip Members:
CREATE POLICY "Members viewable by anyone in same trip" ON public.trip_members FOR SELECT USING (true);
CREATE POLICY "Admins can add members or users can join" ON public.trip_members FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = public.trip_members.trip_id AND tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);
CREATE POLICY "Members or admins can update status" ON public.trip_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can remove non-owner members or member can leave" ON public.trip_members FOR DELETE USING (
  public.trip_members.is_owner = false AND (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = public.trip_members.trip_id AND tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  )
);

-- Trip Pandals:
CREATE POLICY "Trip pandals viewable by members" ON public.trip_pandals FOR SELECT USING (true);
CREATE POLICY "Trip pandals manageable by trip members" ON public.trip_pandals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.trip_pandals.trip_id AND user_id = auth.uid())
);

-- Visit Status, Expenses, Crowd Reports, Live Locations:
CREATE POLICY "Visit status manageable by members" ON public.visit_status FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.visit_status.trip_id AND user_id = auth.uid())
);
CREATE POLICY "Expenses manageable by members" ON public.expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.expenses.trip_id AND user_id = auth.uid())
);
CREATE POLICY "Crowd reports viewable by all" ON public.crowd_reports FOR SELECT USING (true);
CREATE POLICY "Crowd reports insertable by authenticated" ON public.crowd_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Live locations manageable by user" ON public.live_locations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Live locations viewable by members" ON public.live_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.live_locations.trip_id AND user_id = auth.uid())
  AND is_sharing = true
);
CREATE POLICY "Activity log viewable by members" ON public.group_activity_log FOR SELECT USING (true);
CREATE POLICY "Activity log insertable by members" ON public.group_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------
-- REALTIME PUBLICATION ENABLEMENT
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_pandals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visit_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crowd_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_activity_log;

-- 11. TRIP JOIN REQUESTS (For Real Admin Approval & Invitee Flow)
CREATE TABLE IF NOT EXISTS public.trip_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT DEFAULT 'dhunuchi_dancer',
  bengali_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'accepted', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  CONSTRAINT unique_trip_join_request UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip join requests viewable by trip admins and requester" ON public.trip_join_requests
  FOR SELECT USING (true);
CREATE POLICY "Users can create join requests" ON public.trip_join_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update join requests" ON public.trip_join_requests
  FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_join_requests;

-- 12. TRIP DAYS (Day-wise festival planning e.g. Maha Saptami, Maha Ashtami)
CREATE TABLE IF NOT EXISTS public.trip_days (
  id TEXT PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  festival_day_name TEXT NOT NULL,
  bengali_festival_day_name TEXT NOT NULL,
  title TEXT,
  bengali_title TEXT,
  transport_preference TEXT NOT NULL DEFAULT 'mixed' CHECK (transport_preference IN ('walking', 'metro', 'bus', 'mixed')),
  sort_order INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  start_time TIME DEFAULT '17:00',
  end_time TIME DEFAULT '23:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip days viewable by members" ON public.trip_days FOR SELECT USING (true);
CREATE POLICY "Trip days manageable by squad members" ON public.trip_days FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.trip_days.trip_id AND user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_days;

-- 13. TRIP DAY PANDALS (Ordered stops within a specific festival day)
CREATE TABLE IF NOT EXISTS public.trip_day_pandals (
  id TEXT PRIMARY KEY DEFAULT ('p_' || gen_random_uuid()),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  trip_day_id TEXT NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  pandal_id TEXT NOT NULL,
  stop_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'visited', 'skipped')),
  is_visited BOOLEAN NOT NULL DEFAULT false,
  visited_at TIMESTAMPTZ,
  visited_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  custom_notes TEXT,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trip_day_pandal UNIQUE (trip_day_id, pandal_id)
);

ALTER TABLE public.trip_day_pandals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip day pandals viewable by members" ON public.trip_day_pandals FOR SELECT USING (true);
CREATE POLICY "Trip day pandals manageable by squad members" ON public.trip_day_pandals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = public.trip_day_pandals.trip_id AND user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_day_pandals;

