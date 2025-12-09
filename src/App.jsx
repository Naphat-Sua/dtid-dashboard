import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CrimeMap from './components/CrimeMap';
import NetworkGraph from './components/NetworkGraph';
import AdminPage from './components/AdminPage';
import ThemeProvider from './components/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import { useThemeStore } from './store/useStore';
import { Shield, Clock, MapPin, Radio, AlertTriangle, Fingerprint } from 'lucide-react';

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

  // View titles and descriptions
  const viewInfo = {
    map: { 
      title: 'Crime Mapping & Analysis', 
      subtitle: 'GIS Intelligence Module',
      icon: MapPin
    },
    network: { 
      title: 'Criminal Network Analysis', 
      subtitle: 'Link Analysis Module',
      icon: Fingerprint
    },
    admin: { 
      title: 'Data Management Center', 
      subtitle: 'Administrative Module',
      icon: Shield
    }
  };

  const currentView = viewInfo[activeView];

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
        {/* Command Header */}
        <header className={`command-header px-6 py-4 flex items-center justify-between
          ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl border-b
          ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          
          {/* Left Section - Title */}
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <currentView.icon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{currentView.title}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {currentView.subtitle}
              </p>
            </div>
          </div>
          
          {/* Right Section - Status */}
          <div className="flex items-center gap-6">
            {/* Location */}
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Chiang Rai Region</span>
            </div>
            
            {/* Time */}
            <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>

            {/* System Status */}
            <div className="status-indicator status-online">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>ONLINE</span>
            </div>

            {/* Theme Toggle */}
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
        <footer className={`px-6 py-2.5 flex items-center justify-between text-xs border-t
          ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-500' : 'bg-white/90 border-gray-200 text-gray-500'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold">DTID Command Center</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>v2.0</span>
            </div>
            <span className={isDark ? 'text-slate-700' : 'text-gray-300'}>|</span>
            <span>Narcotics Suppression Bureau • Royal Thai Police</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Classification:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-semibold border border-amber-500/30">
                CONFIDENTIAL
              </span>
            </div>
            <span className={isDark ? 'text-slate-700' : 'text-gray-300'}>|</span>
            <span className="font-mono">Last Sync: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
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
