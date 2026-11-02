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
import { ArenaPage } from './pages/ArenaPage';
import { ArenaDetailPage } from './pages/ArenaDetailPage';
import { ArenaSubmitPage } from './pages/ArenaSubmitPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { QuestionsDetailPage } from './pages/QuestionsDetailPage';
import { QuestionsAnswerPage } from './pages/QuestionsAnswerPage';
import { QuestionsAskPage } from './pages/QuestionsAskPage';
import { CasesPage } from './pages/CasesPage';
import { CasesByTypePage } from './pages/CasesByTypePage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { SubmitPage } from './pages/SubmitPage';
import { CaseSolutionsPage } from './pages/CaseSolutionsPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { FollowUpPage } from './pages/FollowUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LeaderboardByTypePage } from './pages/LeaderboardByTypePage';
import { ProfilePage } from './pages/ProfilePage';
import { CertificatePage } from './pages/CertificatePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { CompanyPostCasePage } from './pages/CompanyPostCasePage';
import { CaseProposalPage } from './pages/CaseProposalPage';
import { MyCaseProposalsPage } from './pages/MyCaseProposalsPage';
import { CaseModerationPage } from './pages/CaseModerationPage';
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
                  <Route path="/arena" element={<ArenaPage />} />
                  <Route path="/arena/:id" element={<ArenaDetailPage />} />
                  <Route path="/arena/:id/submit" element={<ArenaSubmitPage />} />
                  <Route path="/questions" element={<QuestionsPage />} />
                  <Route path="/questions/ask" element={<QuestionsAskPage />} />
                  <Route path="/questions/:id" element={<QuestionsDetailPage />} />
                  <Route path="/questions/:id/answer" element={<QuestionsAnswerPage />} />
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
                  <Route path="/contribute/cases" element={
                    <ProtectedRoute>
                      <CaseProposalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/contribute/cases/mine" element={
                    <ProtectedRoute>
                      <MyCaseProposalsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/contribute/cases/:proposalId/edit" element={
                    <ProtectedRoute>
                      <CaseProposalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/moderation/cases" element={
                    <ProtectedRoute>
                      <CaseModerationPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/submit" element={
                    <ProtectedRoute>
                      <SubmitPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/solutions" element={
                    <ProtectedRoute>
                      <CaseSolutionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/cases/:id/followup" element={
                    <ProtectedRoute>
                      <FollowUpPage />
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
                  <Route path="/reviews/:id" element={
                    <ProtectedRoute>
                      <ReviewDetailPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/leaderboard/:type" element={<LeaderboardByTypePage />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/:username" element={<ProfilePage />} />
                  <Route path="/certificate/:username" element={<CertificatePage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/company/dashboard" element={
                    <ProtectedRoute>
                      <CompanyDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/company/cases/new" element={
                    <ProtectedRoute>
                      <CompanyPostCasePage />
                    </ProtectedRoute>
                  } />
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
