import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SmoothScroll } from './components/SmoothScroll';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeProvider';
import { GitHubOAuthCallback } from './components/GitHubOAuth';
import { GoogleOAuthCallback } from './components/GoogleOAuth';
import { LandingPage } from './pages/LandingPage';
import { CasesPage } from './pages/CasesPage';
import { CasesByTypePage } from './pages/CasesByTypePage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CaseSolvePage } from './pages/CaseSolvePage';
import { CaseSolutionsPage } from './pages/CaseSolutionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { AdminAccountsPage } from './pages/AdminAccountsPage';
import { AdminContentPage } from './pages/AdminContentPage';
import { AdminContentEditorPage } from './pages/AdminContentEditorPage';
import { CasebooksPage } from './pages/CasebooksPage';
import { CasebookDetailPage } from './pages/CasebookDetailPage';
import { CasebookCasePage } from './pages/CasebookCasePage';

const CasebookProposalPage = lazy(() => import('./pages/CasebookProposalPage').then((module) => ({ default: module.CasebookProposalPage })));
const MyCasebooksPage = lazy(() => import('./pages/MyCasebooksPage').then((module) => ({ default: module.MyCasebooksPage })));
const CasebookModerationPage = lazy(() => import('./pages/CasebookModerationPage').then((module) => ({ default: module.CasebookModerationPage })));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <HelmetProvider>
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <SmoothScroll>
              <div className="min-h-screen flex flex-col font-sans">
              <Navbar />
              <main className="flex-grow pt-16 relative z-10" aria-label="Main content">
                <Suspense fallback={<p className="py-8 text-center text-sm text-[var(--text-secondary)]" aria-live="polite">Loading page…</p>}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />


                  <Route path="/cases" element={<CasesPage />} />
                  <Route path="/cases/type/:type" element={<CasesByTypePage />} />
                  <Route path="/casebooks" element={<CasebooksPage />} />
                  <Route path="/casebooks/:slug/:caseSlug" element={<CasebookCasePage />} />
                  <Route path="/casebooks/:slug" element={<CasebookDetailPage />} />
                  <Route path="/contribute/casebooks" element={
                    <ProtectedRoute>
                      <CasebookProposalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/contribute/casebooks/mine" element={
                    <ProtectedRoute>
                      <MyCasebooksPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/contribute/casebooks/:casebookId/edit" element={
                    <ProtectedRoute>
                      <CasebookProposalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/moderation/casebooks" element={
                    <ProtectedRoute>
                      <CasebookModerationPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/accounts" element={
                    <ProtectedRoute requiredRole="Admin">
                      <AdminAccountsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/content" element={
                    <ProtectedRoute requiredRole="Admin">
                      <AdminContentPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/content/:caseId" element={
                    <ProtectedRoute requiredRole="Admin">
                      <AdminContentEditorPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/solve" element={
                    <ProtectedRoute>
                      <CaseSolvePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/submit" element={
                    <Navigate to="../solve" relative="path" replace />
                  } />
                  <Route path="/cases/:id/solutions" element={
                    <ProtectedRoute>
                      <CaseSolutionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/review" element={
                    <Navigate to="/cases" replace />
                  } />
                  <Route path="/cases/:id" element={
                    <ProtectedRoute>
                      <CaseDetailPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <AccountSettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/:username" element={<Navigate to="/profile" replace />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/callback/github" element={<GitHubOAuthCallback />} />
                  <Route path="/callback/google" element={<GoogleOAuthCallback />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
              </main>
              <div className="relative z-10">
                <Footer />
              </div>
              </div>
              </SmoothScroll>
            </Router>
          </AuthProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
