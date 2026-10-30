import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../../shared/components/BackButton';
import { exportApi } from '../../shared/api/client';

export function WorkspaceLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { id: eventId } = useParams<{ id: string }>();

  return (
    <div className="space-y-5 animate-fade-in">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Persistent workspace</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        {eventId && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportApi.downloadIcs(eventId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200 hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
              title="Export all timeline milestones and event schedule to iCalendar format (.ics)"
            >
              <span>📅</span> Export to Calendar
            </button>
            <button
              type="button"
              onClick={() => exportApi.downloadPdf(eventId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-500/20 hover:border-brand-500/40 transition-all shadow-sm"
              title="Download printable executive PDF summary with budget, timeline, and vendors"
            >
              <span>📄</span> Download PDF Summary
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function RecordList({ records, empty }: { records: ReactNode[]; empty: string }) {
  return records.length === 0 ? <p className="text-sm text-surface-400 py-4 text-center">{empty}</p> : <ul className="divide-y divide-white/5">{records}</ul>;
}

/**
 * Renders a row of quick-select preset category chips.
 * Used by Budget and Vendor workspaces for one-click category selection.
 */
interface PresetChipsProps {
  label: string;
  presets: string[];
  selected: string;
  onSelect: (value: string) => void;
}
export function PresetChips({ label, presets, selected, onSelect }: PresetChipsProps) {
  return (
    <div className="mb-4">
      <p className="text-xs text-surface-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelect(preset)}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              selected === preset
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-surface-300 hover:bg-white/10'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Displays a form validation error with an accessible alert role.
 * Renders nothing when error is null.
 */
export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="form-error mb-3" role="alert">{error}</p>;
}

/**
 * Category filter pill bar with an 'All' option and dynamic category list.
 * Highlights the active filter and supports keyboard navigation.
 */
interface CategoryFilterPillsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}
export function CategoryFilterPills({ categories, selected, onSelect }: CategoryFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            selected === cat
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white/5 text-surface-400 hover:text-surface-200 hover:bg-white/10'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

