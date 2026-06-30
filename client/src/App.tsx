import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
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
import { ReviewPage } from './pages/ReviewPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { FollowUpPage } from './pages/FollowUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LeaderboardByTypePage } from './pages/LeaderboardByTypePage';
import { ProfilePage } from './pages/ProfilePage';
import { CertificatePage } from './pages/CertificatePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { CompanyPostCasePage } from './pages/CompanyPostCasePage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#2D87FF]/30">
            <Navbar />
            <main className="flex-grow pt-16 relative z-10">
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
                <Route path="/cases/:id/submit" element={
                  <ProtectedRoute>
                    <SubmitPage />
                  </ProtectedRoute>
                } />
                <Route path="/cases/:id/followup" element={
                  <ProtectedRoute>
                    <FollowUpPage />
                  </ProtectedRoute>
                } />
                <Route path="/cases/:id/review" element={
                  <ProtectedRoute>
                    <ReviewPage />
                  </ProtectedRoute>
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
            </main>
            <div className="relative z-10">
              <Footer />
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
