import { planningService } from '../services/planningService.js';
import { eventService } from '../services/eventService.js';
import { ideaService } from '../services/ideaService.js';
import { buildCopilotPrompt, buildPlanPrompt } from './prompts.js';
import { copilotResponseSchema, generatedPlanSchema, type CopilotResponse, type GeneratedPlan } from './schemas.js';
import { getAiProvider } from './provider.js';
import { getPlan, listPlans, markPlanApplied, storePlan, type StoredPlan } from './planStore.js';
import type { Event } from '../../shared/types/event.js';
import type { BudgetItem } from '../../shared/types/budget.js';
import type { TimelineItem } from '../../shared/types/timeline.js';
import type { Vendor } from '../../shared/types/vendor.js';

interface EventContext {
  event: Event;
  budget: BudgetItem[];
  timeline: TimelineItem[];
  vendors: Vendor[];
}

/** Orchestrates trusted application context, provider calls, validation, and persistence. */
export class AiService {
  async generatePlan(eventId: string): Promise<StoredPlan> {
    const context = await this.loadContext(eventId);
    const raw = await getAiProvider().generatePlan(buildPlanPrompt(context.event, this.serialize(context)));
    const plan = generatedPlanSchema.parse(raw);
    this.validatePlan(plan, context.event);
    return storePlan(eventId, plan);
  }

  listPlans(eventId: string): StoredPlan[] {
    return listPlans(eventId);
  }

  async applyPlan(eventId: string, planId: string): Promise<StoredPlan> {
    const stored = getPlan(eventId, planId);
    if (!stored) throw new Error('The plan preview is unavailable or belongs to another event.');
    if (stored.applied_at) throw new Error('This plan version has already been applied.');
    const context = await this.loadContext(eventId);
    await this.persistPlan(context.event, stored.plan);
    return markPlanApplied(eventId, planId) as StoredPlan;
  }

  async restorePlan(eventId: string, planId: string): Promise<StoredPlan> {
    const stored = getPlan(eventId, planId);
    if (!stored) throw new Error('The plan version is unavailable or belongs to another event.');
    const context = await this.loadContext(eventId);
    await this.persistPlan(context.event, stored.plan);
    return markPlanApplied(eventId, planId) as StoredPlan;
  }

  async answerCopilot(eventId: string, message: string): Promise<CopilotResponse> {
    const context = await this.loadContext(eventId);
    const raw = await getAiProvider().answerCopilot(buildCopilotPrompt(context.event, this.serialize(context), message));
    const answer = copilotResponseSchema.parse(raw);
    if (answer.proposal?.target_id && !this.ownsTarget(answer.proposal.target_id, context)) {
      throw new Error('The proposed resource does not belong to this event.');
    }
    return answer;
  }

  private async loadContext(eventId: string): Promise<EventContext> {
    const event = await eventService.getById(eventId);
    if (!event) throw new Error('Event not found.');
    const [budget, timeline, vendors] = await Promise.all([
      planningService.listBudgetItems(eventId),
      planningService.listTimelineItems(eventId),
      planningService.listVendors(eventId),
    ]);
    return { event, budget, timeline, vendors };
  }

  private serialize(context: EventContext): string {
    return JSON.stringify({
      preferences: context.event.metadata,
      budget: context.budget,
      timeline: context.timeline,
      vendors: context.vendors,
    });
  }

  private validatePlan(plan: GeneratedPlan, event: Event): void {
    if (plan.event_type !== event.type || plan.budget_proposal.currency !== event.currency) {
      throw new Error('Generated plan does not match the event type or currency.');
    }
    const total = plan.budget_proposal.categories.reduce((sum, item) => sum + item.amount, 0);
    if (total > event.budget_amount + 0.01) {
      throw new Error('Generated budget allocation exceeds the event budget.');
    }
    if (event.date && plan.timeline.some((item) => new Date(item.due_date) > new Date(event.date!))) {
      throw new Error('Generated timeline contains a deadline after the event date.');
    }
  }

  private async persistPlan(event: Event, plan: GeneratedPlan): Promise<void> {
    for (const item of plan.budget_proposal.categories) {
      await planningService.createBudgetItem(event.id, {
        category: item.category,
        name: `AI proposal: ${item.category}`,
        estimated_cost: item.amount,
        notes: `${item.rationale}${item.savings_suggestion ? ` Savings: ${item.savings_suggestion}` : ''}`,
      });
    }
    for (const [index, item] of plan.timeline.entries()) {
      await planningService.createTimelineItem(event.id, {
        title: item.title,
        description: item.description,
        due_date: item.due_date,
        sort_order: index,
      });
    }
    for (const item of plan.vendor_checklist) {
      await planningService.createVendor(event.id, {
        category: item.category,
        name: `Suggested ${item.category}`,
        notes: `${item.reason}\n${item.checklist.join('\n')}`,
        quoted_cost: item.estimated_cost ?? undefined,
      });
    }
    for (const item of plan.personalized_ideas) {
      await ideaService.create(event.id, {
        category: item.category,
        title: item.title,
        description: `${item.description}\nWhy it matches: ${item.why_it_matches}`,
        estimated_cost: item.estimated_cost ?? undefined,
      });
    }
  }

  private ownsTarget(id: string, context: EventContext): boolean {
    return [...context.budget, ...context.timeline, ...context.vendors].some((item) => item.id === id);
  }
}

export const aiService = new AiService();
