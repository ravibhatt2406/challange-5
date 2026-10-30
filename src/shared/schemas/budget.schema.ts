// Keep the legacy budget schema entry point for callers that import it directly.
export {
  createBudgetItemSchema,
  updateBudgetItemSchema,
} from './planning.schema.js';

export type {
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
} from './planning.schema.js';
