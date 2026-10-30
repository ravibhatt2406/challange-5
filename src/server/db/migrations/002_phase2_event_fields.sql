-- Phase 2 adds the budget fields collected by the event wizard.
ALTER TABLE events ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (budget_amount >= 0);
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CAD', 'GBP', 'EUR', 'AUD'));
