// ===========================================
// API Client — HTTP Wrapper
// ===========================================

// Keep the browser client relative to the deployed origin so Vite and the
// production server can share the same API contract without exposing secrets.
const API_BASE = '/api';

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const ANON_KEY = 'eventcraft_anon_id';

function getStoredAnonId(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(ANON_KEY) : null;
  } catch {
    return null;
  }
}

function setStoredAnonId(id: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(ANON_KEY, id);
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

/**
 * Execute a typed JSON request and normalize transport/API failures into one
 * error type that feature components can display consistently.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const anonId = getStoredAnonId();

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(anonId ? { 'x-anon-id': anonId } : {}),
      ...options.headers,
    },
    ...options,
  });

  const responseAnonId = res.headers?.get('x-anon-id');
  if (responseAnonId && responseAnonId !== anonId) {
    setStoredAnonId(responseAnonId);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers?.get('content-type') ?? '';
  // Test doubles and some proxies omit the header, so retain the JSON
  // contract when the response body is available but the type is unspecified.
  const data = contentType.includes('application/json') || !contentType ? await res.json() : null;

  if (!res.ok) {
    const errorData = data as ApiError | null;
    throw new ApiRequestError(
      res.status,
      errorData?.error ?? `Request failed with status ${res.status}`,
      errorData?.details,
    );
  }

  return data as T;
}

import type { Event, CreateEventPayload, UpdateEventPayload } from '../../../shared/types/event';
import type { BudgetItem, CreateBudgetItemPayload, UpdateBudgetItemPayload, BudgetSummary } from '../../../shared/types/budget';
import type { TimelineItem, CreateTimelineItemPayload, UpdateTimelineItemPayload } from '../../../shared/types/timeline';
import type { Vendor, CreateVendorPayload, UpdateVendorPayload } from '../../../shared/types/vendor';
import type { CopilotResponse, StoredPlan } from '../../../shared/types/ai';
import type { Idea, CreateIdeaPayload } from '../../../shared/types/idea';

// Event endpoints manage the top-level planning brief and event lifecycle.
export const eventsApi = {
  list: () => request<Event[]>('/events'),

  getById: (id: string) => request<Event>(`/events/${id}`),

  create: (data: CreateEventPayload) =>
    request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateEventPayload) =>
    request<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/events/${id}`, { method: 'DELETE' }),
};

/**
 * Event-scoped planning endpoints keep each workspace isolated by event ID.
 * The server remains authoritative for validation and authorization.
 */
export const planningApi = {
  budget: {
    list: (eventId: string) => request<BudgetItem[]>(`/events/${eventId}/budget`),
    summary: (eventId: string) => request<BudgetSummary>(`/events/${eventId}/budget/summary`),
    create: (eventId: string, data: CreateBudgetItemPayload) =>
      request<BudgetItem>(`/events/${eventId}/budget`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (eventId: string, itemId: string, data: UpdateBudgetItemPayload) =>
      request<BudgetItem>(`/events/${eventId}/budget/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (eventId: string, itemId: string) => request<void>(`/events/${eventId}/budget/${itemId}`, { method: 'DELETE' }),
  },
  timeline: {
    list: (eventId: string) => request<TimelineItem[]>(`/events/${eventId}/timeline`),
    create: (eventId: string, data: CreateTimelineItemPayload) =>
      request<TimelineItem>(`/events/${eventId}/timeline`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (eventId: string, itemId: string, data: UpdateTimelineItemPayload) =>
      request<TimelineItem>(`/events/${eventId}/timeline/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (eventId: string, itemId: string) => request<void>(`/events/${eventId}/timeline/${itemId}`, { method: 'DELETE' }),
  },
  vendors: {
    list: (eventId: string) => request<Vendor[]>(`/events/${eventId}/vendors`),
    create: (eventId: string, data: CreateVendorPayload) =>
      request<Vendor>(`/events/${eventId}/vendors`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (eventId: string, itemId: string, data: UpdateVendorPayload) =>
      request<Vendor>(`/events/${eventId}/vendors/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (eventId: string, itemId: string) => request<void>(`/events/${eventId}/vendors/${itemId}`, { method: 'DELETE' }),
  },
};

/** Server-side AI operations; no provider credentials are included in requests. */
export const aiApi = {
  status: () => request<{ provider: 'gemini' | 'ollama' | 'lmstudio' | 'local'; label: string }>('/ai/status'),
  generatePlan: (eventId: string) =>
    request<StoredPlan>(`/events/${eventId}/ai/generate`, { method: 'POST' }),
  listPlans: (eventId: string) => request<StoredPlan[]>(`/events/${eventId}/ai/plans`),
  applyPlan: (eventId: string, planId: string) =>
    request<StoredPlan>(`/events/${eventId}/ai/plans/apply`, { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  restorePlan: (eventId: string, planId: string) =>
    request<StoredPlan>(`/events/${eventId}/ai/plans/restore`, { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  copilot: (eventId: string, message: string) =>
    request<CopilotResponse>(`/events/${eventId}/ai/copilot`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  confirmProposal: (eventId: string, proposalId: string) =>
    request<{ status: string; item?: unknown }>(`/events/${eventId}/ai/copilot/confirm`, {
      method: 'POST',
      body: JSON.stringify({ proposal_id: proposalId }),
    }),
};

/** Ideas remain editable records after generation instead of transient AI text. */
export const ideasApi = {
  list: (eventId: string) => request<Idea[]>(`/events/${eventId}/ideas`),
  generate: (eventId: string) => request<Idea[]>(`/events/${eventId}/ideas/generate`, { method: 'POST' }),
  create: (eventId: string, data: CreateIdeaPayload) => request<Idea>(`/events/${eventId}/ideas`, { method: 'POST', body: JSON.stringify(data) }),
  save: (eventId: string, ideaId: string) => request<Idea>(`/events/${eventId}/ideas/${ideaId}`, { method: 'PATCH', body: JSON.stringify({ status: 'saved' }) }),
  remove: (eventId: string, ideaId: string) => request<Idea>(`/events/${eventId}/ideas/${ideaId}`, { method: 'PATCH', body: JSON.stringify({ status: 'dismissed' }) }),
};

/** Calendar & PDF document export endpoints */
export const exportApi = {
  downloadIcs: (eventId: string) => {
    window.open(`/api/events/${eventId}/export/ics`, '_blank');
  },
  downloadPdf: (eventId: string) => {
    window.open(`/api/events/${eventId}/export/pdf`, '_blank');
  },
};
