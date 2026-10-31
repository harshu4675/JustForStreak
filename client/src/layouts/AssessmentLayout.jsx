import { Outlet } from 'react-router-dom';

export function AssessmentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Outlet />
    </div>
  );
}
