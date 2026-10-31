import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Footer } from '../components/layout/Footer.jsx';

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 w-full">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
