import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-900 font-semibold"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
                <Terminal aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm">CodeAssess AI</span>
            </Link>
            <p className="mt-3 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
              Structured technical assessment platform for evaluating programming fundamentals,
              algorithms, full-stack engineering, and analytical reasoning across seven calibrated
              skill tiers.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Platform
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/configure" className="hover:text-slate-900">
                  Configure Assessment
                </Link>
              </li>
              <li>
                <a href="/#subjects" className="hover:text-slate-900">
                  Subjects Catalog
                </a>
              </li>
              <li>
                <a href="/#workflow" className="hover:text-slate-900">
                  Assessment Workflow
                </a>
              </li>
              <li>
                <a href="/#features" className="hover:text-slate-900">
                  Capabilities
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Account
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/dashboard" className="hover:text-slate-900">
                      Dashboard Overview
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="hover:text-slate-900">
                      Assessment History
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-slate-900">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-slate-900">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/configure" className="hover:text-slate-900">
                      Guest Assessment Mode
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <p>CodeAssess AI. Built for structured technical evaluation and deliberate practice.</p>
          <p className="font-mono">7 Skill Tiers · 16 Subjects · Guest & Authenticated Modes</p>
        </div>
      </div>
    </footer>
  );
}
