import { useMemo, useState, type FormEvent } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import type { BudgetItem } from '../../../shared/types/budget';
import type { Event } from '../../../shared/types/event';
import Tilt3DCard from '../../shared/components/Tilt3DCard';
import Budget3DDonut from '../../shared/components/Budget3DDonut';
import { fireConfetti } from '../../shared/utils/confettiBurst';
import { planningApi } from '../../shared/api/client';
import { WorkspaceLayout, RecordList, PresetChips, FormError, CategoryFilterPills } from './WorkspaceComponents';

const BUDGET_PRESET_CATEGORIES = ['Venue', 'Catering', 'Decor', 'Media', 'Permits', 'Entertainment', 'Transport'];

interface BudgetWorkspaceProps {
  eventId: string;
  event: Event | null;
  items: BudgetItem[];
  onChanged: () => Promise<void>;
}

export default function BudgetWorkspace({ eventId, event, items, onChanged }: BudgetWorkspaceProps) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [estimated, setEstimated] = useState('');
  const [actual, setActual] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planned = useMemo(() => items.reduce((sum, item) => sum + item.estimated_cost, 0), [items]);
  const actualTotal = useMemo(() => items.reduce((sum, item) => sum + (item.actual_cost ?? 0), 0), [items]);
  const totalEventBudget = (event?.budget_amount && event.budget_amount > 0) ? event.budget_amount : (planned > 0 ? planned : 0);
  const remaining = totalEventBudget - actualTotal;
  const percentSpent = totalEventBudget > 0 ? Math.min(Math.round((actualTotal / totalEventBudget) * 100), 100) : 0;

  // Determine Budget Health status
  let healthStatus = 'On Track';
  let healthBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let progressFillColor = 'bg-emerald-500';

  if (actualTotal > totalEventBudget && totalEventBudget > 0) {
    healthStatus = 'Over Budget';
    healthBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    progressFillColor = 'bg-rose-500';
  } else if (actualTotal >= totalEventBudget * 0.85 && totalEventBudget > 0) {
    healthStatus = 'Approaching Limit';
    healthBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    progressFillColor = 'bg-amber-500';
  }

  // Categories list
  const allCategories = useMemo(() => {
    const set = new Set([...BUDGET_PRESET_CATEGORIES, ...items.map((i) => i.category)]);
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [items, selectedCategory]);

  const autoSeedBudget = async () => {
    setBusy(true); setError(null);
    try {
      const type = event?.type ?? 'wedding';
      const effBudget = totalEventBudget > 0 ? totalEventBudget : 1000;
      const categories: Array<[string, number]> = type === 'wedding'
        ? [['Venue & Catering', 0.45], ['Photography & Media', 0.15], ['Flowers & Decor', 0.15], ['Music & DJ', 0.15], ['Contingency Buffer', 0.10]]
        : type === 'birthday'
          ? [['Venue & Food', 0.40], ['Entertainment & Games', 0.25], ['Cake & Decor', 0.20], ['Favors & Contingency', 0.15]]
          : [['Venue & Permits', 0.35], ['Food & Supplies', 0.30], ['Sound & Activities', 0.20], ['Volunteers & Safety', 0.15]];
      for (const [cat, ratio] of categories) {
        await planningApi.budget.create(eventId, {
          category: String(cat),
          name: `${cat} Allocation`,
          estimated_cost: Math.round(effBudget * Number(ratio) * 100) / 100,
        });
      }
      fireConfetti(undefined, undefined, 60);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize budget');
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const estimatedCost = Number(estimated);
    if (!category.trim() || !name.trim() || !Number.isFinite(estimatedCost) || estimatedCost < 0) {
      setError('Enter a category, item name, and a nonnegative estimated cost.');
      return;
    }
    setBusy(true); setError(null);
    try {
      const payload = { category, name, estimated_cost: estimatedCost, actual_cost: actual ? Number(actual) : undefined };
      if (editing) await planningApi.budget.update(eventId, editing.id, payload);
      else await planningApi.budget.create(eventId, payload);
      fireConfetti(undefined, undefined, 45);
      reset(); await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save budget item.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: BudgetItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setBusy(true); setError(null);
    try {
      await planningApi.budget.remove(eventId, item.id);
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete budget item.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setCategory(''); setName(''); setEstimated(''); setActual(''); setEditing(null); };
  const edit = (item: BudgetItem) => {
    setEditing(item);
    setCategory(item.category);
    setName(item.name);
    setEstimated(String(item.estimated_cost));
    setActual(item.actual_cost == null ? '' : String(item.actual_cost));
  };

  return (
    <WorkspaceLayout title="Budget workspace" description="Track planned and actual spending with persisted, editable expense records.">
      {/* Dynamic Budget Health Card */}
      <Card className="border border-white/10 bg-gradient-to-br from-surface-900 to-surface-850 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="eyebrow">Financial Overview</span>
            <h2 className="text-xl font-bold text-surface-100 flex items-center gap-2">
              <span>📊</span> Budget Health & Tracking
            </h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeColor}`}>
            <span className={`h-2 w-2 rounded-full ${progressFillColor} animate-pulse`} />
            {healthStatus}
          </span>
        </div>

        {/* Holographic 3D Budget Ring & Progress Meter */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center mb-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-surface-300">
                <span>Spending Progress ({percentSpent}%)</span>
                <span>{remaining >= 0 ? `$${remaining.toLocaleString()} Remaining` : `$${Math.abs(remaining).toLocaleString()} Over`}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressFillColor}`}
                  style={{ width: `${percentSpent}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-surface-400">
              Interactive 3D budget ring reflects your live category allocations. Rotate the ring or hover slices to inspect financial distribution.
            </p>
          </div>
          <div className="flex justify-center">
            <Budget3DDonut
              items={items}
              totalBudget={totalEventBudget}
              currency={event?.currency}
            />
          </div>
        </div>

        {/* Metric Cards Grid with 3D Tilt */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tilt3DCard intensity={8} glare={true} className="rounded-xl">
            <div className="rounded-xl border border-brand-500/20 bg-brand-950/20 p-4 text-center h-full">
              <p className="text-xs uppercase tracking-wider text-brand-300 font-semibold">Target Event Budget</p>
              <p className="mt-1 text-2xl font-bold text-surface-100">
                ${totalEventBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Tilt3DCard>
          <Tilt3DCard intensity={8} glare={true} className="rounded-xl">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center h-full">
              <p className="text-xs uppercase tracking-wider text-surface-400">Planned Allocations</p>
              <p className="mt-1 text-2xl font-bold text-surface-100">${planned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </Tilt3DCard>
          <Tilt3DCard intensity={8} glare={true} className="rounded-xl">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center h-full">
              <p className="text-xs uppercase tracking-wider text-surface-400">Actual Spent</p>
              <p className="mt-1 text-2xl font-bold text-surface-100">${actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </Tilt3DCard>
          <Tilt3DCard intensity={8} glare={true} className="rounded-xl">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center h-full">
              <p className="text-xs uppercase tracking-wider text-surface-400">Remaining Balance</p>
              <p className={`mt-1 text-2xl font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Tilt3DCard>
        </div>

        {/* Empty Items Helper */}
        {items.length === 0 && (
          <div className="mt-5 rounded-xl border border-brand-500/30 bg-brand-950/30 p-4 text-center">
            <p className="text-sm text-surface-200">
              Your target budget of <strong className="text-brand-300">${totalEventBudget.toLocaleString()}</strong> has not been distributed to line items yet.
            </p>
            <Button className="mt-3" size="sm" onClick={() => void autoSeedBudget()} loading={busy}>
              ⚡ Auto-Allocate ${totalEventBudget.toLocaleString()} across Categories
            </Button>
          </div>
        )}
      </Card>

      {/* Add / Edit Form */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-200 mb-3">{editing ? 'Edit Expense' : 'Add New Expense'}</h3>
        <FormError error={error} />
        
        {/* Preset Category Chips */}
        <PresetChips
          label="Quick Categories:"
          presets={BUDGET_PRESET_CATEGORIES}
          selected={category}
          onSelect={(preset) => setCategory(preset)}
        />

        <form className="form-grid" onSubmit={save}>
          <Input label="Category" required value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Venue, Catering, Decor..." />
          <Input label="Item name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Wedding Hall Deposit" />
          <Input label="Estimated cost ($)" required type="number" min={0} step="0.01" value={estimated} onChange={(event) => setEstimated(event.target.value)} />
          <Input label="Actual cost ($)" type="number" min={0} step="0.01" value={actual} onChange={(event) => setActual(event.target.value)} placeholder="Optional until paid" />
          <div className="flex items-end gap-2">
            <Button type="submit" loading={busy}>{editing ? 'Save changes' : 'Add expense'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Card>

      {/* Category Filter Pills & Items List */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-surface-200">
            Expenses List ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
          </h3>
          <CategoryFilterPills
            categories={allCategories}
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat)}
          />
        </div>

        <RecordList
          empty="No expenses found in this category."
          records={filteredItems.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-surface-200 border-b border-white/5 last:border-none">
              <div>
                <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-xs text-brand-300 mr-2 font-medium">
                  {item.category}
                </span>
                <strong className="text-surface-100">{item.name}</strong>
                <span className="text-surface-400 ml-2">
                  — ${item.estimated_cost.toFixed(2)} est.{item.actual_cost != null ? ` · $${item.actual_cost.toFixed(2)} actual` : ''}
                </span>
              </div>
              <span className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => edit(item)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => void remove(item)} disabled={busy}>Delete</Button>
              </span>
            </li>
          ))}
        />
      </Card>
    </WorkspaceLayout>
  );
}

