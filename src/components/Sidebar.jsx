import React, { useState } from 'react';
import {
  Map,
  Network,
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  Eye,
  EyeOff,
  Database,
  Shield,
  Target,
  Radio
} from 'lucide-react';
import StatsPanel from './StatsPanel';
import SuspectList from './SuspectList';

const Sidebar = ({
  activeView,
  onViewChange,
  onFlyTo,
  onPersonSelect,
  selectedPersonId,
  showHeatmap,
  onToggleHeatmap,
  canAdmin = false
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  const navItems = [
    { id: 'map', icon: Map, label: 'Crime Map', description: 'Geographic Intelligence' },
    { id: 'network', icon: Network, label: 'Network', description: 'Link Analysis' },
  ];

  return (
    <aside className={`floating-sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      
      {/* Header — Brand identity */}
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl siri-glow animate-orbit-glow" style={{ background: 'var(--glass-regular)' }}>
                <Shield className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div>
                <h1 className="text-[15px] font-bold" style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>DTID</h1>
                <p className="text-[9px] font-semibold" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>Command Center</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2 rounded-2xl animate-orbit-glow" style={{ background: 'var(--glass-regular)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
            className="p-1.5 rounded-lg transition-all duration-300"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--glass-regular)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {!collapsed && (
          <p className="text-[9px] font-bold mb-2 px-1.5" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
            Modules
          </p>
        )}
        <div className={`flex ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-label={item.label}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 w-full group
                ${activeView === item.id ? 'text-white' : ''}`}
              style={activeView === item.id 
                ? { background: 'var(--accent-blue)', boxShadow: '0 4px 16px rgba(10, 132, 255, 0.35)' }
                : { color: 'var(--text-tertiary)' }}
              onMouseOver={e => { if(activeView !== item.id) { e.currentTarget.style.background = 'var(--glass-regular)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseOut={e => { if(activeView !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}}
            >
              <item.icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 ${activeView !== item.id ? 'group-hover:scale-110' : ''}`} />
              {!collapsed && (
                <div className="text-left">
                  <span className="text-[13px] font-semibold block" style={{ letterSpacing: '-0.01em' }}>{item.label}</span>
                  {activeView === item.id && (
                    <span className="text-[9px] opacity-75">{item.description}</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Button — Admin role only (RBAC) */}
      {!collapsed && canAdmin && (
        <div className="px-2.5 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => onViewChange('admin')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300"
            style={activeView === 'admin'
              ? { background: 'var(--accent-purple)', color: 'white', boxShadow: '0 4px 16px rgba(191, 90, 242, 0.35)' }
              : { background: 'var(--glass-thin)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <Database className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
      )}

      {/* Map Layer Controls */}
      {activeView === 'map' && !collapsed && (
        <div className="px-2.5 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold flex items-center gap-1.5" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
              <Layers className="w-3 h-3" />
              Layers
            </span>
            <button
              onClick={onToggleHeatmap}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-300"
              style={showHeatmap 
                ? { background: 'rgba(255, 159, 10, 0.12)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 159, 10, 0.2)' }
                : { background: 'var(--glass-thin)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
            >
              {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Heat
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Segmented Tab Control */}
          <div className="flex p-1 mx-2.5 mt-2 rounded-xl" style={{ background: 'var(--glass-thin)' }}>
            <button
              onClick={() => setActiveTab('stats')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300"
              style={activeTab === 'stats'
                ? { background: 'var(--accent-blue)', color: 'white', boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)' }
                : { color: 'var(--text-tertiary)' }}
            >
              <Target className="w-3 h-3" />
              Intel
            </button>
            <button
              onClick={() => setActiveTab('suspects')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300"
              style={activeTab === 'suspects'
                ? { background: 'var(--accent-blue)', color: 'white', boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)' }
                : { color: 'var(--text-tertiary)' }}
            >
              <Users className="w-3 h-3" />
              Targets
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'stats' ? (
              <StatsPanel />
            ) : (
              <SuspectList 
                onFlyTo={onFlyTo}
                onPersonSelect={onPersonSelect}
                selectedPersonId={selectedPersonId}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer — honest live-status indicator */}
      <div className="px-2.5 py-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-1'}`}>
          <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ background: 'var(--accent-green)', boxShadow: 'var(--glow-green)' }}
            title="ระบบพร้อมใช้งาน" />
          {!collapsed && (
            <span className="text-[10px] font-semibold" style={{ letterSpacing: '0.04em', color: 'var(--text-quaternary)' }}>
              ระบบพร้อมใช้งาน · DTID v1.0
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
