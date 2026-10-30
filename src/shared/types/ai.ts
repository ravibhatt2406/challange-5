/** Client-visible shape returned by structured plan generation. */
export interface GeneratedPlan {
  event_type: 'wedding' | 'birthday' | 'community';
  summary: string;
  assumptions: string[];
  preferences_incorporated: string[];
  items_to_verify: string[];
  budget_proposal: { currency: string; categories: Array<{ category: string; amount: number; rationale: string; priority: string; savings_suggestion?: string }> };
  timeline: Array<{ title: string; description: string; due_date: string; priority: string; category: string; dependencies: string[]; generated_deadline: boolean }>;
  vendor_checklist: Array<{ category: string; reason: string; booking_deadline: string | null; checklist: string[]; estimated_cost?: number | null }>;
  personalized_ideas: Array<{ title: string; category: string; description: string; why_it_matches: string; estimated_cost?: number | null; assumptions: string[] }>;
  event_day_schedule: Array<{ relative_time: string; activity: string; description: string; duration_minutes: number | null; dependencies: string[] }>;
}

export interface StoredPlan {
  plan_id: string;
  event_id: string;
  generated_at: string;
  applied_at: string | null;
  plan: GeneratedPlan;
}

/** Copilot answers may include a proposal, but never an implicit mutation. */
export interface CopilotResponse {
  answer: string;
  needs_clarification: boolean;
  clarification_question: string | null;
  proposal: {
    proposal_id?: string;
    explanation: string;
    action: 'update_budget' | 'add_budget' | 'update_timeline' | 'add_timeline' | 'update_vendor' | 'add_vendor';
    target_id: string | null;
    current_value: Record<string, unknown> | null;
    proposed_value: Record<string, unknown>;
    expected_budget_impact: number;
    requires_confirmation: boolean;
  } | null;
}
