import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '../../shared/api/client';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Spinner from '../../shared/components/Spinner';
import Button from '../../shared/components/Button';
import { showToast } from '../../shared/components/toastBus';
import type { Event } from '../../../shared/types/event';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../../shared/constants/eventTypes';
import { EVENT_THEMES } from '../../shared/constants/eventThemes';
import BackButton from '../../shared/components/BackButton';

/** Displays an event summary and routes users to each planning workspace. */
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'vendors', label: 'Vendors', icon: '🤝' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'assistant', label: 'AI Assistant', icon: '✨' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EventDetail() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = (tab as TabId) || 'overview';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    eventsApi
      .getById(id)
      .then((data) => { if (!cancelled) setEvent(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    try {
      await eventsApi.delete(id);
      showToast('Event deleted', 'success');
      navigate('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-400 mb-2">Event not found</p>
        <p className="text-surface-500 text-sm mb-4">{error || 'This event does not exist.'}</p>
        <Link to="/" className="text-brand-400 hover:text-brand-300 text-sm">← Back to events</Link>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4"><BackButton /></div>
      {/* Event Header with event-type ambient gradient */}
      <header className={`mb-8 relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-r ${EVENT_THEMES[event.type]?.gradientBg || 'from-surface-900 to-surface-800'} ${EVENT_THEMES[event.type]?.borderAccent || 'border-white/10'}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl" role="img" aria-label={EVENT_TYPE_LABELS[event.type]}>
                {EVENT_TYPE_ICONS[event.type]}
              </span>
              <Badge color={EVENT_THEMES[event.type]?.badgeColor || 'brand'} size="md">
                {EVENT_TYPE_LABELS[event.type]}
              </Badge>
              <span className="text-xs text-surface-400 font-medium">
                {EVENT_THEMES[event.type]?.tagline}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl text-surface-100 mb-1">{event.title}</h1>
            {event.description && (
              <p className="text-surface-400 max-w-2xl">{event.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-surface-500">
              {event.date && <span>📅 {new Date(event.date).toLocaleDateString()}</span>}
              {event.guest_count && <span>👥 {event.guest_count} guests</span>}
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete Event
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav aria-label="Event sections" className="mb-6">
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to={t.id === 'overview' ? `/events/${id}` : `/events/${id}/${t.id}`}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-surface-500 hover:text-surface-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <section aria-label={`${TABS.find((t) => t.id === activeTab)?.label || 'Overview'} section`}>
        <OverviewTab event={event} />
      </section>
    </div>
  );
}

/** Overview tab showing event summary */
function OverviewTab({ event }: { event: Event }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <h3 className="text-sm font-medium text-surface-400 mb-1">Type</h3>
        <p className="text-lg font-display font-semibold text-surface-100">
          {EVENT_TYPE_ICONS[event.type]} {EVENT_TYPE_LABELS[event.type]}
        </p>
      </Card>
      <Card>
        <h3 className="text-sm font-medium text-surface-400 mb-1">Budget</h3>
        <p className="text-lg font-display font-semibold text-surface-100">
          {event.budget_amount > 0 ? event.budget_amount.toLocaleString(undefined, { style: 'currency', currency: event.currency }) : 'Not set'}
        </p>
        <p className="mt-1 text-xs text-surface-500">Actual spending is shown in the Budget workspace.</p>
      </Card>
      <Card>
        <h3 className="text-sm font-medium text-surface-400 mb-1">Date</h3>
        <p className="text-lg font-display font-semibold text-surface-100">
          {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
        </p>
      </Card>
      <Card>
        <h3 className="text-sm font-medium text-surface-400 mb-1">Guests</h3>
        <p className="text-lg font-display font-semibold text-surface-100">
          {event.guest_count ? `${event.guest_count.toLocaleString()} expected` : 'Not set'}
        </p>
      </Card>
      <Card>
        <h3 className="text-sm font-medium text-surface-400 mb-1">Location</h3>
        <p className="text-lg font-display font-semibold text-surface-100">
          {event.location || 'Not set'}
        </p>
      </Card>
      <Card className="sm:col-span-2">
        <h3 className="text-sm font-medium text-surface-400 mb-1">Description</h3>
        <p className="text-surface-200">
          {event.description || 'No description provided.'}
        </p>
      </Card>
    </div>
  );
}
