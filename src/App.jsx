import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import ThemeProvider from './components/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './components/LoginPage';
import { useAuthStore } from './store/useStore';
import { Shield, Clock, MapPin, Radio, AlertTriangle, Fingerprint, Upload, LogOut } from 'lucide-react';

// ── Lazy-loaded heavy view components ──────────────────────
// CrimeMap (814 lines + leaflet.heat + spatialAnalysis)
// NetworkGraph (512 lines + D3)
// AdminPage (820 lines + forms)
// CsvUploader (modal, rarely opened)
const CrimeMap = lazy(() => import('./components/CrimeMap'));
const NetworkGraph = lazy(() => import('./components/NetworkGraph'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const CsvUploader = lazy(() => import('./components/CsvUploader'));

// Role badge accents for the header chip
const ROLE_ACCENT = { Admin: 'var(--accent-purple)', Analyst: 'var(--accent-blue)', Viewer: 'var(--accent-green)' };

// Lightweight loading spinner matching the glass design system
const ViewLoader = () => (
  <div className="flex items-center justify-center h-full w-full" style={{ background: 'var(--bg-void)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Loading module…</span>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-900 text-white p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <h1 className="text-2xl font-bold mb-4">System Error</h1>
            <pre className="bg-red-800/50 p-4 rounded-lg text-sm overflow-auto max-w-lg text-left">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [activeView, setActiveView] = useState('map');
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCsvUploader, setShowCsvUploader] = useState(false);

  // ── Auth / RBAC ──
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasRole = useAuthStore((s) => s.hasRole);
  const canAdmin = hasRole('Admin');
  // Guard: a non-Admin must never land on the data-management view.
  const effectiveView = activeView === 'admin' && !canAdmin ? 'map' : activeView;

  const handleFlyTo = useCallback((location) => {
    setFlyToLocation(location);
    setTimeout(() => setFlyToLocation(null), 2000);
  }, []);

  const handlePersonSelect = useCallback((person) => {
    setSelectedPersonId(person?.PersonID || person?.id || null);
  }, []);

  const handleToggleHeatmap = useCallback(() => {
    setShowHeatmap(prev => !prev);
  }, []);

  const viewInfo = {
    map: { title: 'Crime Mapping & Analysis', subtitle: 'GIS Intelligence', icon: MapPin },
    network: { title: 'Criminal Network Analysis', subtitle: 'Link Analysis', icon: Fingerprint },
    admin: { title: 'Data Management Center', subtitle: 'Administration', icon: Shield },
  };
  const currentView = viewInfo[effectiveView];

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ color: 'var(--text-primary)' }}>

      {/* ====== LAYER 0: FULL-SCREEN MAP BACKGROUND ====== */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary>
          <Suspense fallback={<ViewLoader />}>
            {effectiveView === 'map' && (
              <CrimeMap
                flyToLocation={flyToLocation}
                showHeatmap={showHeatmap}
                onMarkerClick={(loc) => console.log('Marker clicked:', loc)}
              />
            )}
            {effectiveView === 'network' && (
              <NetworkGraph
                onPersonSelect={handlePersonSelect}
                selectedPersonId={selectedPersonId}
              />
            )}
            {effectiveView === 'admin' && (
              <div className="w-full h-full overflow-y-auto admin-content-area" style={{ background: 'var(--bg-void)' }}>
                <AdminPage />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* ====== LAYER 1: FLOATING UI OVERLAY ====== */}

      {/* Top Bar — Levitating glass header */}
      <header className="floating-header">
        {/* Living gradient edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-full overflow-hidden">
          <div className="w-full h-full animate-gradient" style={{ background: 'var(--gradient-siri)', backgroundSize: '200% 100%' }} />
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'var(--glass-regular)' }}>
            <currentView.icon className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ letterSpacing: '-0.02em' }}>{currentView.title}</h2>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{currentView.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            <MapPin className="w-3 h-3" />
            <span>สามพราน · นครปฐม</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
            <Clock className="w-3 h-3" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Import CSV — Admin only (RBAC) */}
          {canAdmin && (
            <button
              onClick={() => setShowCsvUploader(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300"
              style={{ background: 'var(--glass-regular)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-blue)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10, 132, 255, 0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--glass-regular)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}
              title="Import CSV Cases"
            >
              <Upload className="w-3 h-3" />
              <span className="hidden md:inline">Import CSV</span>
            </button>
          )}

          <div className="status-indicator status-online">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>LIVE</span>
          </div>

          <ThemeToggle />

          {/* Current user + role + logout */}
          {user && (
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{user.fullName || user.username}</span>
                <span className="text-[9px] font-bold uppercase" style={{ color: ROLE_ACCENT[user.role] || 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-xl transition-all duration-300"
                style={{ background: 'var(--glass-regular)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-red)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--glass-regular)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                title="ออกจากระบบ (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Left Panel — Floating sidebar */}
      <ErrorBoundary>
        <Sidebar
          activeView={effectiveView}
          onViewChange={setActiveView}
          onFlyTo={handleFlyTo}
          onPersonSelect={handlePersonSelect}
          selectedPersonId={selectedPersonId}
          showHeatmap={showHeatmap}
          onToggleHeatmap={handleToggleHeatmap}
          canAdmin={canAdmin}
        />
      </ErrorBoundary>

      {/* Bottom Bar — Floating status pill */}
      <footer className="floating-footer">
        <div className="flex items-center gap-3">
          <Shield className="w-3 h-3" style={{ color: 'var(--accent-blue)' }} />
          <span className="font-semibold text-[11px]" style={{ color: 'var(--text-secondary)' }}>DTID</span>
          <span className="px-1.5 py-px rounded-md text-[9px] font-bold" style={{ background: 'var(--glass-regular)', color: 'var(--text-tertiary)' }}>v3</span>
          <span className="hidden sm:inline text-[10px]" style={{ color: 'var(--text-quaternary)' }}>Narcotics Bureau</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(255, 159, 10, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 159, 10, 0.15)' }}>
            CONFIDENTIAL
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-quaternary)' }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </footer>

      {/* CSV Upload Modal */}
      {showCsvUploader && (
        <Suspense fallback={<ViewLoader />}>
          <CsvUploader
            onClose={() => setShowCsvUploader(false)}
            onSuccess={(data) => {
              console.log('CSV import complete:', data);
              // Data is auto-refreshed in the CsvUploader component via refreshFromDatabase
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

// Gate the app behind authentication; restore any persisted backend session.
function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => { restoreSession(); }, [restoreSession]);
  return isAuthenticated ? <AppContent /> : <LoginPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthGate />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
