import { describe, expect, it } from 'vitest';
import { LocalPlanningProvider } from '../../src/server/ai/provider';
import { generatedPlanSchema } from '../../src/server/ai/schemas';

describe('Event-Type Planning Templates & Intelligence', () => {
  const provider = new LocalPlanningProvider();

  it('generates a valid, structured wedding plan with tailored categories', async () => {
    const prompt = `Generate a structured wedding event plan for "Sarah & David's Wedding".
Budget: USD 20000; date: 2026-12-15T18:00:00Z; guests: 150; location: City Botanical Garden.
<event_context>{"priorities": "photography and live band"}</event_context>`;

    const plan = await provider.generatePlan(prompt);
    const parsed = generatedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.event_type).toBe('wedding');
    expect(plan.budget_proposal.currency).toBe('USD');

    // Total budget allocation should equal or match the target
    const totalAllocated = plan.budget_proposal.categories.reduce((sum, c) => sum + c.amount, 0);
    expect(totalAllocated).toBeCloseTo(20000, 0);

    // Verify wedding-specific budget and timeline items
    const categoryNames = plan.budget_proposal.categories.map((c) => c.category);
    expect(categoryNames).toContain('Venue & Catering');
    expect(categoryNames).toContain('Photography & Video');

    // Verify vendor checklist and personalized ideas
    expect(plan.vendor_checklist.length).toBeGreaterThanOrEqual(4);
    expect(plan.personalized_ideas.length).toBeGreaterThanOrEqual(3);
    expect(plan.event_day_schedule.length).toBeGreaterThanOrEqual(5);
  });

  it('generates a valid, structured birthday plan with age/theme appropriate guidance', async () => {
    const prompt = `Generate a structured birthday event plan for "Leo's 10th Birthday Bash".
Budget: USD 1500; date: 2026-11-20T14:00:00Z; guests: 30; location: Adventure Park.
<event_context>{"priorities": "games, cake, entertainer"}</event_context>`;

    const plan = await provider.generatePlan(prompt);
    const parsed = generatedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.event_type).toBe('birthday');
    expect(plan.budget_proposal.currency).toBe('USD');

    const totalAllocated = plan.budget_proposal.categories.reduce((sum, c) => sum + c.amount, 0);
    expect(totalAllocated).toBeCloseTo(1500, 0);

    const categoryNames = plan.budget_proposal.categories.map((c) => c.category);
    expect(categoryNames).toContain('Venue & Food');
    expect(categoryNames).toContain('Entertainment & Games');
    expect(categoryNames).toContain('Cake & Decorations');
  });

  it('generates a valid, structured community event plan with permits & safety coverage', async () => {
    const prompt = `Generate a structured community event plan for "Riverside Park Fall Fair".
Budget: EUR 5000; date: 2026-10-10T10:00:00Z; guests: 300; location: Riverside Community Park.
<event_context>{"priorities": "volunteers, permits, local artisans"}</event_context>`;

    const plan = await provider.generatePlan(prompt);
    const parsed = generatedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.event_type).toBe('community');
    expect(plan.budget_proposal.currency).toBe('EUR');

    const totalAllocated = plan.budget_proposal.categories.reduce((sum, c) => sum + c.amount, 0);
    expect(totalAllocated).toBeCloseTo(5000, 0);

    const categoryNames = plan.budget_proposal.categories.map((c) => c.category);
    expect(categoryNames).toContain('Venue & Permits');
    expect(categoryNames).toContain('Safety & Volunteers');
  });

  it('handles copilot queries with interactive proposals for budget, timeline, and vendors', async () => {
    // Budget cut query
    const budgetPrompt = `Event: Gala (wedding), budget USD 10000, date 2026-12-01.
Current data: {}
User question: Can you help me cut 15% from my budget?`;
    const budgetAnswer = await provider.answerCopilot(budgetPrompt);
    expect(budgetAnswer.proposal).not.toBeNull();
    expect(budgetAnswer.proposal?.action).toBe('add_budget');
    expect(budgetAnswer.proposal?.requires_confirmation).toBe(true);

    // Schedule / Timeline query
    const schedulePrompt = `Event: Festival (community), budget EUR 4000, date 2026-11-01.
Current data: {}
User question: Suggest a day-of schedule and key milestones`;
    const scheduleAnswer = await provider.answerCopilot(schedulePrompt);
    expect(scheduleAnswer.proposal).not.toBeNull();
    expect(scheduleAnswer.proposal?.action).toBe('add_timeline');
    expect(scheduleAnswer.proposal?.requires_confirmation).toBe(true);

    // Vendor query
    const vendorPrompt = `Event: Milestone (birthday), budget USD 2000, date 2026-11-15.
Current data: {}
User question: What vendors do I need to book?`;
    const vendorAnswer = await provider.answerCopilot(vendorPrompt);
    expect(vendorAnswer.proposal).not.toBeNull();
    expect(vendorAnswer.proposal?.action).toBe('add_vendor');
    expect(vendorAnswer.proposal?.requires_confirmation).toBe(true);
  });
});

