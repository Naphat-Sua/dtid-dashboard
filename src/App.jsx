import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CrimeMap from './components/CrimeMap';
import NetworkGraph from './components/NetworkGraph';
import AdminPage from './components/AdminPage';
import ThemeProvider from './components/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import { useThemeStore } from './store/useStore';
import { Shield, Clock, MapPin } from 'lucide-react';

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
          <div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <pre className="bg-red-800 p-4 rounded text-sm overflow-auto">
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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [activeView, setActiveView] = useState('map');
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

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

  return (
    <div className={`flex h-screen w-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <ErrorBoundary>
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onFlyTo={handleFlyTo}
          onPersonSelect={handlePersonSelect}
          selectedPersonId={selectedPersonId}
          showHeatmap={showHeatmap}
          onToggleHeatmap={handleToggleHeatmap}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className={`${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border-b px-6 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className="text-lg font-semibold">
                {activeView === 'map' && 'Crime Map - Chiang Rai Region'}
                {activeView === 'network' && 'Criminal Network Analysis'}
                {activeView === 'admin' && 'Admin Data Management'}
              </h2>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${isDark ? 'text-slate-500 bg-slate-800' : 'text-gray-500 bg-gray-100'}`}>
              {activeView === 'map' && 'GIS Module'}
              {activeView === 'network' && 'Network Module'}
              {activeView === 'admin' && 'Admin Module'}
            </span>
          </div>
          
          <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span>Chiang Rai Province, Thailand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleDateString('th-TH', { 
                weekday: 'short',
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 relative overflow-hidden">
          <ErrorBoundary>
            {activeView === 'map' && (
              <CrimeMap 
                flyToLocation={flyToLocation}
                showHeatmap={showHeatmap}
                onMarkerClick={(location) => {
                  console.log('Marker clicked:', location);
                }}
              />
            )}
            {activeView === 'network' && (
              <NetworkGraph 
                onPersonSelect={handlePersonSelect}
                selectedPersonId={selectedPersonId}
              />
            )}
            {activeView === 'admin' && (
              <AdminPage />
            )}
          </ErrorBoundary>
        </main>

        {/* Bottom Status Bar */}
        <footer className={`${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-500' : 'bg-white/80 border-gray-200 text-gray-500'} border-t px-6 py-2 flex items-center justify-between text-xs`}>
          <div className="flex items-center gap-4">
            <span>DTID Dashboard v1.0</span>
            <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>|</span>
            <span>Narcotics Control Bureau - Thailand</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Data Classification: <span className="text-yellow-500">CONFIDENTIAL</span></span>
            <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>|</span>
            <span>Last Sync: Just now</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
