import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { aiApi, eventsApi } from '../../shared/api/client';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import Badge from '../../shared/components/Badge';
import type { CopilotResponse, StoredPlan } from '../../../shared/types/ai';
import type { Event } from '../../../shared/types/event';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, type EventType } from '../../../shared/constants/eventTypes';
import { EVENT_THEMES } from '../../shared/constants/eventThemes';
import BackButton from '../../shared/components/BackButton';
import AIOrb from '../../shared/components/AIOrb';
import Tilt3DCard from '../../shared/components/Tilt3DCard';
import { fireConfetti } from '../../shared/utils/confettiBurst';

const STARTER_PROMPTS: Record<EventType, string[]> = {
  wedding: [
    'Suggest a seating and ceremony timeline for a 120-guest wedding',
    'What are essential floral and decor arrangements for a wedding?',
    'How should we structure the rehearsal dinner and day-of hair & makeup?',
  ],
  birthday: [
    'Create a milestone birthday party theme & playlist ideas',
    'Plan a cake-cutting and surprise activity schedule',
    'Balanced kid and adult catering ideas for a birthday',
  ],
  community: [
    'What city permits do I need for a park community festival?',
    'Create a volunteer coordination and shift checklist',
    'Crowd safety, waste management and booth layout guide',
  ],
};

const QUICK_ACTIONS = [
  'Find areas to cut 15% budget',
  'Suggest day-of schedule',
  'Check missing vendors',
  'Draft top 5 personalized ideas',
];

/** Provides accessible question, response, and explicit proposal confirmation flows. */
export default function AICopilot() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState<CopilotResponse | null>(null);
  const [plan, setPlan] = useState<StoredPlan | null>(null);
  const [versions, setVersions] = useState<StoredPlan[]>([]);
  const [providerLabel, setProviderLabel] = useState('AI provider');
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState('Analyzing event context...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void aiApi.status().then((status) => setProviderLabel(status.label)).catch(() => setProviderLabel('AI provider unavailable'));
    if (id) {
      eventsApi.getById(id).then(setEvent).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (!busy) return;
    const steps = [
      'Reviewing your event details & budget...',
      'Evaluating timeline milestones & vendors...',
      'Formulating contextual recommendations...',
      'Polishing personalized guidance...',
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setBusyStep(steps[index] ?? 'Analyzing event context...');
    }, 1800);
    return () => clearInterval(interval);
  }, [busy]);

  const askQuery = async (queryText: string) => {
    if (!id || !queryText.trim()) return;
    setBusy(true); setError(null);
    try {
      setAnswer(await aiApi.copilot(id, queryText));
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to contact the AI assistant.');
    } finally {
      setBusy(false);
    }
  };

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    await askQuery(message);
  };

  const generate = async () => {
    if (!id) return;
    setBusy(true); setError(null);
    try {
      const generated = await aiApi.generatePlan(id);
      setPlan(generated);
      setVersions(await aiApi.listPlans(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate a plan.');
    } finally {
      setBusy(false);
    }
  };

  const applyPlan = async () => {
    if (!id || !plan) return;
    setBusy(true); setError(null);
    try {
      const applied = await aiApi.applyPlan(id, plan.plan_id);
      setPlan(applied);
      setVersions(await aiApi.listPlans(id));
      fireConfetti(undefined, undefined, 75);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The plan could not be applied.');
    } finally {
      setBusy(false);
    }
  };

  const printPlan = () => window.print();

  const confirm = async () => {
    if (!id || !answer?.proposal) return;
    setBusy(true); setError(null);
    try {
      if (!answer.proposal.proposal_id) throw new Error('This proposal is no longer available. Ask the copilot again.');
      await aiApi.confirmProposal(id, answer.proposal.proposal_id);
      fireConfetti(undefined, undefined, 60);
      const actionType = answer.proposal.action;
      const label = actionType.includes('timeline')
        ? 'The confirmed timeline milestone was added to your schedule.'
        : actionType.includes('vendor')
          ? 'The confirmed vendor recommendation was added to your checklist.'
          : 'The confirmed budget change was saved.';
      setAnswer({ ...answer, proposal: null, answer: label });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The proposal could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const eventType = event?.type ?? 'wedding';
  const eventTheme = EVENT_THEMES[eventType];
  const starterPrompts = STARTER_PROMPTS[eventType] || STARTER_PROMPTS.wedding;

  return (
    <div className="space-y-5 animate-fade-in">
      <BackButton />
      
      {/* Header */}
      <div className={`rounded-2xl border p-5 bg-gradient-to-r relative overflow-hidden ${eventTheme?.gradientBg || 'from-surface-900 to-surface-800'} ${eventTheme?.borderAccent || 'border-white/10'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <AIOrb
              state={busy ? 'thinking' : answer ? 'answered' : 'idle'}
              size={84}
              className="flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl" role="img" aria-label="Event type">
                  {event ? EVENT_TYPE_ICONS[event.type] : '✨'}
                </span>
                <p className="eyebrow">Context-aware planning</p>
                {event && (
                  <Badge color={eventTheme.badgeColor} size="sm">
                    {EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                )}
              </div>
              <h1 className="page-title text-2xl font-bold text-surface-100">
                {event ? `${event.title} — AI Copilot` : 'AI Copilot'}
              </h1>
              <p className="page-subtitle text-sm text-surface-400">
                Ask questions tailored to your event type or generate a full structured plan.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs text-brand-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {providerLabel}
          </span>
        </div>
      </div>

      {/* Plan Generation Card */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Structured plan preview</h2>
            <p className="text-sm text-surface-400">
              Review proposed records before applying them to your budget, timeline, vendors, and ideas.
            </p>
          </div>
          <Button onClick={generate} loading={busy}>
            ✨ Generate plan
          </Button>
        </div>
        {plan && (
          <div className="mt-4 space-y-4 text-sm text-surface-300">
            <div className="flex flex-wrap gap-2 text-xs text-surface-500">
              <span>Version generated {new Date(plan.generated_at).toLocaleString()}</span>
              <span>{plan.applied_at ? 'Applied' : 'Preview only'}</span>
            </div>
            <p className="rounded-lg bg-white/5 p-3 text-surface-200">{plan.plan.summary}</p>
            <p>
              <strong>{plan.plan.budget_proposal.categories.length}</strong> budget categories ·{' '}
              <strong>{plan.plan.timeline.length}</strong> timeline tasks ·{' '}
              <strong>{plan.plan.vendor_checklist.length}</strong> vendors ·{' '}
              <strong>{plan.plan.personalized_ideas.length}</strong> ideas
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <PreviewList title="Budget proposals" items={plan.plan.budget_proposal.categories.map((item) => `${item.category}: $${item.amount.toFixed(2)}`)} />
              <PreviewList title="Timeline proposals" items={plan.plan.timeline.map((item) => `${item.title} — ${new Date(item.due_date).toLocaleDateString()}`)} />
              <PreviewList title="Vendor checklist" items={plan.plan.vendor_checklist.map((item) => item.category)} />
              <PreviewList title="Personalized ideas" items={plan.plan.personalized_ideas.map((item) => item.title)} />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={applyPlan} loading={busy} disabled={Boolean(plan.applied_at)}>
                Apply this plan
              </Button>
              <Button variant="secondary" onClick={printPlan}>
                Print / save PDF
              </Button>
            </div>
          </div>
        )}
        {versions.length > 1 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-surface-200">Plan versions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {versions.map((version) => (
                <Button key={version.plan_id} size="sm" variant="secondary" onClick={() => setPlan(version)}>
                  {new Date(version.generated_at).toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Interactive Copilot Chat with Starter Chips and Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
          <span>💬</span> Ask about your event
        </h2>

        {/* Quick Action Pills */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                disabled={busy}
                onClick={() => {
                  setMessage(action);
                  void askQuery(action);
                }}
                className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 hover:bg-brand-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                ⚡ {action}
              </button>
            ))}
          </div>
        </div>

        {/* Event-Type Starter Prompt Chips */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
            {event ? `${EVENT_TYPE_LABELS[event.type]} Ideas & Questions` : 'Suggested Questions'}
          </p>
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={busy}
                onClick={() => {
                  setMessage(prompt);
                  void askQuery(prompt);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-surface-300 hover:border-white/20 hover:text-surface-100 transition-all text-left active:scale-98 disabled:opacity-50"
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={ask}>
          <div className="flex-1">
            <Input
              label="Ask anything about your budget, timeline, or vendors"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., What should I complete this week? or How to cut catering costs?"
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={busy}>
              Send
            </Button>
          </div>
        </form>

        {/* Animated Typing / Thinking State */}
        {busy && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-950/40 p-4 animate-pulse">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-brand-300">AI Copilot is thinking...</span>
              <p className="text-xs text-surface-400">{busyStep}</p>
            </div>
          </div>
        )}

        {error && <p className="form-error mt-3" role="alert">{error}</p>}

        {/* Answer Output */}
        {answer && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-surface-200">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-300">
              <span>✨</span>
              <span>Copilot Response</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{answer.answer}</p>
            {answer.clarification_question && (
              <div className="mt-3 rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-brand-200">
                <span className="font-semibold">Next Step: </span>
                {answer.clarification_question}
              </div>
            )}
            {answer.proposal && (
              <Tilt3DCard intensity={8} glare={true} className="mt-4 rounded-xl">
                <div className="rounded-xl border border-brand-500/40 bg-gradient-to-br from-brand-950/30 to-surface-900 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300 mb-1">
                    <span>⚡</span> 3D Interactive AI Proposal
                  </div>
                  <p className="font-medium text-surface-100">{answer.proposal.explanation}</p>
                  <p className="mt-1 text-surface-400">
                    Expected budget impact: <strong className="text-emerald-400">${answer.proposal.expected_budget_impact.toFixed(2)}</strong>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={confirm} loading={busy}>
                      Confirm change
                    </Button>
                    <Button variant="secondary" onClick={() => setAnswer({ ...answer, proposal: null })}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Tilt3DCard>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h3 className="font-medium text-surface-200 text-xs uppercase tracking-wider">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-surface-400">
        {items.slice(0, 6).map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
