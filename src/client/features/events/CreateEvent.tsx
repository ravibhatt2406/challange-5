import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Icon from '../../shared/components/Icon';
import { eventsApi } from '../../shared/api/client';
import { showToast } from '../../shared/components/toastBus';
import {
  eventWizardSchema,
  initialEventWizardData,
  type EventWizardData,
} from '../../../shared/schemas/eventWizard.schema';
import {
  BudgetStep,
  DetailsStep,
  EventTypeStep,
  PersonalizationStep,
  ReviewStep,
} from './eventWizardSteps';

/**
 * Collects a planning brief without claiming persistence until the backend
 * event-creation flow persists the brief before opening its planning workspace.
 */
const DRAFT_KEY = 'eventcraft:event-wizard:draft';
const MAX_STEP = 5;

function readDraft(): EventWizardData {
  try {
    const stored = sessionStorage.getItem(DRAFT_KEY);
    if (!stored) return initialEventWizardData;
    const parsed = eventWizardSchema.partial().safeParse(JSON.parse(stored));
    return parsed.success ? { ...initialEventWizardData, ...parsed.data } : initialEventWizardData;
  } catch {
    return initialEventWizardData;
  }
}

function getStep(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_STEP ? parsed : 1;
}

function validateStep(step: number, data: EventWizardData): Record<string, string> {
  const fieldsByStep: Record<number, (keyof EventWizardData)[]> = {
    1: ['type'],
    2: ['name', 'date', 'location', 'guestCount'],
    3: ['budgetAmount', 'currency', 'priorities', 'flexibility'],
    4: ['style', 'culturalPreferences', 'dietaryRequirements', 'notes', 'accessibilityRequirements'],
    5: [],
  };
  const fields = fieldsByStep[step] ?? [];
  const result = eventWizardSchema.safeParse(data);
  if (result.success) return {};

  return Object.fromEntries(
    result.error.issues
      .filter((issue) => fields.includes(issue.path[0] as keyof EventWizardData))
      .map((issue) => [String(issue.path[0]), issue.message]),
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<EventWizardData>(readDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const cancelCloseRef = useRef<HTMLButtonElement>(null);
  const hadCancelDialogOpen = useRef(false);
  const step = getStep(searchParams.get('step'));

  useEffect(() => {
    if (isCancelDialogOpen) {
      cancelCloseRef.current?.focus();
      hadCancelDialogOpen.current = true;
    } else if (hadCancelDialogOpen.current) {
      cancelTriggerRef.current?.focus();
    }
  }, [isCancelDialogOpen]);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data]);

  const progress = useMemo(() => `${(step / MAX_STEP) * 100}%`, [step]);

  const update = (field: keyof EventWizardData, value: EventWizardData[keyof EventWizardData]) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const goToStep = (nextStep: number, replace = false) => {
    setErrors({});
    setSearchParams({ step: String(nextStep) }, { replace });
  };

  const handleNext = () => {
    const nextErrors = validateStep(step, data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    goToStep(Math.min(step + 1, MAX_STEP));
  };

  const handleBack = () => {
    if (step === 1) {
      setIsCancelDialogOpen(true);
      return;
    }
    goToStep(step - 1);
  };

  const handleReviewSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = eventWizardSchema.safeParse(data);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const created = await eventsApi.create({
        type: result.data.type,
        title: result.data.name,
        date: result.data.startTime
          ? new Date(`${result.data.date}T${result.data.startTime}`).toISOString()
          : new Date(`${result.data.date}T00:00:00`).toISOString(),
        location: result.data.location || undefined,
        guest_count: result.data.guestCount,
        budget_amount: result.data.budgetAmount,
        currency: result.data.currency,
        metadata: {
          priorities: result.data.priorities,
          flexibility: result.data.flexibility,
          style: result.data.style,
          culturalPreferences: result.data.culturalPreferences,
          dietaryRequirements: result.data.dietaryRequirements,
          accessibilityRequirements: result.data.accessibilityRequirements,
          notes: result.data.notes,
        },
      });
      sessionStorage.removeItem(DRAFT_KEY);
      showToast('Event plan created successfully', 'success');
      navigate(`/events/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the event plan';
      setErrors({ submit: message });
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const discardDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="eyebrow">New planning brief</p>
          <h1 className="page-title">Create your event plan</h1>
          <p className="page-subtitle">A focused five-step setup for a plan that fits your event.</p>
        </div>
        <button ref={cancelTriggerRef} type="button" className="icon-button" aria-label="Cancel event setup" onClick={() => setIsCancelDialogOpen(true)}>
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-8" aria-label={`Step ${step} of ${MAX_STEP}`}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-surface-500">
          <span>Planning brief</span>
          <span>{step} / {MAX_STEP}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: progress }} />
        </div>
        <ol className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
          {['Type', 'Details', 'Budget', 'Personalize', 'Review'].map((label, index) => {
            const itemStep = index + 1;
            return (
              <li key={label} className={`text-xs ${itemStep <= step ? 'text-brand-300' : 'text-surface-600'}`}>
                <span className="font-semibold">{itemStep}.</span> {label}
              </li>
            );
          })}
        </ol>
      </div>

      <form onSubmit={handleReviewSubmit} noValidate>
        <div className="surface-panel p-5 sm:p-8">
          {step === 1 && <EventTypeStep data={data} errors={errors} update={update} />}
          {step === 2 && <DetailsStep data={data} errors={errors} update={update} />}
          {step === 3 && <BudgetStep data={data} errors={errors} update={update} />}
          {step === 4 && <PersonalizationStep data={data} errors={errors} update={update} />}
          {step === 5 && <ReviewStep data={data} onEdit={goToStep} />}
          {errors.submit && <p className="form-error mt-5" role="alert">{errors.submit}</p>}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={handleBack}>
            <Icon name="arrow-left" className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < MAX_STEP ? (
            <Button type="button" onClick={handleNext}>
              Continue
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              Create event plan
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {isCancelDialogOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsCancelDialogOpen(false);
        }}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Leave setup?</p>
                <h2 id="cancel-title" className="text-xl font-semibold text-surface-100">Discard this planning brief?</h2>
              </div>
              <button ref={cancelCloseRef} type="button" className="icon-button" aria-label="Close cancel dialog" onClick={() => setIsCancelDialogOpen(false)}>
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-surface-400">Your current values are kept in this browser session. You can continue later or discard them now.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Continue editing</Button>
              <Button type="button" variant="danger" onClick={discardDraft}>Discard brief</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
