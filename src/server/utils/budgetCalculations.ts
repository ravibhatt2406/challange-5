import type { BudgetItem } from '../../shared/types/budget.js';

/** Converts decimal currency values to integer cents before arithmetic. */
function toCents(value: number | null | undefined): number {
  return Math.round((value ?? 0) * 100);
}

function fromCents(value: number): number {
  return value / 100;
}

/** Returns deterministic budget metrics for a single event. */
export function calculateBudgetSummary(
  plannedBudget: number,
  items: Pick<BudgetItem, 'estimated_cost' | 'actual_cost' | 'paid' | 'category'>[],
) {
  const plannedSpendingCents = items.reduce((sum, item) => sum + toCents(item.estimated_cost), 0);
  const actualSpendingCents = items.reduce((sum, item) => sum + toCents(item.actual_cost), 0);
  const paidCents = items.reduce(
    (sum, item) => sum + (item.paid ? toCents(item.actual_cost ?? item.estimated_cost) : 0),
    0,
  );
  const categoryTotals = new Map<string, { estimated: number; actual: number }>();

  for (const item of items) {
    const current = categoryTotals.get(item.category) ?? { estimated: 0, actual: 0 };
    current.estimated += toCents(item.estimated_cost);
    current.actual += toCents(item.actual_cost);
    categoryTotals.set(item.category, current);
  }

  const plannedBudgetCents = toCents(plannedBudget);
  return {
    planned_budget: fromCents(plannedBudgetCents),
    planned_spending: fromCents(plannedSpendingCents),
    actual_spending: fromCents(actualSpendingCents),
    paid_amount: fromCents(paidCents),
    remaining_budget: fromCents(plannedBudgetCents - plannedSpendingCents),
    usage_percentage: plannedBudgetCents === 0 ? 0 : Math.round((plannedSpendingCents / plannedBudgetCents) * 10000) / 100,
    over_budget: plannedSpendingCents > plannedBudgetCents,
    category_totals: Object.fromEntries(
      [...categoryTotals.entries()].map(([category, totals]) => [category, {
        estimated: fromCents(totals.estimated),
        actual: fromCents(totals.actual),
      }]),
    ),
    item_count: items.length,
  };
}
