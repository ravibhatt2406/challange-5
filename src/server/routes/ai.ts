// ===========================================
// AI Planning & Copilot Routes
// ===========================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../ai/aiService.js';
import { validateBody } from '../middleware/validate.js';
import { aiRateLimit } from '../middleware/aiRateLimit.js';
import { parseResourceId } from '../utils/resourceId.js';
import { planningService } from '../services/planningService.js';
import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
  createTimelineItemSchema,
  updateTimelineItemSchema,
  createVendorSchema,
  updateVendorSchema,
} from '../../shared/schemas/planning.schema.js';
import { consumeProposal, storeProposal } from '../ai/proposalStore.js';
import { getAiProviderStatus } from '../ai/provider.js';
import { requireEventOwnership } from '../middleware/eventOwnership.js';

const router = Router();
router.use('/events/:eventId', requireEventOwnership);

const messageSchema = z.object({ message: z.string().trim().min(1).max(2000) });
const proposalSchema = z.object({
  proposal_id: z.string().uuid(),
});
const planSchema = z.object({ plan_id: z.string().uuid() });

/**
 * GET /api/ai/status — Reports current AI provider configuration and readiness
 */
router.get('/ai/status', (_req: Request, res: Response) => {
  res.json(getAiProviderStatus());
});

/**
 * Helper to extract and validate the eventId from URL parameters.
 */
function eventId(req: Request): string {
  return parseResourceId(String(req.params['eventId']));
}

/**
 * POST /api/events/:eventId/ai/generate — Generates a full event plan (budget, timeline, vendors, ideas)
 */
router.post('/events/:eventId/ai/generate', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await aiService.generatePlan(eventId(req)));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:eventId/ai/plans — Retrieves historical and current plan versions
 */
router.get('/events/:eventId/ai/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(aiService.listPlans(eventId(req)));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/ai/plans/apply — Applies a generated plan version to live workspaces
 */
router.post('/events/:eventId/ai/plans/apply', validateBody(planSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await aiService.applyPlan(eventId(req), req.body.plan_id));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/ai/plans/restore — Restores an earlier plan snapshot
 */
router.post('/events/:eventId/ai/plans/restore', validateBody(planSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await aiService.restorePlan(eventId(req), req.body.plan_id));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/ai/copilot — Interactive conversational assistant with action proposals
 */
router.post('/events/:eventId/ai/copilot', aiRateLimit, validateBody(messageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await aiService.answerCopilot(eventId(req), req.body.message);
    if (response.proposal?.requires_confirmation) {
      const proposal_id = storeProposal(eventId(req), response.proposal);
      res.json({ ...response, proposal: { ...response.proposal, proposal_id } });
      return;
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/ai/copilot/confirm — Confirms and applies a staged Copilot proposal
 */
router.post('/events/:eventId/ai/copilot/confirm', validateBody(proposalSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = eventId(req);
    const stored = consumeProposal(req.body.proposal_id, id);
    if (!stored) return res.status(409).json({ error: 'The proposal is expired, already used, or belongs to another event.' });
    const proposal = stored.proposal;
    if (proposal.action === 'update_budget' && proposal.target_id) {
      const currentItems = await planningService.listBudgetItems(id);
      const currentItem = currentItems.find((item) => item.id === proposal.target_id);
      if (!currentItem || (proposal.current_value && Object.entries(proposal.current_value).some(([key, value]) => currentItem[key as keyof typeof currentItem] !== value))) {
        return res.status(409).json({ error: 'The proposal is stale or the item no longer exists.' });
      }
      const parsed = updateBudgetItemSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed budget update is invalid.' });
      const current = await planningService.updateBudgetItem(id, proposal.target_id, {
        ...parsed.data,
        notes: parsed.data.notes ?? undefined,
      });
      if (!current) return res.status(409).json({ error: 'The proposal is stale or the item no longer exists.' });
      return res.json({ status: 'applied', type: 'budget', item: current });
    }
    if (proposal.action === 'add_budget') {
      const parsed = createBudgetItemSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed budget item is invalid.' });
      const item = await planningService.createBudgetItem(id, parsed.data);
      return res.status(201).json({ status: 'applied', type: 'budget', item });
    }
    if (proposal.action === 'update_timeline' && proposal.target_id) {
      const currentItems = await planningService.listTimelineItems(id);
      const currentItem = currentItems.find((item) => item.id === proposal.target_id);
      if (!currentItem) {
        return res.status(409).json({ error: 'The proposal is stale or the timeline item no longer exists.' });
      }
      const parsed = updateTimelineItemSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed timeline update is invalid.' });
      const current = await planningService.updateTimelineItem(id, proposal.target_id, {
        ...parsed.data,
        description: parsed.data.description ?? undefined,
        due_date: parsed.data.due_date ?? undefined,
      });
      if (!current) return res.status(409).json({ error: 'The proposal is stale or the timeline item no longer exists.' });
      return res.json({ status: 'applied', type: 'timeline', item: current });
    }
    if (proposal.action === 'add_timeline') {
      const parsed = createTimelineItemSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed timeline milestone is invalid.' });
      const item = await planningService.createTimelineItem(id, parsed.data);
      return res.status(201).json({ status: 'applied', type: 'timeline', item });
    }
    if (proposal.action === 'update_vendor' && proposal.target_id) {
      const currentItems = await planningService.listVendors(id);
      const currentItem = currentItems.find((item) => item.id === proposal.target_id);
      if (!currentItem) {
        return res.status(409).json({ error: 'The proposal is stale or the vendor no longer exists.' });
      }
      const parsed = updateVendorSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed vendor update is invalid.' });
      const current = await planningService.updateVendor(id, proposal.target_id, {
        ...parsed.data,
        contact_name: parsed.data.contact_name ?? undefined,
        phone: parsed.data.phone ?? undefined,
        email: parsed.data.email ?? undefined,
        website: parsed.data.website ?? undefined,
        quoted_cost: parsed.data.quoted_cost ?? undefined,
        final_cost: parsed.data.final_cost ?? undefined,
        notes: parsed.data.notes ?? undefined,
      });
      if (!current) return res.status(409).json({ error: 'The proposal is stale or the vendor no longer exists.' });
      return res.json({ status: 'applied', type: 'vendor', item: current });
    }
    if (proposal.action === 'add_vendor') {
      const parsed = createVendorSchema.safeParse(proposal.proposed_value);
      if (!parsed.success) return res.status(400).json({ error: 'The proposed vendor entry is invalid.' });
      const item = await planningService.createVendor(id, parsed.data);
      return res.status(201).json({ status: 'applied', type: 'vendor', item });
    }
    return res.status(400).json({ error: 'This proposal type is not supported for confirmation.' });
  } catch (error) {
    next(error);
  }
});

export default router;
