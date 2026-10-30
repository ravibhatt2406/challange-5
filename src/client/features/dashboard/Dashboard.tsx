import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../shared/api/client';
import Card from '../../shared/components/Card';
import Spinner from '../../shared/components/Spinner';
import Badge from '../../shared/components/Badge';
import type { Event } from '../../../shared/types/event';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../../shared/constants/eventTypes';
import { EVENT_THEMES } from '../../shared/constants/eventThemes';
import BackButton from '../../shared/components/BackButton';
import Tilt3DCard from '../../shared/components/Tilt3DCard';

/** Loads the user's events and provides the primary entry point into planning. */
export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = () => {
    setLoading(true);
    setError(null);
    let cancelled = false;
    eventsApi
      .list()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    let cancelled = false;
    eventsApi
      .list()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-4"><BackButton fallback="/" /></div>
      {/* Hero */}
      <section className="text-center py-12 mb-8">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl gradient-text mb-4">
          Your Events
        </h1>
        <p className="text-surface-400 text-lg max-w-xl mx-auto">
          Plan weddings, birthdays, and community events with AI-powered budgets, timelines, and vendor management.
        </p>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="text-center py-12">
          <p className="text-red-400 mb-2">Failed to load events</p>
          <p className="text-surface-500 text-sm">{error}</p>
          <p className="mt-2 text-xs text-surface-600">Connect the workspace to Supabase to load saved events.</p>
          <button type="button" className="mt-5 text-sm font-semibold text-brand-300 hover:text-brand-200" onClick={() => loadEvents()}>Try again</button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <Card className="text-center py-16">
          <p className="text-4xl mb-4" role="img" aria-label="Party popper">🎉</p>
          <h2 className="font-display font-semibold text-xl text-surface-200 mb-2">No events yet</h2>
          <p className="text-surface-500 mb-6">Create your first event to get started with AI-powered planning.</p>
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-brand-600/25"
          >
            <span aria-hidden="true">✨</span>
            Create Your First Event
          </Link>
        </Card>
      )}

      {/* Event Grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block group">
              <Tilt3DCard intensity={12} glare={true} className="h-full rounded-2xl">
                <Card as="article" className={`h-full border transition-all duration-300 ${EVENT_THEMES[event.type]?.borderAccent || 'border-white/10'}`}>
                  <div className="flex items-start justify-between mb-3" style={{ transform: 'translateZ(15px)' }}>
                    <span className="text-3xl" role="img" aria-label={EVENT_TYPE_LABELS[event.type]}>
                      {EVENT_TYPE_ICONS[event.type]}
                    </span>
                    <Badge color={EVENT_THEMES[event.type]?.badgeColor || 'brand'}>{EVENT_TYPE_LABELS[event.type]}</Badge>
                  </div>
                  <h2 className={`font-display font-semibold text-lg text-surface-100 mb-1 transition-colors ${EVENT_THEMES[event.type]?.textAccent || 'group-hover:text-brand-400'}`} style={{ transform: 'translateZ(20px)' }}>
                    {event.title}
                  </h2>
                  {event.description && (
                    <p className="text-surface-500 text-sm line-clamp-2 mb-3" style={{ transform: 'translateZ(10px)' }}>{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-surface-600" style={{ transform: 'translateZ(10px)' }}>
                    {event.date && (
                      <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    )}
                    {event.guest_count && (
                      <span>👥 {event.guest_count} guests</span>
                    )}
                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-surface-500" style={{ transform: 'translateZ(15px)' }}>
                    {event.budget_amount > 0 && <span className="rounded-full bg-white/5 px-2.5 py-1">Budget: {event.budget_amount.toLocaleString(undefined, { style: 'currency', currency: event.currency })}</span>}
                    {event.date && <span className="rounded-full bg-white/5 px-2.5 py-1">{daysUntil(event.date)}</span>}
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Returns a truthful countdown label without inventing a date when none exists. */
function daysUntil(date: string): string {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  return `${days} days to go`;
}
