import { describe, expect, it } from 'vitest';
import { copilotResponseSchema, generatedPlanSchema } from '../../src/server/ai/schemas';

const validPlan = {
  event_type: 'birthday',
  summary: 'A practical birthday plan.',
  assumptions: [],
  preferences_incorporated: [],
  items_to_verify: [],
  budget_proposal: { currency: 'USD', categories: [{ category: 'Food', amount: 100, rationale: 'Guest meals.', priority: 'essential' }] },
  timeline: [{ title: 'Book food', description: 'Confirm catering.', due_date: '2026-11-01T10:00:00+05:30', priority: 'high', category: 'Food', dependencies: [], generated_deadline: true }],
  vendor_checklist: [],
  personalized_ideas: [],
  event_day_schedule: [],
};

// Model responses are untrusted and must pass the same schema every time.
describe('AI output contracts', () => {
  it('accepts a complete structured plan', () => {
    expect(generatedPlanSchema.parse(validPlan).event_type).toBe('birthday');
  });

  it('rejects missing plan sections and invalid dates', () => {
    expect(generatedPlanSchema.safeParse({ ...validPlan, timeline: [{ ...validPlan.timeline[0], due_date: 'tomorrow' }] }).success).toBe(false);
    expect(generatedPlanSchema.safeParse({ summary: validPlan.summary }).success).toBe(false);
  });

  it('accepts a read-only copilot answer without a mutation proposal', () => {
    expect(copilotResponseSchema.parse({ answer: 'Complete catering next.', needs_clarification: false, clarification_question: null, proposal: null }).proposal).toBeNull();
  });
});
