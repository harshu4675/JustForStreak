import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { validateRegistrationForm } from '../utils/validation.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateRegistrationForm({
      name,
      email,
      password,
      confirmPassword,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setSubmitError(err);
      if (err?.details && typeof err.details === 'object') {
        setFieldErrors((prev) => ({ ...prev, ...err.details }));
      }
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
            Create Candidate Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Store completed assessments, track subject accuracy, and monitor skill progression.
          </p>
        </div>

        {submitError && (
          <ErrorState
            title="Registration Failed"
            message={submitError.message}
            code={submitError.code}
          />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full Name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Verma"
            error={fieldErrors.name}
          />

          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@example.com"
            error={fieldErrors.email}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters with letter and number"
            helperText="Use at least 8 characters including a letter and a number."
            error={fieldErrors.password}
          />

          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            error={fieldErrors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            Create Account
          </Button>
        </form>

        <div className="border-t border-slate-200 pt-4 text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-800"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
