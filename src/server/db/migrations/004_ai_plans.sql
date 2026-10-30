-- Versioned AI previews are kept separate from applied planning records.
CREATE TABLE IF NOT EXISTS ai_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_plans_event ON ai_plans(event_id, generated_at DESC);
