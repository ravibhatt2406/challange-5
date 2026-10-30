// ===========================================
// Idea Validation Schemas
// ===========================================

import { z } from 'zod';
import { IDEA_STATUSES } from '../constants/statusEnums.js';

export const createIdeaSchema = z.object({
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  estimated_cost: z.number().min(0).max(10_000_000).optional(),
});

export const updateIdeaSchema = z.object({
  status: z.enum(IDEA_STATUSES),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
