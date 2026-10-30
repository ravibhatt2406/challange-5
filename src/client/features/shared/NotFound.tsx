import { Link } from 'react-router-dom';
import Button from '../../shared/components/Button';

/** Provides a recoverable destination for unknown application URLs. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="eyebrow">404 · Page not found</p>
      <h1 className="page-title">That planning page does not exist</h1>
      <p className="page-subtitle">Use the dashboard to return to your events and continue planning.</p>
      <Link to="/dashboard" className="mt-8 inline-flex">
        <Button type="button">Return to dashboard</Button>
      </Link>
    </div>
  );
}
