import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './shared/components/Layout';
import Dashboard from './features/dashboard/Dashboard';
import CreateEvent from './features/events/CreateEvent';
import EventDetail from './features/events/EventDetail';
import NotFound from './features/shared/NotFound';
import PlanningWorkspace from './features/planning/PlanningWorkspace';
import AICopilot from './features/assistant/AICopilot';
import IdeasWorkspace from './features/ideas/IdeasWorkspace';
import LandingPage from './features/landing/LandingPage';

/**
 * Defines the application's route tree.
 *
 * Feature routes are present even before their backend services are complete so
 * users can understand the product scope without seeing misleading controls.
 */
export default function App() {
  return (
    <>
      {/* Keep keyboard users oriented when navigating between routed pages. */}
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events/new" element={<CreateEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/budget" element={<PlanningWorkspace kind="budget" />} />
          <Route path="/events/:id/timeline" element={<PlanningWorkspace kind="timeline" />} />
          <Route path="/events/:id/vendors" element={<PlanningWorkspace kind="vendors" />} />
          <Route path="/events/:id/ideas" element={<IdeasWorkspace />} />
          <Route path="/events/:id/assistant" element={<AICopilot />} />
          <Route path="/events/:id/overview" element={<Navigate to=".." replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
