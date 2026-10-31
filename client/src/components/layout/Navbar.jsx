import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  Plus,
  Terminal,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/Button.jsx';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white">
              <Terminal aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="text-sm sm:text-base">CodeAssess AI</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            <NavLink to="/configure" className={navLinkClass}>
              Configure Test
            </NavLink>
            <a
              href="/#subjects"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Subjects
            </a>
            <a
              href="/#workflow"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  History
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <UserIcon aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
                <span className="max-w-[140px] truncate">{user?.name}</span>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/configure')}
              >
                <Plus className="h-3.5 w-3.5" />
                New Assessment
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Log in
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Sign up
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/configure')}
              >
                Start Assessment
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-2">
            <Link
              to="/configure"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Configure Assessment
            </Link>
            <a
              href="/#subjects"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Subjects & Skill Levels
            </a>
            <a
              href="/#workflow"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              How It Works
            </a>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  Assessment History
                </Link>
              </>
            )}
          </nav>

          <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="px-2.5 py-1 text-xs text-slate-500">
                  Signed in as <span className="font-medium text-slate-800">{user?.email}</span>
                </div>
                <Button variant="secondary" size="md" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/login');
                  }}
                >
                  Log in
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/register');
                  }}
                >
                  Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
