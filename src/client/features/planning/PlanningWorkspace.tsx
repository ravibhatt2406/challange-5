import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { planningApi, eventsApi } from '../../shared/api/client';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Spinner from '../../shared/components/Spinner';
import type { BudgetItem } from '../../../shared/types/budget';
import type { TimelineItem } from '../../../shared/types/timeline';
import type { Vendor } from '../../../shared/types/vendor';
import type { Event } from '../../../shared/types/event';

import BudgetWorkspace from './BudgetWorkspace';
import TimelineWorkspace from './TimelineWorkspace';
import VendorWorkspace from './VendorWorkspace';

type WorkspaceKind = 'budget' | 'timeline' | 'vendors';

interface PlanningWorkspaceProps {
  kind: WorkspaceKind;
}

/**
 * Top-level planning workspace orchestrator.
 * Loads event-scoped data and delegates to dedicated domain workspaces:
 * - BudgetWorkspace: Real-time 3D donut visualizer & expense management
 * - TimelineWorkspace: 3D spatial highway, milestones & run-of-show schedules
 * - VendorWorkspace: Readiness tracker, booking status & checklists
 */
export default function PlanningWorkspace({ kind }: PlanningWorkspaceProps) {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const ev = await eventsApi.getById(id).catch(() => null);
      if (ev) setEvent(ev);
      if (kind === 'budget') setBudgetItems(await planningApi.budget.list(id));
      if (kind === 'timeline') setTimelineItems(await planningApi.timeline.list(id));
      if (kind === 'vendors') setVendors(await planningApi.vendors.list(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load planning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchWorkspace = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [ev, items] = await Promise.all([
          eventsApi.getById(id).catch(() => null),
          kind === 'budget'
            ? planningApi.budget.list(id)
            : kind === 'timeline'
            ? planningApi.timeline.list(id)
            : planningApi.vendors.list(id),
        ]);
        if (!cancelled) {
          if (ev) setEvent(ev);
          if (kind === 'budget') setBudgetItems(items as BudgetItem[]);
          if (kind === 'timeline') setTimelineItems(items as TimelineItem[]);
          if (kind === 'vendors') setVendors(items as Vendor[]);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load planning data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchWorkspace();
    return () => {
      cancelled = true;
    };
  }, [id, kind]);

  if (!id) {
    return (
      <Card>
        <p className="form-error" role="alert">This workspace is missing an event ID.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner size="lg" />
        <span className="sr-only">Loading planning data</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="form-error" role="alert">{error}</p>
        <Button className="mt-4" onClick={() => void load()}>Retry</Button>
      </Card>
    );
  }

  if (kind === 'budget') {
    return <BudgetWorkspace eventId={id} event={event} items={budgetItems} onChanged={load} />;
  }

  if (kind === 'timeline') {
    return <TimelineWorkspace eventId={id} event={event} items={timelineItems} onChanged={load} />;
  }

  return <VendorWorkspace eventId={id} event={event} vendors={vendors} onChanged={load} />;
}
