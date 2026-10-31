import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { AssessmentLayout } from '../layouts/AssessmentLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { LandingPage } from '../pages/LandingPage.jsx';
import { ConfigureAssessmentPage } from '../pages/ConfigureAssessmentPage.jsx';
import { AssessmentTestPage } from '../pages/AssessmentTestPage.jsx';
import { AssessmentResultsPage } from '../pages/AssessmentResultsPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { HistoryPage } from '../pages/HistoryPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/configure" element={<ConfigureAssessmentPage />} />
        <Route path="/assessments/:id/result" element={<AssessmentResultsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      <Route element={<AssessmentLayout />}>
        <Route path="/assessments/:id/take" element={<AssessmentTestPage />} />
      </Route>
    </Routes>
  );
}
