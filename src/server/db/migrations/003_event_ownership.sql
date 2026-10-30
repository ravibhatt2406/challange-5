-- Event ownership and private-record isolation for authenticated deployments.
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners can manage their events" ON events;
CREATE POLICY "owners can manage their events" ON events
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners can manage event budgets" ON budget_items;
CREATE POLICY "owners can manage event budgets" ON budget_items
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid()));

ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners can manage event timelines" ON timeline_items;
CREATE POLICY "owners can manage event timelines" ON timeline_items
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = timeline_items.event_id AND events.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = timeline_items.event_id AND events.owner_id = auth.uid()));

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners can manage event vendors" ON vendors;
CREATE POLICY "owners can manage event vendors" ON vendors
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid()));

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners can manage event ideas" ON ideas;
CREATE POLICY "owners can manage event ideas" ON ideas
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = ideas.event_id AND events.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = ideas.event_id AND events.owner_id = auth.uid()));
