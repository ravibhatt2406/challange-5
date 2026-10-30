// ===========================================
// Event Types
// ===========================================

import type { EventType } from '../constants/eventTypes.js';

/** Core event entity as stored in the database */
export interface Event {
  id: string;
  owner_id: string;
  type: EventType;
  title: string;
  description: string | null;
  date: string | null;
  guest_count: number | null;
  location: string | null;
  budget_amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Payload for creating a new event */
export interface CreateEventPayload {
  type: EventType;
  title: string;
  description?: string;
  date?: string;
  guest_count?: number;
  location?: string;
  budget_amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

/** Payload for updating an existing event */
export interface UpdateEventPayload {
  title?: string;
  description?: string;
  date?: string;
  guest_count?: number;
  location?: string;
  budget_amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}
