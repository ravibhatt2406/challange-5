import { describe, expect, it, afterEach } from 'vitest';
import { getAiProvider, getAiProviderStatus, LocalPlanningProvider, setAiProviderForTests, type AiProvider } from '../../src/server/ai/provider';

const mockProvider: AiProvider = {
  generatePlan: async () => ({}) as never,
  answerCopilot: async () => ({}) as never,
};

// Provider injection keeps AI service tests deterministic and credential-free.
describe('AI provider boundary', () => {
  afterEach(() => setAiProviderForTests(null));

  it('uses the injected mock provider', () => {
    setAiProviderForTests(mockProvider);
    expect(getAiProvider()).toBe(mockProvider);
  });

  it('creates a schema-compatible local starter plan without credentials', async () => {
    const plan = await new LocalPlanningProvider().generatePlan(
      'Create a structured wedding event plan. Budget: USD 10000; date: 2026-12-20T00:00:00.000Z;'
    );

    expect(plan.event_type).toBe('wedding');
    expect(plan.budget_proposal.categories.length).toBeGreaterThan(0);
    expect(plan.personalized_ideas.length).toBeGreaterThan(0);
  });

  it('reports the configured keyless provider without exposing credentials', () => {
    const previous = process.env['AI_PROVIDER'];
    try {
      process.env['AI_PROVIDER'] = 'local';
      expect(getAiProviderStatus()).toEqual({ provider: 'local', label: 'Local starter' });
    } finally {
      if (previous === undefined) delete process.env['AI_PROVIDER'];
      else process.env['AI_PROVIDER'] = previous;
    }
  });
});
