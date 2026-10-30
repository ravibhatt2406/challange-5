import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Icon from './Icon';

/** Provides predictable backward navigation with a safe workspace fallback. */
export default function BackButton({ fallback = '/dashboard' }: { fallback?: string }) {
  const navigate = useNavigate();
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => {
      if (window.history.length > 1) navigate(-1);
      else navigate(fallback);
    }}>
      <Icon name="arrow-left" className="h-4 w-4" />
      Back
    </Button>
  );
}
