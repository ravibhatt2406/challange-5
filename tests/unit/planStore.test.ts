import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GeneratedPlan } from '../../src/server/ai/schemas';

const samplePlan = {
  event_type: 'wedding',
  summary: 'Preview',
  assumptions: [],
  preferences_incorporated: [],
  items_to_verify: [],
  budget_proposal: { currency: 'USD', categories: [] },
  timeline: [],
  vendor_checklist: [],
  personalized_ideas: [],
  event_day_schedule: [],
} satisfies GeneratedPlan;

describe('AI plan versions', () => {
  const originalProvider = process.env['DATABASE_PROVIDER'];
  const originalUrl = process.env['SUPABASE_URL'];
  const originalKey = process.env['SUPABASE_ANON_KEY'];
  beforeEach(() => {
    process.env['DATABASE_PROVIDER'] = 'supabase';
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['SUPABASE_ANON_KEY'] = 'test-key';
  });
  afterEach(() => {
    if (originalProvider === undefined) delete process.env['DATABASE_PROVIDER'];
    else process.env['DATABASE_PROVIDER'] = originalProvider;
    if (originalUrl === undefined) delete process.env['SUPABASE_URL'];
    else process.env['SUPABASE_URL'] = originalUrl;
    if (originalKey === undefined) delete process.env['SUPABASE_ANON_KEY'];
    else process.env['SUPABASE_ANON_KEY'] = originalKey;
  });

  it('stores, lists, and marks a plan version applied', async () => {
    const store = await import('../../src/server/ai/planStore');
    store.resetPlanStore();
    const saved = store.storePlan('event-1', samplePlan);
    expect(store.listPlans('event-1')).toHaveLength(1);
    expect(store.getPlan('event-1', saved.plan_id)?.applied_at).toBeNull();
    expect(store.markPlanApplied('event-1', saved.plan_id)?.applied_at).toBeTruthy();
    expect(store.getPlan('event-2', saved.plan_id)).toBeNull();
  });
});
