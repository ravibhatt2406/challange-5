import { randomUUID } from 'node:crypto';
import type { CopilotResponse } from './schemas.js';
import { usesSqlite } from '../db/client.js';
import { sqliteConsumeProposal, sqliteStoreProposal, sqliteResetProposals } from '../db/sqlite.js';

interface StoredProposal {
  eventId: string;
  proposal: NonNullable<CopilotResponse['proposal']>;
  expiresAt: number;
}

const proposals = new Map<string, StoredProposal>();
const PROPOSAL_TTL_MS = 15 * 60 * 1000;

/** Keeps proposed mutations server-side until the user explicitly confirms them. */
export function storeProposal(eventId: string, proposal: NonNullable<CopilotResponse['proposal']>): string {
  const id = randomUUID();
  const expiresAt = Date.now() + PROPOSAL_TTL_MS;
  proposals.set(id, { eventId, proposal, expiresAt });
  if (usesSqlite()) {
    sqliteStoreProposal(id, eventId, proposal, expiresAt);
  }
  return id;
}

export function consumeProposal(id: string, eventId: string): StoredProposal | null {
  const memoryStored = proposals.get(id);
  proposals.delete(id);
  const sqliteRow = usesSqlite() ? sqliteConsumeProposal(id, eventId) : null;
  if (memoryStored) {
    if (memoryStored.eventId === eventId && memoryStored.expiresAt >= Date.now()) {
      return memoryStored;
    }
    return null;
  }
  if (sqliteRow && sqliteRow.expiresAt >= Date.now()) {
    return { eventId, proposal: sqliteRow.proposal as NonNullable<CopilotResponse['proposal']>, expiresAt: sqliteRow.expiresAt };
  }
  return null;
}

export function resetProposalStore(): void {
  proposals.clear();
  if (usesSqlite()) {
    sqliteResetProposals();
  }
}
