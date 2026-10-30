// ===========================================
// Timeline Schema Tests
// ===========================================

import { describe, it, expect } from 'vitest';
import { createTimelineItemSchema } from '../../../src/shared/schemas/timeline.schema';

describe('createTimelineItemSchema', () => {
  it('accepts valid timeline item', () => {
    const result = createTimelineItemSchema.safeParse({
      title: 'Book venue',
      description: 'Research and book the ceremony venue',
      due_date: '2025-03-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('defaults status to pending', () => {
    const result = createTimelineItemSchema.safeParse({
      title: 'Send invitations',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('pending');
    }
  });

  it('accepts all valid statuses', () => {
    const statuses = ['pending', 'in_progress', 'completed', 'overdue'] as const;
    for (const status of statuses) {
      const result = createTimelineItemSchema.safeParse({ title: 'Task', status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty title', () => {
    const result = createTimelineItemSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createTimelineItemSchema.safeParse({ title: 'Task', status: 'done' });
    expect(result.success).toBe(false);
  });
});
