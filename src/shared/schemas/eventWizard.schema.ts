import { z } from 'zod';
import { EVENT_TYPES } from '../constants/eventTypes.js';

/** Validates the draft collected by the Phase 1 event planning wizard. */
export const eventWizardSchema = z.object({
  type: z.enum(EVENT_TYPES, { message: 'Choose an event type' }),
  name: z.string().trim().min(1, 'Event name is required').max(200, 'Event name must be 200 characters or fewer'),
  date: z.string().min(1, 'Event date is required'),
  startTime: z.string().optional(),
  location: z.string().trim().max(500, 'Location must be 500 characters or fewer'),
  guestCount: z.number({ message: 'Guest count must be a number' }).int('Guest count must be a whole number').min(1, 'Guest count must be at least 1').max(100000, 'Guest count must be 100,000 or fewer'),
  budgetAmount: z.number({ message: 'Budget must be a number' }).min(0, 'Budget cannot be negative').max(100000000, 'Budget is too large'),
  currency: z.enum(['USD', 'CAD', 'GBP', 'EUR', 'AUD']),
  priorities: z.string().trim().max(500, 'Priorities must be 500 characters or fewer'),
  flexibility: z.enum(['fixed', 'some-flexibility', 'flexible']),
  style: z.string().trim().max(500, 'Style must be 500 characters or fewer'),
  culturalPreferences: z.string().trim().max(1000, 'Cultural preferences must be 1,000 characters or fewer'),
  dietaryRequirements: z.string().trim().max(1000, 'Dietary requirements must be 1,000 characters or fewer'),
  notes: z.string().trim().max(2000, 'Notes must be 2,000 characters or fewer'),
  accessibilityRequirements: z.string().trim().max(1000, 'Accessibility requirements must be 1,000 characters or fewer'),
});

export type EventWizardData = z.infer<typeof eventWizardSchema>;

export const initialEventWizardData: EventWizardData = {
  type: 'wedding',
  name: '',
  date: '',
  startTime: '',
  location: '',
  guestCount: 1,
  budgetAmount: 0,
  currency: 'USD',
  priorities: '',
  flexibility: 'some-flexibility',
  style: '',
  culturalPreferences: '',
  dietaryRequirements: '',
  notes: '',
  accessibilityRequirements: '',
};
