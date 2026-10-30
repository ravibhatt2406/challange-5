// ===========================================
// Budget Types
// ===========================================

export interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  name: string;
  estimated_cost: number;
  actual_cost: number | null;
  paid: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetItemPayload {
  category: string;
  name: string;
  estimated_cost: number;
  actual_cost?: number;
  paid?: boolean;
  notes?: string;
}

export interface UpdateBudgetItemPayload {
  category?: string;
  name?: string;
  estimated_cost?: number;
  actual_cost?: number | null;
  paid?: boolean;
  notes?: string | null;
  sort_order?: number;
}

export interface BudgetSummary {
  planned_budget: number;
  planned_spending: number;
  actual_spending: number;
  paid_amount: number;
  remaining_budget: number;
  usage_percentage: number;
  over_budget: boolean;
  category_totals: Record<string, { estimated: number; actual: number }>;
  item_count: number;
}
