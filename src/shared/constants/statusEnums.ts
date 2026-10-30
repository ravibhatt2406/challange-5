// ===========================================
// Status Enums
// ===========================================

export const TIMELINE_STATUSES = ['pending', 'in_progress', 'completed', 'overdue'] as const;
export type TimelineStatus = (typeof TIMELINE_STATUSES)[number];

export const VENDOR_STATUSES = ['not_started', 'contacted', 'quoted', 'booked', 'paid'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const IDEA_STATUSES = ['new', 'saved', 'dismissed'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

// Labels for display
export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  not_started: 'Not Started',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  paid: 'Paid',
};

export const TIMELINE_STATUS_LABELS: Record<TimelineStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

// Colors for badges
export const VENDOR_STATUS_COLORS: Record<VendorStatus, string> = {
  not_started: 'gray',
  contacted: 'blue',
  quoted: 'yellow',
  booked: 'green',
  paid: 'emerald',
};

export const TIMELINE_STATUS_COLORS: Record<TimelineStatus, string> = {
  pending: 'gray',
  in_progress: 'blue',
  completed: 'green',
  overdue: 'red',
};
