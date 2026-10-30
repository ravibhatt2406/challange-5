// ===========================================
// Timeline Types
// ===========================================

import type { TimelineStatus } from '../constants/statusEnums.js';

export interface TimelineItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TimelineStatus;
  sort_order: number;
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTimelineItemPayload {
  title: string;
  description?: string;
  due_date?: string;
  status?: TimelineStatus;
  sort_order?: number;
  dependencies?: string[];
}

export interface UpdateTimelineItemPayload {
  title?: string;
  description?: string;
  due_date?: string | null;
  status?: TimelineStatus;
  sort_order?: number;
  dependencies?: string[];
}
