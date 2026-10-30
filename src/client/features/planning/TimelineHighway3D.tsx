import { useState } from 'react';
import type { TimelineItem } from '../../../shared/types/timeline';
import Tilt3DCard from '../../shared/components/Tilt3DCard';
import { fireConfetti } from '../../shared/utils/confettiBurst';

interface TimelineHighway3DProps {
  items: TimelineItem[];
  onToggle: (item: TimelineItem) => void;
  onEdit: (item: TimelineItem) => void;
  onRemove: (item: TimelineItem) => void;
  busy?: boolean;
}

/**
 * 3D Spatial "Highway" Timeline.
 * Renders an isometric perspective pathway with a glowing center energy trace line,
 * left/right alternating milestone cards with mouse-tracking 3D tilt,
 * pulsing node checkpoints, and glowing trace pulses on hover.
 */
export default function TimelineHighway3D({
  items,
  onToggle,
  onEdit,
  onRemove,
  busy = false,
}: TimelineHighway3DProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const handleToggle = (item: TimelineItem, e: React.MouseEvent) => {
    if (item.status !== 'completed') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
    }
    onToggle(item);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative py-8 px-4 overflow-hidden select-none">
      {/* Perspective Isometric Canvas Container */}
      <div
        className="relative mx-auto max-w-4xl"
        style={{
          perspective: '1200px',
        }}
      >
        {/* Glowing Central Highway Spine */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-0"
          style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.8) 50%, rgba(236,72,153,0.3) 100%)',
            boxShadow: '0 0 15px rgba(139,92,246,0.5), 0 0 30px rgba(99,102,241,0.3)',
          }}
        >
          {/* Traveling energy pulse */}
          <div
            className="absolute left-0 w-full h-24 bg-gradient-to-b from-transparent via-white to-transparent animate-pulse"
            style={{
              animationDuration: '3s',
            }}
          />
        </div>

        {/* Milestone Nodes & Alternating Cards */}
        <div className="relative z-10 space-y-12">
          {items.map((item, index) => {
            const isLeft = index % 2 === 0;
            const isCompleted = item.status === 'completed';
            const isHovered = hoveredId === item.id;

            return (
              <div
                key={item.id}
                className={`relative flex items-center ${isLeft ? 'justify-start md:pr-[50%]' : 'justify-end md:pl-[50%]'}`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Central Node Checkpoint */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                  onClick={(e) => handleToggle(item, e)}
                  title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                >
                  <div
                    className={`relative h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-lg ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-4 ring-emerald-500/20'
                        : isHovered
                        ? 'bg-brand-500 text-white shadow-brand-500/60 ring-4 ring-brand-500/30'
                        : 'bg-surface-800 text-surface-300 border-2 border-white/20'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}

                    {/* Animated Pulsing Checkpoint Ring */}
                    {isHovered && (
                      <span className="absolute -inset-2 rounded-full border border-brand-400 animate-ping opacity-75 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Connecting Beam */}
                <div
                  className={`hidden md:block absolute top-1/2 h-0.5 transition-all ${
                    isLeft
                      ? 'right-1/2 left-auto mr-4.5 w-12 bg-gradient-to-r from-transparent to-brand-500'
                      : 'left-1/2 right-auto ml-4.5 w-12 bg-gradient-to-l from-transparent to-brand-500'
                  } ${isHovered ? 'opacity-100 shadow-[0_0_10px_#8B5CF6]' : 'opacity-40'}`}
                />

                {/* 3D Tilted Milestone Card */}
                <div className={`w-full md:max-w-md ${isLeft ? 'md:mr-16' : 'md:ml-16'}`}>
                  <Tilt3DCard
                    intensity={prefersReducedMotion ? 0 : 10}
                    glare={!prefersReducedMotion}
                    className={`rounded-2xl border transition-all duration-300 ${
                      isCompleted
                        ? 'bg-surface-900/80 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                        : isHovered
                        ? 'bg-gradient-to-br from-surface-850 to-surface-900 border-brand-500/50 shadow-2xl shadow-brand-950/40'
                        : 'bg-surface-900/90 border-white/10 shadow-lg'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-brand-400 animate-pulse'}`} />
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                        {item.due_date && (
                          <span className="text-xs text-surface-400 flex items-center gap-1 font-mono">
                            📅 {new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base font-semibold transition-colors ${
                          isCompleted ? 'line-through text-surface-400' : 'text-surface-100 group-hover:text-brand-300'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="mt-1 text-xs text-surface-400 line-clamp-2">{item.description}</p>
                      )}

                      {/* Visual Task Dependency Connectors & Prerequisites */}
                      {item.dependencies && item.dependencies.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1">
                            <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Linked Prerequisite:
                          </span>
                          {item.dependencies.map((depId: string) => {
                            const parent = items.find((it) => it.id === depId);
                            const isParentDone = parent?.status === 'completed';
                            return (
                              <span
                                key={depId}
                                className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                                  isParentDone
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                }`}
                              >
                                {isParentDone ? '✓' : '⏳'} {parent ? parent.title : `Task ${depId.slice(0, 6)}`}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <button
                          type="button"
                          className="text-xs text-brand-300 hover:text-brand-200 transition-colors font-medium flex items-center gap-1"
                          onClick={(e) => handleToggle(item, e)}
                          disabled={busy}
                        >
                          {isCompleted ? '↩ Mark as Pending' : '✓ Mark Done'}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <span className="text-surface-600 text-xs">•</span>
                          <button
                            type="button"
                            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                            onClick={() => onRemove(item)}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </Tilt3DCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
