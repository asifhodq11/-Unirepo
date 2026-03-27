import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { useEnergyMode } from './hooks/useEnergyMode';
import { useTidalMode } from './hooks/useTidalMode';

// Pages
import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage  from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ApprovalPage from './pages/ApprovalPage';

// Layout
import AppLayout from './components/layout/AppLayout';

// ── Full-screen loading state ──────────────────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div className="spinner spinner-lg" />
        <p className="text-muted text-sm">Loading…</p>
      </div>
    </div>
  );
}

// ── Auth guard — shows loader, redirects if not logged in ──────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// ── Public guard — redirects to dashboard if already logged in ─
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Smart Features Initializer ─────────────────────────────────
function SmartFeatures({ children }) {
  // These hooks set data-* attributes on <body> for CSS overrides
  useEnergyMode();  // data-energy="high|medium|low"
  useTidalMode();   // data-tidal="peak|trough|wind-down"
  return children;
}

// ── Root router ────────────────────────────────────────────────
function Router() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Public token route — no login needed */}
      <Route path="/approve/:token" element={<ApprovalPage />} />

      {/* Protected routes — wrapped in sidebar layout */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="history"   element={<HistoryPage />} />
        <Route path="settings"  element={<SettingsPage />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SmartFeatures>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </SmartFeatures>
      </ToastProvider>
    </AuthProvider>
  );
}
