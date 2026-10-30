import { describe, expect, it } from 'vitest';
import type { Vendor } from '../../shared/types/vendor';

describe('Vendor Management & Quote Comparison', () => {
  const sampleVendors: Vendor[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      event_id: '00000000-0000-0000-0000-000000000010',
      category: 'Venue',
      name: 'Grand Horizon Hall',
      contact_name: 'Alice Manager',
      phone: '555-0101',
      email: 'alice@horizon.com',
      website: 'https://horizon.com',
      status: 'booked',
      quoted_cost: 4500,
      final_cost: 4500,
      notes: 'Includes tables, chairs, and cleanup',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      event_id: '00000000-0000-0000-0000-000000000010',
      category: 'Catering',
      name: 'Artisan Flavors',
      status: 'quoted',
      quoted_cost: 3200,
      notes: 'Plated 3-course dinner estimate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      event_id: '00000000-0000-0000-0000-000000000010',
      category: 'Photography',
      name: 'Lens & Light Studio',
      status: 'paid',
      quoted_cost: 1800,
      final_cost: 1800,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      event_id: '00000000-0000-0000-0000-000000000010',
      category: 'Music',
      name: 'Sunset Beats DJ',
      status: 'contacted',
      quoted_cost: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('calculates total quoted cost across all vendors with quotes', () => {
    const totalQuoted = sampleVendors.reduce((sum, v) => sum + (v.quoted_cost ?? 0), 0);
    expect(totalQuoted).toBe(9500);
  });

  it('calculates committed and booked costs accurately', () => {
    const committedCost = sampleVendors
      .filter((v) => v.status === 'booked' || v.status === 'paid')
      .reduce((sum, v) => sum + (v.quoted_cost ?? 0), 0);
    expect(committedCost).toBe(6300); // 4500 + 1800
  });

  it('computes booking readiness percentage correctly', () => {
    const bookedCount = sampleVendors.filter((v) => v.status === 'booked' || v.status === 'paid').length;
    const readinessPercent = Math.round((bookedCount / sampleVendors.length) * 100);
    expect(readinessPercent).toBe(50); // 2 out of 4 = 50%
  });

  it('identifies pending quotes requiring decision', () => {
    const pendingQuotes = sampleVendors.filter((v) => v.status === 'quoted' || v.status === 'contacted');
    expect(pendingQuotes.length).toBe(2);
    expect(pendingQuotes.map((v) => v.name)).toEqual(['Artisan Flavors', 'Sunset Beats DJ']);
  });
});

