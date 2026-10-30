import { describe, expect, it } from 'vitest';
import { calculateBudgetSummary } from '../../src/server/utils/budgetCalculations';

// These tests protect the deterministic accounting rules used by planning views.
describe('calculateBudgetSummary', () => {
  it('calculates totals in cents to avoid floating-point drift', () => {
    const summary = calculateBudgetSummary(100, [
      { category: 'Food', estimated_cost: 33.33, actual_cost: 30, paid: true },
      { category: 'Food', estimated_cost: 66.67, actual_cost: null, paid: false },
    ]);

    expect(summary.planned_spending).toBe(100);
    expect(summary.actual_spending).toBe(30);
    expect(summary.paid_amount).toBe(30);
    expect(summary.remaining_budget).toBe(0);
    expect(summary.usage_percentage).toBe(100);
    expect(summary.category_totals.Food).toEqual({ estimated: 100, actual: 30 });
  });

  it('flags planned spending above the available budget', () => {
    const summary = calculateBudgetSummary(50, [
      { category: 'Venue', estimated_cost: 75, actual_cost: 0, paid: false },
    ]);

    expect(summary.over_budget).toBe(true);
    expect(summary.remaining_budget).toBe(-25);
    expect(summary.usage_percentage).toBe(150);
  });

  it('returns stable zero metrics for an empty budget', () => {
    const summary = calculateBudgetSummary(0, []);

    expect(summary.planned_spending).toBe(0);
    expect(summary.actual_spending).toBe(0);
    expect(summary.usage_percentage).toBe(0);
    expect(summary.category_totals).toEqual({});
  });
});
