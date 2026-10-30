// ===========================================
// Event Schema Tests
// ===========================================

import { describe, it, expect } from 'vitest';
import { createEventSchema, updateEventSchema } from '../../../src/shared/schemas/event.schema';

describe('createEventSchema', () => {
  it('accepts valid wedding event', () => {
    const result = createEventSchema.safeParse({
      type: 'wedding',
      title: 'Sarah & John Wedding',
      description: 'A beautiful outdoor ceremony',
      date: '2025-06-15T10:00:00.000Z',
      guest_count: 150,
      location: 'Rose Garden, Portland OR',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid birthday event with minimal fields', () => {
    const result = createEventSchema.safeParse({
      type: 'birthday',
      title: 'Emma turns 30!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid community event', () => {
    const result = createEventSchema.safeParse({
      type: 'community',
      title: 'Annual Neighborhood Block Party',
      guest_count: 500,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createEventSchema.safeParse({
      type: 'wedding',
      title: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Title is required');
    }
  });

  it('rejects missing title', () => {
    const result = createEventSchema.safeParse({
      type: 'wedding',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid event type', () => {
    const result = createEventSchema.safeParse({
      type: 'conference',
      title: 'Tech Conf',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = createEventSchema.safeParse({
      type: 'wedding',
      title: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative guest count', () => {
    const result = createEventSchema.safeParse({
      type: 'birthday',
      title: 'Party',
      guest_count: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero guest count', () => {
    const result = createEventSchema.safeParse({
      type: 'birthday',
      title: 'Party',
      guest_count: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer guest count', () => {
    const result = createEventSchema.safeParse({
      type: 'birthday',
      title: 'Party',
      guest_count: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createEventSchema.safeParse({
      type: 'wedding',
      title: 'Wedding',
      date: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateEventSchema', () => {
  it('accepts partial update', () => {
    const result = updateEventSchema.safeParse({
      title: 'Updated Title',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = updateEventSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts nullable fields', () => {
    const result = updateEventSchema.safeParse({
      description: null,
      date: null,
      guest_count: null,
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title string', () => {
    const result = updateEventSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });
});
