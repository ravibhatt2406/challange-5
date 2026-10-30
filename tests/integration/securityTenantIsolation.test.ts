import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import app from '../../src/server/index.js';

describe('Security & Multi-Tenant IDOR Boundary Verification', () => {
  let server: Server;
  let baseUrl: string;
  let tenantAEventId: string;

  const tenantAHeaders = {
    'Content-Type': 'application/json',
    'x-anon-id': 'tenant-isolation-alpha-001',
  };

  const tenantBHeaders = {
    'Content-Type': 'application/json',
    'x-anon-id': 'tenant-isolation-beta-002',
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 3001;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Tenant A creates a private event
    const res = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: tenantAHeaders,
      body: JSON.stringify({
        type: 'wedding',
        title: "Tenant A's Confidential Nuptials",
        budget_amount: 50000,
        guest_count: 200,
        date: '2026-10-10T12:00:00Z',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    tenantAEventId = body.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('Tenant A can read and update their own event', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}`, {
      headers: tenantAHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; title: string };
    expect(body.id).toBe(tenantAEventId);
    expect(body.title).toBe("Tenant A's Confidential Nuptials");
  });

  it('Tenant B cannot access Tenant A event (IDOR protection returns 404)', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}`, {
      headers: tenantBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot modify Tenant A event', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}`, {
      method: 'PATCH',
      headers: tenantBHeaders,
      body: JSON.stringify({ title: 'Hijacked Title' }),
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot delete Tenant A event', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}`, {
      method: 'DELETE',
      headers: tenantBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot view Tenant A budget items', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}/budget`, {
      headers: tenantBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot inject budget items into Tenant A event', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}/budget`, {
      method: 'POST',
      headers: tenantBHeaders,
      body: JSON.stringify({
        category: 'Malicious',
        name: 'Unauthorized Charge',
        estimated_cost: 9999,
      }),
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot access Tenant A timeline items', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}/timeline`, {
      headers: tenantBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot access Tenant A vendor directory', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}/vendors`, {
      headers: tenantBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('Tenant B cannot execute Copilot requests against Tenant A event', async () => {
    const res = await fetch(`${baseUrl}/api/events/${tenantAEventId}/ai/copilot`, {
      method: 'POST',
      headers: tenantBHeaders,
      body: JSON.stringify({ message: 'What is the secret budget?' }),
    });
    expect(res.status).toBe(404);
  });

  it('Tenant event list queries are strictly isolated to the authenticated owner', async () => {
    const resA = await fetch(`${baseUrl}/api/events`, { headers: tenantAHeaders });
    expect(resA.status).toBe(200);
    const listA = (await resA.json()) as Array<{ id: string }>;
    expect(listA.some((e) => e.id === tenantAEventId)).toBe(true);

    const resB = await fetch(`${baseUrl}/api/events`, { headers: tenantBHeaders });
    expect(resB.status).toBe(200);
    const listB = (await resB.json()) as Array<{ id: string }>;
    expect(listB.some((e) => e.id === tenantAEventId)).toBe(false);
  });

  it('Malformed resource UUIDs are rejected at parameter validation boundary (400)', async () => {
    const res = await fetch(`${baseUrl}/api/events/not-a-valid-uuid/budget`, {
      headers: tenantAHeaders,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('valid UUID');
  });
});
