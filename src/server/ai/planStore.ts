import { randomUUID } from 'node:crypto';
import type { GeneratedPlan } from './schemas.js';
import { usesSqlite } from '../db/client.js';
import { sqliteListPlans, sqliteMarkPlanApplied, sqliteStorePlan } from '../db/sqlite.js';

export interface StoredPlan {
  plan_id: string;
  event_id: string;
  generated_at: string;
  applied_at: string | null;
  plan: GeneratedPlan;
}

const plans = new Map<string, StoredPlan>();

/** Keeps reviewed plan versions separate from applied planning records. */
export function storePlan(eventId: string, plan: GeneratedPlan): StoredPlan {
  const stored: StoredPlan = {
    plan_id: randomUUID(),
    event_id: eventId,
    generated_at: new Date().toISOString(),
    applied_at: null,
    plan,
  };
  plans.set(stored.plan_id, stored);
  if (usesSqlite()) sqliteStorePlan(eventId, stored.plan_id, plan, stored.generated_at);
  return stored;
}

export function listPlans(eventId: string): StoredPlan[] {
  if (usesSqlite()) return sqliteListPlans(eventId) as StoredPlan[];
  return [...plans.values()]
    .filter((stored) => stored.event_id === eventId)
    .sort((left, right) => right.generated_at.localeCompare(left.generated_at));
}

export function getPlan(eventId: string, planId: string): StoredPlan | null {
  if (usesSqlite()) {
    return listPlans(eventId).find((stored) => stored.plan_id === planId) ?? null;
  }
  const stored = plans.get(planId);
  return stored?.event_id === eventId ? stored : null;
}

export function markPlanApplied(eventId: string, planId: string): StoredPlan | null {
  const stored = getPlan(eventId, planId);
  if (!stored) return null;
  stored.applied_at = new Date().toISOString();
  if (usesSqlite()) sqliteMarkPlanApplied(eventId, planId);
  return stored;
}

export function resetPlanStore(): void {
  plans.clear();
}
