// ===========================================
// Idea Types
// ===========================================

import type { IdeaStatus } from '../constants/statusEnums.js';

export interface Idea {
  id: string;
  event_id: string;
  category: string;
  title: string;
  description: string | null;
  estimated_cost: number | null;
  status: IdeaStatus;
  created_at: string;
}

export interface CreateIdeaPayload {
  category: string;
  title: string;
  description?: string;
  estimated_cost?: number;
}

export interface UpdateIdeaPayload {
  status: IdeaStatus;
}
