// ===========================================
// Event Type Definitions
// ===========================================

export const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community Event',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  wedding: '💒',
  birthday: '🎂',
  community: '🏘️',
};

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  wedding: 'Plan your perfect wedding ceremony and reception',
  birthday: 'Organize an unforgettable birthday celebration',
  community: 'Coordinate community gatherings, fundraisers, and festivals',
};

// Default categories per event type (used by budget, vendors, timeline)
export const EVENT_CATEGORIES: Record<EventType, string[]> = {
  wedding: [
    'Venue',
    'Catering',
    'Photography',
    'Videography',
    'Flowers & Decor',
    'Music & Entertainment',
    'Attire & Beauty',
    'Invitations & Stationery',
    'Transportation',
    'Wedding Cake',
    'Favors & Gifts',
    'Officiant',
    'Rentals',
    'Miscellaneous',
  ],
  birthday: [
    'Venue',
    'Food & Drinks',
    'Cake & Desserts',
    'Decorations',
    'Entertainment',
    'Party Favors',
    'Invitations',
    'Photography',
    'Costumes & Themes',
    'Miscellaneous',
  ],
  community: [
    'Venue & Permits',
    'Catering',
    'Entertainment',
    'Decorations',
    'Marketing & Promotion',
    'Volunteers',
    'Sponsors',
    'Equipment & Rentals',
    'Safety & Security',
    'Logistics',
    'Miscellaneous',
  ],
};
