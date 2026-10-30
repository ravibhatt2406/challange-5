import { z } from 'zod';
import { TIMELINE_STATUSES, VENDOR_STATUSES } from '../constants/statusEnums.js';

// Shared monetary limits prevent invalid or unbounded values in every planning area.
const money = z.number().finite().min(0).max(10_000_000);

// Create schemas provide defaults; update schemas separately allow nullable fields.
export const createBudgetItemSchema = z.object({
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  estimated_cost: money,
  actual_cost: money.optional(),
  paid: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const updateBudgetItemSchema = createBudgetItemSchema.partial().extend({
  actual_cost: money.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const createTimelineItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  due_date: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(TIMELINE_STATUSES).default('pending'),
  sort_order: z.number().int().min(0).default(0),
});

export const updateTimelineItemSchema = createTimelineItemSchema.partial().extend({
  description: z.string().max(1000).nullable().optional(),
  due_date: z.iso.datetime({ offset: true }).nullable().optional(),
});

export const createVendorSchema = z.object({
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  contact_name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  website: z.string().url().max(500).optional().or(z.literal('')),
  status: z.enum(VENDOR_STATUSES).default('not_started'),
  quoted_cost: money.optional(),
  final_cost: money.optional(),
  notes: z.string().max(1000).optional(),
});

export const updateVendorSchema = createVendorSchema.partial().extend({
  contact_name: z.string().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().max(254).nullable().optional().or(z.literal('')),
  website: z.string().url().max(500).nullable().optional().or(z.literal('')),
  quoted_cost: money.nullable().optional(),
  final_cost: money.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>;
export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
