-- Site settings for color schemes and global config
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access site_settings" ON site_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public can read site_settings" ON site_settings FOR SELECT USING (true);

-- Insert default color scheme
INSERT INTO site_settings (key, value) VALUES ('color_scheme', '{
  "name": "EventHub Orange",
  "primary": "#F6682F",
  "primaryHover": "#E55A20",
  "primaryLight": "#FFF0E8",
  "dark": "#1E0A3C",
  "bgGray": "#F8F7FA",
  "borderGray": "#D4D5D9",
  "textGray": "#6F7287",
  "textDark": "#1E0A3C",
  "success": "#0D9E5C",
  "danger": "#E53E3E",
  "fontFamily": "Noto Sans",
  "borderRadius": "8px"
}') ON CONFLICT (key) DO NOTHING;

-- Payouts table for creator payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) NOT NULL,
  organizer_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  ticket_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access payouts" ON payouts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Organizers can view own payouts" ON payouts FOR SELECT USING (auth.uid() = organizer_id OR auth.role() = 'service_role');
CREATE POLICY "Admin can manage payouts" ON payouts FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_payouts_event ON payouts(event_id);
CREATE INDEX IF NOT EXISTS idx_payouts_organizer ON payouts(organizer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Reports table for generated reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'monthly', 'annual', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access reports" ON reports FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
