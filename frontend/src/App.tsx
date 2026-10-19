import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { TestCatalog } from './pages/TestCatalog';
import { TestDetail } from './pages/TestDetail';
import { TestOverview } from './pages/TestOverview';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { CheckoutCancel } from './pages/CheckoutCancel';
import { Terms } from './pages/Terms';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Instructions } from './pages/Instructions';
import { TestRunner } from './pages/TestRunner';
import { ResultPage } from './pages/ResultPage';
import { Dashboard } from './pages/Dashboard';
import { About } from './pages/About';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { Footer } from './components/Footer';
import { AdminHome } from './admin/AdminHome';
import { ReferralPromoModal } from './components/ReferralPromoModal';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Seo } from './components/Seo';
import { TestsApi } from './api/endpoints';
import { seoSiteUrl } from './components/Seo';

function RouteSeo() {
  const { pathname } = useLocation();
  const [test, setTest] = useState<any>(null);
  const testSlug = pathname.match(/^\/tests\/([^/]+)$/)?.[1];
  useEffect(() => { let cancelled = false; setTest(null); if (testSlug) TestsApi.getBySlug(testSlug).then((result) => { if (!cancelled) setTest(result.test); }).catch(() => undefined); return () => { cancelled = true; }; }, [testSlug]);
  const noIndex = /^\/(dashboard|profile|admin|results|attempts|checkout|login|register|forgot-password|reset-password)(\/|$)/.test(pathname) || /^\/tests\/[^/]+\/checkout(\/|$)/.test(pathname);
  const title = pathname === '/' ? 'My Inner | Self-Awareness & Personal Growth' : pathname === '/tests' ? 'Self-Discovery Tests | My Inner' : pathname === '/about' ? 'About My Inner | Self-Discovery & Personal Growth' : pathname === '/terms' ? 'Terms of Service | My Inner' : pathname === '/login' ? 'Log In | My Inner' : pathname === '/register' ? 'Create an Account | My Inner' : pathname === '/forgot-password' ? 'Reset Your Password | My Inner' : undefined;
  const description = pathname === '/' ? 'Explore My Inner for self-reflection, personal growth, and emotional wellness resources designed to support your journey toward greater self-awareness.' : pathname === '/tests' ? 'Explore self-discovery assessments from My Inner for personality, emotions, relationships, and personal reflection.' : pathname === '/about' ? 'Learn about My Inner and our approach to self-discovery, personal growth, and thoughtful assessments.' : pathname === '/terms' ? 'Read the My Inner terms of service for using our self-discovery assessment platform.' : undefined;
  const testImage = test?.imageUrl || '/hero-background.png';
  const jsonLd = test ? { '@context': 'https://schema.org', '@type': 'Quiz', name: test.name, description: test.description, url: `${seoSiteUrl}/tests/${test.slug}`, image: testImage.startsWith('http') ? testImage : `${seoSiteUrl}${testImage}`, isAccessibleForFree: false, provider: { '@type': 'Organization', name: 'My Inner', url: seoSiteUrl } } : pathname === '/' ? [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'My Inner', url: seoSiteUrl, logo: `${seoSiteUrl}/my-inner-logo.png` }, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'My Inner', url: `${seoSiteUrl}/` }] : undefined;
  return <Seo title={test ? `${test.name} | My Inner` : title} description={test?.description ?? description} canonicalPath={test ? `/tests/${test.slug}` : undefined} image={testImage} noIndex={noIndex} jsonLd={jsonLd} />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <RouteSeo />
      <AnnouncementBar /><NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tests" element={<TestCatalog />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/tests/:slug" element={<TestOverview />} />
          <Route path="/tests/:slug/checkout" element={<TestDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route
            path="/attempts/:attemptId/instructions"
            element={
              <ProtectedRoute>
                <Instructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attempts/:attemptId/run"
            element={
              <ProtectedRoute>
                <TestRunner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:attemptId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ReferralPromoModal />
    </div>
  );
}
