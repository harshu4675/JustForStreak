import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { validateLoginForm } from '../utils/validation.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setAuthError(null);
    try {
      await login({ email: email.trim(), password });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setAuthError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="surface-panel p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white mb-3">
            <Terminal aria-hidden="true" className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Log in to CodeAssess AI
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Access your saved assessment history, scores, and skill progression.
          </p>
        </div>

        {authError && (
          <ErrorState
            title="Authentication Failed"
            message={authError.message}
            code={authError.code}
          />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={fieldErrors.email}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            Log in
          </Button>
        </form>

        <div className="border-t border-slate-200 pt-4 space-y-3 text-xs text-slate-600">
          <p>
            New to CodeAssess AI?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Create an account
            </Link>
          </p>
          <p>
            Prefer not to sign in right now?{' '}
            <Link
              to="/configure"
              className="inline-flex items-center gap-1 font-medium text-slate-800 hover:text-blue-600 underline underline-offset-2"
            >
              Continue in Guest Mode
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
