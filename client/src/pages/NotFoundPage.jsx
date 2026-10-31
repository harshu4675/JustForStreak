import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
        HTTP 404
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600">
        The requested route does not exist or may have been moved.
      </p>
      <div className="pt-2 flex justify-center gap-3">
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Homepage
        </Button>
        <Button variant="secondary" onClick={() => navigate('/configure')}>
          Configure Assessment
        </Button>
      </div>
    </div>
  );
}
