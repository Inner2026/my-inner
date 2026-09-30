import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <NavBar />
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
    </div>
  );
}
