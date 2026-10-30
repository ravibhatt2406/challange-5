// ===========================================
// Budget Schema Tests
// ===========================================

import { describe, it, expect } from 'vitest';
import { createBudgetItemSchema, updateBudgetItemSchema } from '../../../src/shared/schemas/budget.schema';

describe('createBudgetItemSchema', () => {
  it('accepts valid budget item', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Venue',
      name: 'Grand Ballroom Rental',
      estimated_cost: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts budget item with all fields', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Catering',
      name: 'Full-service dinner',
      estimated_cost: 7500,
      actual_cost: 7200,
      paid: true,
      notes: 'Includes dessert bar',
    });
    expect(result.success).toBe(true);
  });

  it('defaults paid to false', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Photography',
      name: 'Wedding Photographer',
      estimated_cost: 2000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paid).toBe(false);
    }
  });

  it('rejects empty category', () => {
    const result = createBudgetItemSchema.safeParse({
      category: '',
      name: 'Item',
      estimated_cost: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative estimated cost', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Venue',
      name: 'Hall',
      estimated_cost: -100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero estimated cost', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Venue',
      name: 'Free park pavilion',
      estimated_cost: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects cost over 10 million', () => {
    const result = createBudgetItemSchema.safeParse({
      category: 'Venue',
      name: 'Space Station',
      estimated_cost: 10_000_001,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateBudgetItemSchema', () => {
  it('accepts partial update', () => {
    const result = updateBudgetItemSchema.safeParse({
      estimated_cost: 6000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts nullable actual_cost', () => {
    const result = updateBudgetItemSchema.safeParse({
      actual_cost: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateBudgetItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
