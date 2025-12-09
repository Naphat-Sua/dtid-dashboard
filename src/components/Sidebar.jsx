import React, { useState } from 'react';
import {
  Map,
  Network,
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
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
import { useThemeStore } from '../store/useStore';

const Sidebar = ({ 
  activeView, 
  onViewChange, 
  onFlyTo, 
  onPersonSelect,
  selectedPersonId,
  showHeatmap,
  onToggleHeatmap
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // stats, suspects

  const navItems = [
    { id: 'map', icon: Map, label: 'Crime Map', description: 'Geographic Intelligence' },
    { id: 'network', icon: Network, label: 'Network', description: 'Link Analysis' },
  ];

  return (
    <div className={`flex flex-col h-full transition-all duration-300 border-r
      ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-gray-200'}
      ${collapsed ? 'w-20' : 'w-80'}`}>
      
      {/* Header - Police Badge Style */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-600/20 ring-1 ring-blue-500/30' : 'bg-blue-100 ring-1 ring-blue-200'}`}>
                <Shield className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight
                  ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  DTID
                </h1>
                <p className={`text-[10px] uppercase tracking-widest font-medium
                  ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  Command Center
                </p>
              </div>
            </div>
          ) : (
            <div className={`mx-auto p-2 rounded-xl ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <Shield className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-lg transition-all
              ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation - Tactical Style */}
      <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        {!collapsed && (
          <p className={`text-[10px] uppercase tracking-widest font-semibold mb-3 px-1
            ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Modules
          </p>
        )}
        <div className={`flex ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full group
                ${activeView === item.id 
                  ? isDark 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${activeView === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
              {!collapsed && (
                <div className="text-left">
                  <span className="text-sm font-medium block">{item.label}</span>
                  {activeView === item.id && (
                    <span className="text-[10px] opacity-80">{item.description}</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Button */}
      {!collapsed && (
        <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={() => onViewChange('admin')}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeView === 'admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : isDark 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
          >
            <Database className="w-4 h-4" />
            Admin Panel
          </button>
        </div>
      )}

      {/* Map Controls (only show when map is active) */}
      {activeView === 'map' && !collapsed && (
        <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-2 
              ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              <Layers className="w-3 h-3" />
              Layers
            </span>
            <button
              onClick={onToggleHeatmap}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${showHeatmap 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm' 
                  : isDark 
                    ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                    : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
            >
              {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Heatmap
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all
                ${activeTab === 'stats' 
                  ? isDark 
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' 
                    : 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50' 
                  : isDark 
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Target className="w-4 h-4" />
              Intelligence
            </button>
            <button
              onClick={() => setActiveTab('suspects')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all
                ${activeTab === 'suspects' 
                  ? isDark 
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' 
                    : 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : isDark 
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" />
              Suspects
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
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

      {/* Footer */}
      <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className={`flex ${collapsed ? 'flex-col gap-2 items-center' : 'justify-between'}`}>
          <button className={`p-2.5 rounded-xl transition-all relative group
            ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900"></span>
          </button>
          {!collapsed && (
            <button className={`p-2.5 rounded-xl transition-all
              ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
