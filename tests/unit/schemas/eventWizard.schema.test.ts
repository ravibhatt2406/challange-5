import { describe, expect, it } from 'vitest';
import {
  eventWizardSchema,
  initialEventWizardData,
} from '../../../src/shared/schemas/eventWizard.schema';

/** Verifies the complete Phase 1 planning brief contract and its boundaries. */
describe('eventWizardSchema', () => {
  it('accepts a complete planning brief for each supported event type', () => {
    for (const type of ['wedding', 'birthday', 'community'] as const) {
      const result = eventWizardSchema.safeParse({
        ...initialEventWizardData,
        type,
        name: 'Community celebration',
        date: '2026-10-27',
        guestCount: 80,
        budgetAmount: 12500,
      });

      expect(result.success).toBe(true);
    }
  });

  it('rejects missing required planning details', () => {
    const result = eventWizardSchema.safeParse({
      ...initialEventWizardData,
      name: '',
      date: '',
      guestCount: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['name', 'date', 'guestCount']),
      );
    }
  });

  it('rejects negative budgets and oversized text', () => {
    const result = eventWizardSchema.safeParse({
      ...initialEventWizardData,
      name: 'A valid event',
      date: '2026-10-27',
      guestCount: 10,
      budgetAmount: -1,
      notes: 'x'.repeat(2001),
    });

    expect(result.success).toBe(false);
  });

  it('allows optional fields to remain empty', () => {
    const result = eventWizardSchema.safeParse({
      ...initialEventWizardData,
      name: 'A simple event',
      date: '2026-10-27',
      guestCount: 10,
    });

    expect(result.success).toBe(true);
  });
});
