import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import Select from '../../shared/components/Select';
import Icon from '../../shared/components/Icon';
import { EVENT_TYPE_DESCRIPTIONS, EVENT_TYPE_LABELS, EVENT_TYPES } from '../../../shared/constants/eventTypes';
import type { EventWizardData } from '../../../shared/schemas/eventWizard.schema';

/** Shared contract for each wizard step's controlled form fields. */
interface StepProps {
  data: EventWizardData;
  errors: Record<string, string>;
  update: (field: keyof EventWizardData, value: EventWizardData[keyof EventWizardData]) => void;
}

export function EventTypeStep({ data, errors, update }: StepProps) {
  return (
    <section aria-labelledby="step-title">
      <p className="eyebrow">Step 1 of 5</p>
      <h2 id="step-title" className="page-title">What are you planning?</h2>
      <p className="page-subtitle">Start with the event type so your future plan can be tailored to the right checklist and ideas.</p>
      <fieldset className="mt-8">
        <legend className="sr-only">Event type</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {EVENT_TYPES.map((type) => {
            const selected = data.type === type;
            return (
              <button
                type="button"
                key={type}
                className={`event-type-card ${selected ? 'event-type-card-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => update('type', type)}
              >
                <span className="event-type-icon" aria-hidden="true">
                  <Icon name={type === 'wedding' ? 'sparkles' : type === 'birthday' ? 'lightbulb' : 'users'} className="h-6 w-6" />
                </span>
                <span className="font-display text-lg font-semibold text-surface-100">{EVENT_TYPE_LABELS[type]}</span>
                <span className="mt-2 text-sm leading-6 text-surface-400">{EVENT_TYPE_DESCRIPTIONS[type]}</span>
                <span className={`mt-5 text-xs font-semibold uppercase tracking-wider ${selected ? 'text-brand-300' : 'text-surface-600'}`}>
                  {selected ? 'Selected' : 'Choose type'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {errors.type && <p className="form-error mt-3" role="alert">{errors.type}</p>}
    </section>
  );
}

export function DetailsStep({ data, errors, update }: StepProps) {
  return (
    <section aria-labelledby="step-title">
      <p className="eyebrow">Step 2 of 5</p>
      <h2 id="step-title" className="page-title">Set the essentials</h2>
      <p className="page-subtitle">These details help shape the timeline and recommendations for your plan.</p>
      <div className="form-grid mt-8">
        <Input label="Event name" required value={data.name} error={errors.name} onChange={(event) => update('name', event.target.value)} maxLength={200} placeholder="e.g. Maya & Alex's wedding" />
        <Input label="Location" value={data.location} error={errors.location} onChange={(event) => update('location', event.target.value)} maxLength={500} placeholder="Venue, city, or online" />
        <Input label="Event date" required type="date" value={data.date} error={errors.date} onChange={(event) => update('date', event.target.value)} />
        <Input label="Start time" type="time" value={data.startTime} error={errors.startTime} onChange={(event) => update('startTime', event.target.value)} />
        <Input label="Expected guests" required type="number" min={1} max={100000} value={data.guestCount || ''} error={errors.guestCount} onChange={(event) => update('guestCount', event.target.value === '' ? 0 : Number(event.target.value))} />
      </div>
    </section>
  );
}

export function BudgetStep({ data, errors, update }: StepProps) {
  return (
    <section aria-labelledby="step-title">
      <p className="eyebrow">Step 3 of 5</p>
      <h2 id="step-title" className="page-title">Plan around your budget</h2>
      <p className="page-subtitle">A clear starting point helps prioritize the right vendors and ideas later.</p>
      <div className="form-grid mt-8">
        <Input label="Budget amount" required type="number" min={0} step="0.01" value={data.budgetAmount || ''} error={errors.budgetAmount} onChange={(event) => update('budgetAmount', event.target.value === '' ? 0 : Number(event.target.value))} placeholder="0.00" />
        <Select label="Currency" value={data.currency} options={['USD', 'CAD', 'GBP', 'EUR', 'AUD'].map((currency) => ({ value: currency, label: currency }))} onChange={(event) => update('currency', event.target.value)} />
        <div className="md:col-span-2">
          <Input label="Important spending priorities" value={data.priorities} error={errors.priorities} onChange={(event) => update('priorities', event.target.value)} maxLength={500} placeholder="e.g. Great food, live music, accessible venue" hint="Optional. Separate multiple priorities with commas." />
        </div>
        <div className="md:col-span-2">
          <Select label="Spending flexibility" value={data.flexibility} options={[{ value: 'fixed', label: 'Keep close to this amount' }, { value: 'some-flexibility', label: 'Some flexibility' }, { value: 'flexible', label: 'Flexible if the value is right' }]} onChange={(event) => update('flexibility', event.target.value)} />
        </div>
      </div>
    </section>
  );
}

const THEME_PRESETS: Record<string, string[]> = {
  wedding: ['Modern Garden Party', 'Rustic Barn Elegance', 'Classic Black Tie', 'Bohemian Beach', 'Traditional Cultural'],
  birthday: ['Milestone Decade Gala', 'Retro 80s/90s Arcade', 'Neon Glow Party', 'Cozy Backyard BBQ', 'Mystery / Game Night'],
  community: ['Neighborhood Block Party', 'Cultural Arts & Food Fair', 'Charity Run & Festival', 'Farmers Market & Music', 'Youth Sports Rally'],
};
const DEFAULT_THEME_PRESETS = ['Modern Garden Party', 'Milestone Gala', 'Community Festival'];

export function PersonalizationStep({ data, errors, update }: StepProps) {
  const presets = THEME_PRESETS[data.type] ?? DEFAULT_THEME_PRESETS;

  return (
    <section aria-labelledby="step-title">
      <p className="eyebrow">Step 4 of 5</p>
      <h2 id="step-title" className="page-title">Make it yours</h2>
      <p className="page-subtitle">Add context that will make future recommendations more useful and respectful.</p>
      <div className="form-grid mt-8">
        <div className="md:col-span-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-surface-400">Popular {EVENT_TYPE_LABELS[data.type]} Themes:</span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => update('style', preset)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  data.style === preset
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-surface-400 hover:text-surface-200 hover:bg-white/10'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <Input label="Preferred style or theme" value={data.style} error={errors.style} onChange={(event) => update('style', event.target.value)} maxLength={500} placeholder="e.g. Modern garden party, retro arcade" />
        </div>
        <div className="md:col-span-2">
          <Input label="Cultural preferences" value={data.culturalPreferences} error={errors.culturalPreferences} onChange={(event) => update('culturalPreferences', event.target.value)} maxLength={1000} placeholder="Traditions, ceremonies, or languages to include" />
        </div>
        <div className="md:col-span-2">
          <Input label="Dietary requirements" value={data.dietaryRequirements} error={errors.dietaryRequirements} onChange={(event) => update('dietaryRequirements', event.target.value)} maxLength={1000} placeholder="Allergies, dietary patterns, or menu notes" />
        </div>
        <div className="md:col-span-2">
          <Input label="Accessibility requirements" value={data.accessibilityRequirements} error={errors.accessibilityRequirements} onChange={(event) => update('accessibilityRequirements', event.target.value)} maxLength={1000} placeholder="Mobility, hearing, visual, sensory, or other needs" />
        </div>
        <div className="md:col-span-2">
          <Input label="Additional notes" value={data.notes} error={errors.notes} onChange={(event) => update('notes', event.target.value)} maxLength={2000} placeholder="Anything else your planning team should know" />
        </div>
      </div>
    </section>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="review-row">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-surface-500">{label}</dt>
        <dd className="mt-1 text-sm text-surface-100">{value || 'Not provided'}</dd>
      </div>
      <button type="button" className="text-sm font-semibold text-brand-300 hover:text-brand-200" onClick={onEdit}>Edit</button>
    </div>
  );
}

export function ReviewStep({ data, onEdit }: { data: EventWizardData; onEdit: (step: number) => void }) {
  const budget = new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency }).format(data.budgetAmount);
  return (
    <section aria-labelledby="step-title">
      <p className="eyebrow">Step 5 of 5</p>
      <h2 id="step-title" className="page-title">Review your plan brief</h2>
      <p className="page-subtitle">Confirm the details below. Your event plan will be saved so you can keep building it.</p>
      <Card className="mt-8">
        <dl>
          <ReviewRow label="Event" value={`${data.name} · ${data.type}`} onEdit={() => onEdit(1)} />
          <ReviewRow label="Date and guests" value={`${data.date}${data.startTime ? ` at ${data.startTime}` : ''} · ${data.guestCount.toLocaleString()} guests`} onEdit={() => onEdit(2)} />
          <ReviewRow label="Budget" value={`${budget} · ${data.flexibility.replace('-', ' ')}`} onEdit={() => onEdit(3)} />
          <ReviewRow label="Priorities" value={data.priorities} onEdit={() => onEdit(3)} />
          <ReviewRow label="Personalization" value={data.style || data.culturalPreferences || data.dietaryRequirements || data.accessibilityRequirements || data.notes} onEdit={() => onEdit(4)} />
        </dl>
      </Card>
      <div className="notice mt-5" role="status">
        <Icon name="sparkles" className="h-5 w-5 shrink-0 text-brand-300" />
        <p>Your brief is ready. Create the plan to open your budget, timeline, vendor checklist, ideas, and AI copilot.</p>
      </div>
    </section>
  );
}
