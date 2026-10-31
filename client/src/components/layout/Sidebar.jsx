import { NavLink } from 'react-router-dom';
import { History, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const SIDEBAR_ITEMS = [
  {
    to: '/dashboard',
    label: 'Overview & Progress',
    icon: LayoutDashboard,
  },
  {
    to: '/history',
    label: 'Assessment History',
    icon: History,
  },
  {
    to: '/configure',
    label: 'Configure Assessment',
    icon: SlidersHorizontal,
  },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside aria-label="Workspace sidebar" className="w-full lg:w-60 shrink-0">
      <div className="surface-panel p-3 lg:sticky lg:top-20">
        {user && (
          <div className="px-2.5 py-2 mb-2 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Candidate Workspace
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}

        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
