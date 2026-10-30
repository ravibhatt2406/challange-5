import { z } from 'zod';
import { EVENT_TYPES } from '../../shared/constants/eventTypes.js';

const boundedText = (max: number) => z.string().trim().min(1).max(max);
const optionalMoney = z.number().finite().min(0).max(10_000_000).nullable().optional();

/** The only structured result accepted from Gemini for a generated plan. */
export const generatedPlanSchema = z.object({
  event_type: z.enum(EVENT_TYPES),
  summary: boundedText(1000),
  assumptions: z.array(boundedText(500)).max(20),
  preferences_incorporated: z.array(boundedText(300)).max(20),
  items_to_verify: z.array(boundedText(300)).max(20),
  budget_proposal: z.object({
    currency: z.string().length(3),
    categories: z.array(z.object({
      category: boundedText(100),
      amount: z.number().finite().min(0).max(10_000_000),
      rationale: boundedText(500),
      priority: z.enum(['essential', 'important', 'optional']),
      savings_suggestion: z.string().max(500).optional(),
    })).max(30),
  }),
  timeline: z.array(z.object({
    title: boundedText(200),
    description: z.string().max(1000),
    due_date: z.string().datetime({ offset: true }),
    priority: z.enum(['high', 'medium', 'low']),
    category: boundedText(100),
    dependencies: z.array(z.string().max(200)).max(10),
    generated_deadline: z.boolean(),
  })).max(60),
  vendor_checklist: z.array(z.object({
    category: boundedText(100),
    reason: boundedText(500),
    booking_deadline: z.string().datetime({ offset: true }).nullable(),
    checklist: z.array(boundedText(300)).max(15),
    estimated_cost: optionalMoney,
  })).max(30),
  personalized_ideas: z.array(z.object({
    title: boundedText(200),
    category: boundedText(100),
    description: boundedText(1000),
    why_it_matches: boundedText(500),
    estimated_cost: optionalMoney,
    assumptions: z.array(z.string().max(300)).max(10),
  })).max(30),
  event_day_schedule: z.array(z.object({
    relative_time: boundedText(100),
    activity: boundedText(200),
    description: z.string().max(500),
    duration_minutes: z.number().int().min(1).max(1440).nullable(),
    dependencies: z.array(z.string().max(200)).max(10),
  })).max(50),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

/** Safe copilot output; mutations are proposals until explicitly confirmed. */
export const copilotResponseSchema = z.object({
  answer: boundedText(3000),
  needs_clarification: z.boolean(),
  clarification_question: z.string().max(500).nullable(),
  proposal: z.object({
    explanation: boundedText(1000),
    action: z.enum(['update_budget', 'add_budget', 'update_timeline', 'add_timeline', 'update_vendor', 'add_vendor']),
    target_id: z.string().uuid().nullable(),
    current_value: z.record(z.string(), z.unknown()).nullable(),
    proposed_value: z.record(z.string(), z.unknown()),
    expected_budget_impact: z.number().finite(),
    requires_confirmation: z.boolean(),
  }).nullable(),
});

export type CopilotResponse = z.infer<typeof copilotResponseSchema>;
