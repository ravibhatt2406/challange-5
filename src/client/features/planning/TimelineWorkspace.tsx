import { useMemo, useState, useCallback, type FormEvent } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import type { TimelineItem } from '../../../shared/types/timeline';
import type { Event } from '../../../shared/types/event';
import TimelineHighway3D from './TimelineHighway3D';
import TimelineGanttTable from './TimelineGanttTable';
import { fireConfetti } from '../../shared/utils/confettiBurst';
import { planningApi } from '../../shared/api/client';
import { WorkspaceLayout, RecordList, FormError } from './WorkspaceComponents';

interface TimelineWorkspaceProps {
  eventId: string;
  event: Event | null;
  items: TimelineItem[];
  onChanged: () => Promise<void>;
}

export default function TimelineWorkspace({ eventId, event, items, onChanged }: TimelineWorkspaceProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editing, setEditing] = useState<TimelineItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [urgencyFilter, setUrgencyFilter] = useState<'All' | 'Overdue' | 'Due this week' | 'Upcoming' | 'Completed'>('All');
  const [viewMode, setViewMode] = useState<'3d-highway' | 'milestones' | 'run-of-show' | 'gantt-table'>(() =>
    prefersReducedMotion ? 'gantt-table' : '3d-highway'
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const getUrgency = useCallback((item: TimelineItem) => {
    if (item.status === 'completed') return 'Completed';
    if (!item.due_date) return 'Upcoming';
    const due = new Date(item.due_date);
    if (due < today) return 'Overdue';
    if (due <= endOfWeek) return 'Due this week';
    return 'Upcoming';
  }, [today, endOfWeek]);

  const counts = useMemo(() => {
    const map = { Overdue: 0, 'Due this week': 0, Upcoming: 0, Completed: 0 };
    items.forEach((item) => {
      const u = getUrgency(item);
      map[u]++;
    });
    return map;
  }, [items, getUrgency]);

  const filteredItems = useMemo(() => {
    if (urgencyFilter === 'All') return items;
    return items.filter((item) => getUrgency(item) === urgencyFilter);
  }, [items, urgencyFilter, getUrgency]);

  const autoSeedTimeline = async () => {
    setBusy(true); setError(null);
    try {
      const eventTime = event?.date ? new Date(event.date).getTime() : Date.now() + 60 * 86_400_000;
      const daysBefore = (days: number) => new Date(Math.max(Date.now() + 86_400_000, eventTime - days * 86_400_000)).toISOString();
      const milestones = [
        { title: 'Confirm Venue Contract & Deposit', due: daysBefore(45) },
        { title: 'Lock in Catering & Dietary Choices', due: daysBefore(30) },
        { title: 'Book Photographer & Music Team', due: daysBefore(21) },
        { title: 'Send Invitations & Confirm RSVPs', due: daysBefore(14) },
        { title: 'Day-Of Setup & Event Execution', due: daysBefore(0) },
      ];
      for (const m of milestones) {
        await planningApi.timeline.create(eventId, { title: m.title, due_date: m.due });
      }
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize timeline');
    } finally {
      setBusy(false);
    }
  };

  const save = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if (!title.trim()) { setError('Enter a task or milestone title.'); return; }
    setBusy(true); setError(null);
    try {
      const payload = { title, due_date: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined };
      if (editing) await planningApi.timeline.update(eventId, editing.id, payload);
      else await planningApi.timeline.create(eventId, payload);
      reset(); await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save milestone.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: TimelineItem) => {
    setBusy(true); setError(null);
    try {
      if (item.status !== 'completed') {
        fireConfetti(undefined, undefined, 50);
      }
      await planningApi.timeline.update(eventId, item.id, { status: item.status === 'completed' ? 'pending' : 'completed' });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update milestone.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: TimelineItem) => {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    setBusy(true);
    try {
      await planningApi.timeline.remove(eventId, item.id);
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete milestone.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setTitle(''); setDueDate(''); setEditing(null); };
  const edit = (item: TimelineItem) => {
    setEditing(item);
    setTitle(item.title);
    setDueDate(item.due_date ? item.due_date.slice(0, 10) : '');
  };

  // Day-Of Run of Show Templates
  const applyRunOfShowPreset = async (presetTitle: string) => {
    setTitle(presetTitle);
  };

  const runOfShowSuggestions = [
    '08:00 AM — Vendor & Catering Load-in',
    '10:30 AM — Decor, Floral & AV Soundcheck',
    '01:00 PM — Guest Arrival & Welcome Refreshments',
    '02:00 PM — Main Ceremony / Event Kickoff',
    '04:00 PM — Dinner, Toasts & Entertainment',
    '07:30 PM — Cake Cutting / Highlight Moment',
    '09:30 PM — Closing Remarks & Teardown',
  ];

  return (
    <WorkspaceLayout title="Timeline workspace" description="Create, edit, complete, and organize milestones and day-of schedules.">
      {/* View Mode Toggle: 3D Highway vs Milestones vs Day-Of Run-of-Show vs Accessible Gantt */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('3d-highway')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === '3d-highway'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/30 ring-1 ring-white/20'
              : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
          }`}
        >
          <span>🛣️</span> 3D Spatial Highway
        </button>
        <button
          type="button"
          onClick={() => setViewMode('gantt-table')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === 'gantt-table'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20'
              : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
          }`}
          title="Accessible 2D high-contrast Gantt table for screen readers and reduced motion"
        >
          <span>📊</span> Accessible 2D Gantt
        </button>
        <button
          type="button"
          onClick={() => setViewMode('milestones')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === 'milestones'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
          }`}
        >
          <span>📅</span> Milestone List
        </button>
        <button
          type="button"
          onClick={() => setViewMode('run-of-show')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === 'run-of-show'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
          }`}
        >
          <span>⏱️</span> Day-Of "Run-of-Show" View
        </button>
      </div>

      {/* Empty Milestones Helper */}
      {items.length === 0 && (
        <Card className="border border-brand-500/30 bg-brand-950/20 p-5 text-center">
          <p className="text-sm text-surface-200">
            No milestones have been added to your timeline yet.
          </p>
          <Button className="mt-3" size="sm" onClick={() => void autoSeedTimeline()} loading={busy}>
            ⚡ Add Starter Milestones for this Event
          </Button>
        </Card>
      )}

      {/* Day-Of Run of Show Banner */}
      {viewMode === 'run-of-show' && (
        <Card className="border border-brand-500/30 bg-brand-950/20 p-5">
          <div className="flex items-center gap-2 text-brand-300 font-semibold mb-2">
            <span>⏱️</span>
            <h3>Day-Of "Run-of-Show" Schedule Builder</h3>
          </div>
          <p className="text-xs text-surface-300 mb-3">
            Click any hour-by-hour slot below to quickly add it to your schedule:
          </p>
          <div className="flex flex-wrap gap-2">
            {runOfShowSuggestions.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => void applyRunOfShowPreset(slot)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-surface-200 hover:bg-brand-500/20 hover:border-brand-400 transition-colors"
              >
                + {slot}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Add / Edit Form */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-200 mb-3">
          {editing ? 'Edit Milestone' : viewMode === 'run-of-show' ? 'Add Day-Of Schedule Item' : 'Add Milestone'}
        </h3>
        <FormError error={error} />
        <form className="form-grid" onSubmit={save}>
          <Input
            label={viewMode === 'run-of-show' ? 'Hour & Activity' : 'Task or milestone'}
            required
            value={title}
            onChange={(eventInput) => setTitle(eventInput.target.value)}
            placeholder={viewMode === 'run-of-show' ? 'e.g. 02:00 PM — Main Ceremony' : 'e.g. Book Photographer Deposit'}
          />
          <Input label="Due date" type="date" value={dueDate} onChange={(eventInput) => setDueDate(eventInput.target.value)} />
          <div className="flex items-end gap-2">
            <Button type="submit" loading={busy}>{editing ? 'Save changes' : 'Add milestone'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Card>

      {/* Urgency Filter Pills & Timeline Records */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-surface-200">
            {viewMode === 'run-of-show' ? 'Day-Of Schedule' : 'Milestones'} ({filteredItems.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Overdue', 'Due this week', 'Upcoming', 'Completed'] as const).map((filter) => {
              const count = filter === 'All' ? items.length : counts[filter];
              const isOverdue = filter === 'Overdue' && count > 0;
              const isDueThisWeek = filter === 'Due this week' && count > 0;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setUrgencyFilter(filter)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    urgencyFilter === filter
                      ? 'bg-brand-500 text-white shadow-sm'
                      : isOverdue
                      ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                      : isDueThisWeek
                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-white/5 text-surface-400 hover:text-surface-200 hover:bg-white/10'
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {viewMode === '3d-highway' ? (
          <TimelineHighway3D
            items={filteredItems}
            onToggle={toggle}
            onEdit={edit}
            onRemove={remove}
            busy={busy}
          />
        ) : viewMode === 'gantt-table' ? (
          <TimelineGanttTable
            items={filteredItems}
            onToggle={toggle}
            onEdit={edit}
            onRemove={remove}
            busy={busy}
          />
        ) : (
          <RecordList
            empty="No tasks match this filter."
            records={filteredItems.map((item) => {
              const urgency = getUrgency(item);
              let badgeStyle = 'bg-surface-700/50 text-surface-300';
              if (urgency === 'Overdue') badgeStyle = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
              else if (urgency === 'Due this week') badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
              else if (urgency === 'Completed') badgeStyle = 'bg-emerald-500/20 text-emerald-300';

              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-surface-200 border-b border-white/5 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}>
                      {urgency}
                    </span>
                    <span className={item.status === 'completed' ? 'line-through text-surface-500' : 'text-surface-100 font-medium'}>
                      {item.title}
                    </span>
                    {item.due_date && (
                      <span className="text-xs text-surface-400">
                        📅 {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => void toggle(item)} disabled={busy} variant={item.status === 'completed' ? 'secondary' : 'primary'}>
                      {item.status === 'completed' ? 'Reopen' : '✓ Complete'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => edit(item)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => void remove(item)} disabled={busy}>Delete</Button>
                  </span>
                </li>
              );
            })}
          />
        )}
      </Card>
    </WorkspaceLayout>
  );
}

