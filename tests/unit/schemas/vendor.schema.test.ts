// ===========================================
// Vendor Schema Tests
// ===========================================

import { describe, it, expect } from 'vitest';
import { createVendorSchema, updateVendorSchema } from '../../../src/shared/schemas/vendor.schema';

describe('createVendorSchema', () => {
  it('accepts valid vendor with minimal fields', () => {
    const result = createVendorSchema.safeParse({
      category: 'Photography',
      name: 'Jane Doe Photography',
    });
    expect(result.success).toBe(true);
  });

  it('accepts vendor with all fields', () => {
    const result = createVendorSchema.safeParse({
      category: 'Catering',
      name: 'Gourmet Events',
      contact_name: 'Mike Smith',
      phone: '+1-555-0123',
      email: 'mike@gourmetevents.com',
      website: 'https://gourmetevents.com',
      status: 'contacted',
      quoted_cost: 4500,
      notes: 'Specializes in Italian cuisine',
    });
    expect(result.success).toBe(true);
  });

  it('defaults status to not_started', () => {
    const result = createVendorSchema.safeParse({
      category: 'Venue',
      name: 'Grand Hall',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('not_started');
    }
  });

  it('rejects invalid email', () => {
    const result = createVendorSchema.safeParse({
      category: 'Venue',
      name: 'Some Place',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty email string', () => {
    const result = createVendorSchema.safeParse({
      category: 'Venue',
      name: 'Some Place',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = createVendorSchema.safeParse({
      category: 'Venue',
      name: 'Place',
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    const statuses = ['not_started', 'contacted', 'quoted', 'booked', 'paid'] as const;
    for (const status of statuses) {
      const result = createVendorSchema.safeParse({
        category: 'Venue',
        name: 'Place',
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateVendorSchema', () => {
  it('accepts partial update', () => {
    const result = updateVendorSchema.safeParse({
      status: 'booked',
      final_cost: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts nullable fields', () => {
    const result = updateVendorSchema.safeParse({
      quoted_cost: null,
      final_cost: null,
      contact_name: null,
    });
    expect(result.success).toBe(true);
  });
});
