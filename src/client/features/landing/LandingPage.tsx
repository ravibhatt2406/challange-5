import { Link } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import CelebrationHeroCanvas from '../../shared/components/CelebrationHeroCanvas';
import Tilt3DCard from '../../shared/components/Tilt3DCard';

const eventTypes = [
  { title: 'Weddings', description: 'Coordinate venues, vendors, guests, and the moments that matter.', icon: '💍' },
  { title: 'Birthdays', description: 'Turn a celebration idea into a memorable plan that fits your people and budget.', icon: '🎂' },
  { title: 'Community events', description: 'Bring fundraisers, festivals, and local gatherings together with clarity.', icon: '🌱' },
];

const workflow = [
  { number: '01', title: 'Share the brief', description: 'Tell EventCraft what you are planning, who is coming, and what matters most.' },
  { number: '02', title: 'Shape the plan', description: 'Get an event-aware budget, timeline, vendor checklist, and ideas in one place.' },
  { number: '03', title: 'Make it yours', description: 'Edit every detail, ask the copilot for help, and keep the plan moving.' },
];

/** Introduces the product before a visitor enters the persistent planning workspace. */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="brand-mark" aria-label="EventCraft AI home">
          <span className="brand-mark-icon"><Icon name="sparkles" className="h-4 w-4" /></span>
          <span>EventCraft <span className="text-brand-300">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-surface-400 sm:flex" aria-label="Landing page navigation">
          <a href="#how-it-works" className="transition-colors hover:text-surface-100">How it works</a>
          <a href="#event-types" className="transition-colors hover:text-surface-100">Event types</a>
          <Link to="/dashboard" className="font-semibold text-brand-300 hover:text-brand-200">Open workspace</Link>
        </nav>
        <Link to="/events/new" className="header-action">Start planning <Icon name="arrow-right" className="h-4 w-4" /></Link>
      </header>

      <main>
        <section className="landing-hero relative overflow-hidden">
          <CelebrationHeroCanvas className="absolute inset-0 pointer-events-none z-0 opacity-80" />
          <div className="landing-orb landing-orb-one" aria-hidden="true" />
          <div className="landing-orb landing-orb-two" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl text-center z-10">
            <p className="eyebrow animate-slide-down">Planning, made wonderfully clear</p>
            <h1 className="landing-title animate-slide-up">
              Your big moments deserve
              <span className="gradient-text block">a better plan.</span>
            </h1>
            <p className="landing-lede animate-slide-up">
              EventCraft AI turns a blank page into a thoughtful, editable event plan — with a realistic budget,
              a practical timeline, trusted vendor checklists, and ideas made for your occasion.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/events/new" className="landing-primary-action">
                Build my event plan <Icon name="arrow-right" className="h-5 w-5" />
              </Link>
              <Link to="/dashboard" className="landing-secondary-action">Explore the workspace</Link>
            </div>
            <div className="landing-proof" aria-label="Product capabilities">
              <span><Icon name="check" className="h-4 w-4 text-emerald-300" /> Event-aware AI</span>
              <span><Icon name="check" className="h-4 w-4 text-emerald-300" /> Deterministic budgets</span>
              <span><Icon name="check" className="h-4 w-4 text-emerald-300" /> Editable plans</span>
            </div>
          </div>
          <Tilt3DCard intensity={6} glare={true} className="landing-preview relative z-10">
            <div className="landing-preview-top"><span /><span /><span /><p>EventCraft workspace</p></div>
            <div className="grid gap-4 p-5 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="preview-label">Your planning pulse</div>
                <div className="preview-heading">A garden wedding that feels like you.</div>
                <div className="preview-line preview-line-long" /><div className="preview-line preview-line-short" />
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <div className="preview-stat"><span>Budget</span><strong>$18,400</strong></div>
                  <div className="preview-stat"><span>Tasks</span><strong>12 / 18</strong></div>
                  <div className="preview-stat"><span>Vendors</span><strong>7 ready</strong></div>
                </div>
              </div>
              <div className="preview-ai-card"><Icon name="sparkles" className="h-5 w-5 text-brand-300" /><p>Copilot suggestion</p><strong>Move the menu tasting two weeks earlier to protect your final guest count.</strong><span>Review proposal →</span></div>
            </div>
          </Tilt3DCard>
        </section>

        <section id="event-types" className="landing-section">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">One calm workspace</p>
            <h2 className="landing-section-title">From first idea to final detail.</h2>
            <p className="landing-section-lede">Whether it is intimate, joyful, or built for a whole neighborhood, your plan should feel personal and actionable.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
            {eventTypes.map((event) => (
              <Tilt3DCard key={event.title} intensity={10} glare={true} as="article" className="landing-feature-card">
                <span className="text-3xl" role="img" aria-label={event.title}>{event.icon}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <span className="text-sm font-semibold text-brand-300">Plan with context <Icon name="arrow-right" className="ml-1 inline h-4 w-4" /></span>
              </Tilt3DCard>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-section-muted">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl"><p className="eyebrow">Less juggling. More celebrating.</p><h2 className="landing-section-title">A plan that keeps up with real life.</h2></div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {workflow.map((item) => <article key={item.number} className="landing-step"><span>{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <p className="eyebrow">The first step is the easiest</p>
          <h2 className="landing-section-title">Ready to make room for the good stuff?</h2>
          <p className="landing-section-lede">Start with a five-minute planning brief. You can edit the details as your event takes shape.</p>
          <Link to="/events/new" className="landing-primary-action mt-7">Start your planning brief <Icon name="arrow-right" className="h-5 w-5" /></Link>
        </section>
      </main>
      <footer className="landing-footer">EventCraft AI · Thoughtful plans for meaningful moments</footer>
    </div>
  );
}
