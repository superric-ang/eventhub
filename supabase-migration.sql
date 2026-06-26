-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cjjjiazcaksxfucuupmd/sql

-- ===================== EVENTS =====================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  format TEXT NOT NULL DEFAULT 'in_person' CHECK (format IN ('in_person', 'online', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  organizer_id UUID REFERENCES auth.users(id) NOT NULL,
  cover_image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  venue JSONB DEFAULT '{}'::jsonb,
  online_details JSONB DEFAULT '{}'::jsonb,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Singapore',
  ticket_tiers JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  max_attendees INTEGER DEFAULT 0,
  current_attendees INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published' OR auth.role() = 'service_role');

CREATE POLICY "Organizers can manage own events"
  ON events FOR ALL
  USING (auth.uid() = organizer_id OR auth.role() = 'service_role');

CREATE POLICY "Service role full access events"
  ON events FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_events_search ON events
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), '')));

-- ===================== ORDERS =====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  payment_fee NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SGD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'card',
  payment_id TEXT,
  attendee_details JSONB DEFAULT '[]'::jsonb,
  promo_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  notes TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.role() = 'service_role');

CREATE POLICY "Organizers can view orders for events"
  ON orders FOR SELECT
  USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM events WHERE events.id = orders.event_id AND events.organizer_id = auth.uid()
  ));

CREATE POLICY "Service role full access orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ===================== PROMO_CODES =====================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true OR auth.role() = 'service_role');

CREATE POLICY "Service role full access promo_codes"
  ON promo_codes FOR ALL
  USING (auth.role() = 'service_role');

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_code_event ON promo_codes(code, event_id);

-- ===================== SAVED EVENTS =====================
CREATE TABLE IF NOT EXISTS saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved events"
  ON saved_events FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ===================== FUNCTIONS =====================
CREATE OR REPLACE FUNCTION increment_event_views(event_uuid UUID)
RETURNS void AS $$
  UPDATE events SET views = COALESCE(views, 0) + 1 WHERE id = event_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
