-- Run this in Supabase SQL Editor after the main migration and admin migration

CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'paynow')),
  account_name TEXT NOT NULL,
  account_details JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own payment accounts" ON payment_accounts
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Service role full access payment_accounts" ON payment_accounts
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_payment_accounts_user ON payment_accounts(user_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_account_id UUID REFERENCES payment_accounts(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_note TEXT;

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES payment_accounts(id);

CREATE OR REPLACE TRIGGER update_payment_accounts_updated_at
  BEFORE UPDATE ON payment_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
