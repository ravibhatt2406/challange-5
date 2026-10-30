import { useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import Icon, { type IconName } from './Icon';

interface NavigationItem {
  label: string;
  href: string;
  icon: IconName;
}

// Keep global navigation separate from event-specific workspaces.
const primaryNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
];

const eventNavigation: NavigationItem[] = [
  { label: 'Overview', href: '', icon: 'clipboard' },
  { label: 'Budget', href: 'budget', icon: 'wallet' },
  { label: 'Timeline', href: 'timeline', icon: 'timeline' },
  { label: 'Vendors', href: 'vendors', icon: 'users' },
  { label: 'Ideas', href: 'ideas', icon: 'lightbulb' },
  { label: 'AI Copilot', href: 'assistant', icon: 'sparkles' },
];

function NavigationLink({ item, active }: { item: NavigationItem; active: boolean }) {
  return (
    <Link to={item.href} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}>
      <Icon name={item.icon} className="h-[18px] w-[18px]" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Layout() {
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEventRoute = Boolean(id);
  const eventBase = id ? `/events/${id}` : '';

  const eventItems = eventNavigation.map((item) => ({
    ...item,
    href: `${eventBase}${item.href ? `/${item.href}` : ''}`,
  }));

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="app-header">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="icon-button lg:hidden" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
              <Icon name={mobileOpen ? 'close' : 'menu'} className="h-5 w-5" />
            </button>
            <Link to="/" className="brand-mark" aria-label="EventCraft AI home">
              <span className="brand-mark-icon"><Icon name="sparkles" className="h-4 w-4" /></span>
              <span>EventCraft <span className="text-brand-300">AI</span></span>
            </Link>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/" className="text-sm font-medium text-surface-400 transition-colors hover:text-surface-100">About EventCraft</Link>
            <Link to="/events/new" className="header-action">
              <span aria-hidden="true">+</span> New event
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <span className="eyebrow">Workspace</span>
            <button type="button" className="icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Primary navigation" onClick={() => setMobileOpen(false)}>
            <p className="sidebar-heading">Workspace</p>
            {primaryNavigation.map((item) => <NavigationLink key={item.label} item={item} active={location.pathname === item.href} />)}
            {isEventRoute && (
              <>
                <p className="sidebar-heading mt-7">Current event</p>
                {eventItems.map((item) => {
                  const active = item.href === eventBase
                    ? location.pathname === eventBase
                    : location.pathname.startsWith(item.href);
                  return <NavigationLink key={item.label} item={item} active={active} />;
                })}
              </>
            )}
          </nav>
          <div className="sidebar-footer">
            <Icon name="sparkles" className="h-4 w-4 text-brand-300" />
            <p><strong>AI planning, thoughtfully.</strong><br />A clear plan for every meaningful moment.</p>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-surface-600">
        EventCraft AI · A practical planning workspace
      </footer>
    </div>
  );
}
