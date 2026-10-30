// Public barrel for shared constants and their associated literal-union types.
export { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_DESCRIPTIONS, EVENT_CATEGORIES } from './eventTypes.js';
export type { EventType } from './eventTypes.js';

export {
  TIMELINE_STATUSES,
  VENDOR_STATUSES,
  IDEA_STATUSES,
  VENDOR_STATUS_LABELS,
  TIMELINE_STATUS_LABELS,
  VENDOR_STATUS_COLORS,
  TIMELINE_STATUS_COLORS,
} from './statusEnums.js';
export type { TimelineStatus, VendorStatus, IdeaStatus } from './statusEnums.js';
