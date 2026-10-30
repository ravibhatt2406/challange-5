import { useMemo } from 'react';
import type { TimelineItem } from '../../../shared/types/timeline';

interface TimelineGanttTableProps {
  /** List of timeline milestone items to render in the Gantt table */
  items: TimelineItem[];
  /** Toggle a milestone between completed and pending */
  onToggle: (item: TimelineItem) => void;
  /** Open the edit form for a milestone */
  onEdit: (item: TimelineItem) => void;
  /** Remove a milestone after confirmation */
  onRemove: (item: TimelineItem) => void;
  /** Whether an async operation is in progress */
  busy?: boolean;
}

/**
 * Computes the urgency label for a timeline item based on its status and due date.
 */
function getItemUrgency(item: TimelineItem): 'completed' | 'overdue' | 'pending' {
  if (item.status === 'completed') return 'completed';
  if (item.due_date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (new Date(item.due_date) < now) return 'overdue';
  }
  return 'pending';
}

/** Status badge color mappings for accessibility (high-contrast) */
const STATUS_BADGE_STYLES: Record<ReturnType<typeof getItemUrgency>, string> = {
  completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  overdue: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
};

const STATUS_LABELS: Record<ReturnType<typeof getItemUrgency>, string> = {
  completed: 'Completed',
  overdue: 'Overdue',
  pending: 'Pending',
};

/**
 * TimelineGanttTable — a fully accessible, 2D high-contrast Gantt-style table
 * view for users who prefer reduced motion or need an alternative to the 3D
 * spatial highway timeline.
 *
 * Features:
 * - Semantic `<table>` with `<thead>`, `<tbody>`, proper `<th scope>` attributes
 * - ARIA region wrapper with descriptive label
 * - Relative timeline bar visualization per row
 * - High-contrast status badges (green / amber / red)
 * - Keyboard-navigable action buttons with focus-visible ring styles
 */
export default function TimelineGanttTable({
  items,
  onToggle,
  onEdit,
  onRemove,
  busy = false,
}: TimelineGanttTableProps) {
  /**
   * Compute the earliest and latest due dates across all items so we can
   * render a proportional horizontal bar for each milestone.
   */
  const { minTime, maxTime } = useMemo(() => {
    const timestamps = items
      .filter((i) => i.due_date)
      .map((i) => new Date(i.due_date!).getTime());

    if (timestamps.length === 0) {
      return { minTime: 0, maxTime: 1 };
    }

    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    // Prevent division by zero when all items share the same date
    return { minTime: min, maxTime: max === min ? max + 1 : max };
  }, [items]);

  /**
   * Returns a 0–100 percentage representing where this item falls within the
   * overall timeline range (earliest → latest due date).
   */
  const getBarPercent = (item: TimelineItem): number => {
    if (!item.due_date) return 0;
    const t = new Date(item.due_date).getTime();
    return Math.max(0, Math.min(100, ((t - minTime) / (maxTime - minTime)) * 100));
  };

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-surface-400" role="status">
        No milestones match this filter.
      </div>
    );
  }

  return (
    <figure
      role="region"
      aria-label="Accessible Timeline Gantt Chart"
      className="overflow-x-auto rounded-xl border border-white/10 bg-surface-900/80"
    >
      <table className="w-full min-w-[700px] text-sm text-left">
        <caption className="sr-only">
          Event timeline milestones and scheduling overview
        </caption>

        <thead className="border-b border-white/10 bg-surface-900">
          <tr>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-10">
              #
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
              Task Title
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-32">
              Due Date
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-28">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-44">
              Dependencies
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-48">
              Relative Timeline
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 w-48 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {items.map((item, index) => {
            const urgency = getItemUrgency(item);
            const barPercent = getBarPercent(item);
            const isCompleted = item.status === 'completed';

            return (
              <tr
                key={item.id}
                className="transition-colors hover:bg-white/[0.03]"
              >
                {/* Row number */}
                <td className="px-4 py-3 text-surface-500 font-mono text-xs">
                  {index + 1}
                </td>

                {/* Task title + description */}
                <td className="px-4 py-3">
                  <div
                    className={`font-medium ${
                      isCompleted
                        ? 'line-through text-surface-500'
                        : 'text-surface-100'
                    }`}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-surface-400 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </td>

                {/* Due date */}
                <td className="px-4 py-3 text-xs text-surface-300 font-mono whitespace-nowrap">
                  {item.due_date
                    ? new Date(item.due_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>

                {/* Status badge */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLES[urgency]}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        urgency === 'completed'
                          ? 'bg-emerald-400'
                          : urgency === 'overdue'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`}
                      aria-hidden="true"
                    />
                    {STATUS_LABELS[urgency]}
                  </span>
                </td>

                {/* Dependencies */}
                <td className="px-4 py-3">
                  {item.dependencies && item.dependencies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.dependencies.map((depId) => {
                        const parent = items.find((it) => it.id === depId);
                        const isParentDone = parent?.status === 'completed';
                        return (
                          <span
                            key={depId}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] border ${
                              isParentDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {isParentDone ? '✓' : '⏳'}{' '}
                            {parent ? parent.title : `Task ${depId.slice(0, 6)}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-surface-500">None</span>
                  )}
                </td>

                {/* Relative timeline bar */}
                <td className="px-4 py-3">
                  <div
                    className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        isCompleted
                          ? 'bg-emerald-500/60'
                          : urgency === 'overdue'
                          ? 'bg-rose-500/60'
                          : 'bg-brand-500/60'
                      }`}
                      style={{ width: `${Math.max(barPercent, 4)}%` }}
                    />
                  </div>
                  {item.due_date && (
                    <span className="sr-only">
                      Timeline position: {Math.round(barPercent)}%
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      disabled={busy}
                      aria-label={
                        isCompleted
                          ? `Reopen milestone: ${item.title}`
                          : `Mark milestone complete: ${item.title}`
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 ${
                        isCompleted
                          ? 'bg-surface-700/50 text-surface-300 hover:bg-surface-600/50'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {isCompleted ? '↩ Reopen' : '✓ Complete'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      disabled={busy}
                      aria-label={`Edit milestone: ${item.title}`}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      disabled={busy}
                      aria-label={`Delete milestone: ${item.title}`}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
