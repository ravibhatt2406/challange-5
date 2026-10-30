import type { EventType } from '../../../shared/constants/eventTypes';

export interface EventTheme {
  type: EventType;
  label: string;
  badgeColor: 'wedding' | 'birthday' | 'community';
  gradientBg: string;
  borderAccent: string;
  textAccent: string;
  glowColor: string;
  tagline: string;
}

export const EVENT_THEMES: Record<EventType, EventTheme> = {
  wedding: {
    type: 'wedding',
    label: 'Wedding',
    badgeColor: 'wedding',
    gradientBg: 'from-rose-500/10 via-amber-500/5 to-transparent',
    borderAccent: 'border-rose-500/30 hover:border-rose-400/50',
    textAccent: 'text-rose-300',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    tagline: 'Romantic Rose & Champagne Gold',
  },
  birthday: {
    type: 'birthday',
    label: 'Birthday',
    badgeColor: 'birthday',
    gradientBg: 'from-fuchsia-500/10 via-purple-500/5 to-transparent',
    borderAccent: 'border-fuchsia-500/30 hover:border-fuchsia-400/50',
    textAccent: 'text-fuchsia-300',
    glowColor: 'rgba(217, 70, 239, 0.15)',
    tagline: 'Vibrant Electric Violet & Coral',
  },
  community: {
    type: 'community',
    label: 'Community Event',
    badgeColor: 'community',
    gradientBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderAccent: 'border-emerald-500/30 hover:border-emerald-400/50',
    textAccent: 'text-emerald-300',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    tagline: 'Emerald & Teal Gathering',
  },
};
