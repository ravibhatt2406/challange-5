import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import app from '../../src/server/index.js';

describe('AI Endpoint Abuse Protection & Rate Limiting', () => {
  let server: Server;
  let baseUrl: string;
  let testEventId: string;

  const rateLimitUserHeader = {
    'Content-Type': 'application/json',
    'x-anon-id': 'rate-limit-test-user-999',
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

    const res = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: rateLimitUserHeader,
      body: JSON.stringify({
        type: 'birthday',
        title: 'Rate Limit Verification Event',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    testEventId = body.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('allows normal AI queries under the threshold and throttles rapid bursts at limit (HTTP 429)', async () => {
    // Send 10 rapid AI copilot queries
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${baseUrl}/api/events/${testEventId}/ai/copilot`, {
        method: 'POST',
        headers: rateLimitUserHeader,
        body: JSON.stringify({ message: `Query number ${i + 1} for party suggestions` }),
      });
      expect(res.status).toBe(200);
    }

    // The 11th rapid query must be intercepted and throttled
    const throttledRes = await fetch(`${baseUrl}/api/events/${testEventId}/ai/copilot`, {
      method: 'POST',
      headers: rateLimitUserHeader,
      body: JSON.stringify({ message: 'Query number 11 should be blocked' }),
    });

    expect(throttledRes.status).toBe(429);
    const errorBody = (await throttledRes.json()) as { error: string };
    expect(errorBody.error).toContain('AI request limit reached');
  });
});

