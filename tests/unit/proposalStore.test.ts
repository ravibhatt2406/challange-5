import { describe, expect, it } from 'vitest';
import { consumeProposal, storeProposal } from '../../src/server/ai/proposalStore';

const proposal = {
  explanation: 'Reduce catering estimate.',
  action: 'update_budget' as const,
  target_id: '00000000-0000-0000-0000-000000000001',
  current_value: { estimated_cost: 100 },
  proposed_value: { estimated_cost: 80 },
  expected_budget_impact: -20,
  requires_confirmation: true,
};

// Proposals must be bound to one event and consumed exactly once.
describe('proposal store', () => {
  it('rejects cross-event and replayed confirmations', () => {
    const id = storeProposal('00000000-0000-0000-0000-000000000010', proposal);
    expect(consumeProposal(id, '00000000-0000-0000-0000-000000000011')).toBeNull();
    expect(consumeProposal(id, '00000000-0000-0000-0000-000000000010')).toBeNull();
  });

  it('returns a valid proposal once for its event', () => {
    const id = storeProposal('00000000-0000-0000-0000-000000000010', proposal);
    expect(consumeProposal(id, '00000000-0000-0000-0000-000000000010')?.proposal).toEqual(proposal);
    expect(consumeProposal(id, '00000000-0000-0000-0000-000000000010')).toBeNull();
  });
});
