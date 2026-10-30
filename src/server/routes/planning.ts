// ===========================================
// Event Planning Routes (Budget, Timeline, Vendors)
// ===========================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { notFound } from '../middleware/errorHandler.js';
import { planningService } from '../services/planningService.js';
import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
  createTimelineItemSchema,
  updateTimelineItemSchema,
  createVendorSchema,
  updateVendorSchema,
} from '../../shared/schemas/planning.schema.js';
import { parseResourceId } from '../utils/resourceId.js';
import { requireEventOwnership } from '../middleware/eventOwnership.js';

const router = Router();

// Enforce ownership / tenant isolation for all event planning routes
router.use('/events/:eventId', requireEventOwnership);

/**
 * Extracts and validates the eventId parameter as a valid UUID.
 */
function eventId(req: Request): string {
  return parseResourceId(String(req.params['eventId']));
}

/**
 * Extracts and validates the itemId parameter as a valid UUID.
 */
function itemId(req: Request): string {
  return parseResourceId(String(req.params['itemId']));
}

/**
 * Validates that a milestone due date is not scheduled more than 30 days after the event date,
 * avoiding impossible schedule errors and typos.
 */
function validateTimelineSchedule(eventDateStr: string | null | undefined, dueDateStr: string | null | undefined): string | null {
  if (!eventDateStr || !dueDateStr) return null;
  const eventDate = new Date(eventDateStr);
  const dueDate = new Date(dueDateStr);
  if (Number.isNaN(eventDate.getTime()) || Number.isNaN(dueDate.getTime())) return null;

  // Cutoff is 30 days post-event (allows post-event wrap-up / vendor deposit settlements)
  const maxAllowed = new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (dueDate > maxAllowed) {
    return 'Milestone due date cannot be scheduled more than 30 days after the event date.';
  }
  return null;
}

// ===========================================
// Budget Item Endpoints
// ===========================================

/**
 * GET /api/events/:eventId/budget — List all budget items for an event
 */
router.get('/events/:eventId/budget', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await planningService.listBudgetItems(eventId(req));
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:eventId/budget/summary — Aggregated budget spending, allocations, and remaining balance
 */
router.get('/events/:eventId/budget/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = eventId(req);
    const event = res.locals['event'] as { budget_amount?: number } | undefined;
    const items = await planningService.listBudgetItems(id);
    const summary = planningService.calculateSummary(event?.budget_amount ?? 0, items);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/budget — Create a new budget item
 */
router.post('/events/:eventId/budget', validateBody(createBudgetItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await planningService.createBudgetItem(eventId(req), req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/events/:eventId/budget/:itemId — Update an existing budget item
 */
router.patch('/events/:eventId/budget/:itemId', validateBody(updateBudgetItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await planningService.updateBudgetItem(eventId(req), itemId(req), req.body);
    if (!item) throw notFound('Budget item', itemId(req));
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/events/:eventId/budget/:itemId — Remove a budget item
 */
router.delete('/events/:eventId/budget/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await planningService.deleteBudgetItem(eventId(req), itemId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Timeline Item Endpoints
// ===========================================

/**
 * GET /api/events/:eventId/timeline — List all timeline items for an event
 */
router.get('/events/:eventId/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await planningService.listTimelineItems(eventId(req));
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/timeline — Create a new timeline item
 */
router.post('/events/:eventId/timeline', validateBody(createTimelineItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = res.locals['event'] as { date?: string | null } | undefined;
    const scheduleError = validateTimelineSchedule(event?.date, req.body.due_date);
    if (scheduleError) {
      res.status(400).json({ error: scheduleError });
      return;
    }
    const item = await planningService.createTimelineItem(eventId(req), req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/events/:eventId/timeline/:itemId — Update an existing timeline item
 */
router.patch('/events/:eventId/timeline/:itemId', validateBody(updateTimelineItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = res.locals['event'] as { date?: string | null } | undefined;
    const scheduleError = validateTimelineSchedule(event?.date, req.body.due_date);
    if (scheduleError) {
      res.status(400).json({ error: scheduleError });
      return;
    }
    const item = await planningService.updateTimelineItem(eventId(req), itemId(req), req.body);
    if (!item) throw notFound('Timeline item', itemId(req));
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/events/:eventId/timeline/:itemId — Remove a timeline item
 */
router.delete('/events/:eventId/timeline/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await planningService.deleteTimelineItem(eventId(req), itemId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Vendor Endpoints
// ===========================================

/**
 * GET /api/events/:eventId/vendors — List all vendors for an event
 */
router.get('/events/:eventId/vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendors = await planningService.listVendors(eventId(req));
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/vendors — Add a vendor to an event
 */
router.post('/events/:eventId/vendors', validateBody(createVendorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await planningService.createVendor(eventId(req), req.body);
    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/events/:eventId/vendors/:itemId — Update vendor details
 */
router.patch('/events/:eventId/vendors/:itemId', validateBody(updateVendorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await planningService.updateVendor(eventId(req), itemId(req), req.body);
    if (!vendor) throw notFound('Vendor', itemId(req));
    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/events/:eventId/vendors/:itemId — Remove a vendor
 */
router.delete('/events/:eventId/vendors/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await planningService.deleteVendor(eventId(req), itemId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
