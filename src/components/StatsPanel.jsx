import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertTriangle,
  Scale,
  MapPin,
  Clock,
  Pill,
  Target,
  Shield,
  Activity
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../store/useStore';

const StatsPanel = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { persons, cases, drugSeizures } = useDataStore();

  // Calculate stats from store data
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.Status === 'Under Investigation').length;
    const totalArrests = persons.filter(p => p.Status === 'Arrested').length;
    const totalSuspects = persons.filter(p => p.Status === 'Active' || p.Status === 'Under Surveillance').length;
    
    // Drug seizure stats
    const drugStats = drugSeizures.reduce((acc, s) => {
      const existing = acc.find(d => d.type === s.DrugType);
      if (existing) {
        existing.totalQuantity += s.Quantity;
      } else {
        acc.push({ type: s.DrugType, totalQuantity: s.Quantity, unit: s.Unit });
      }
      return acc;
    }, []).sort((a, b) => b.totalQuantity - a.totalQuantity);

    return { totalCases, activeCases, totalArrests, totalSuspects, drugStats };
  }, [persons, cases, drugSeizures]);

  // Get recent cases (last 3)
  const recentCases = useMemo(() => 
    [...cases]
      .sort((a, b) => new Date(b.ArrestDate) - new Date(a.ArrestDate))
      .slice(0, 3),
    [cases]
  );

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Drug type colors
  const drugColors = {
    'Methamphetamine': { bg: 'bg-red-500', ring: 'ring-red-500/30' },
    'Crystal Meth': { bg: 'bg-purple-500', ring: 'ring-purple-500/30' },
    'Heroin': { bg: 'bg-orange-500', ring: 'ring-orange-500/30' },
    'Ketamine': { bg: 'bg-blue-500', ring: 'ring-blue-500/30' },
    'Ecstasy': { bg: 'bg-pink-500', ring: 'ring-pink-500/30' },
    'Cannabis': { bg: 'bg-green-500', ring: 'ring-green-500/30' }
  };

  return (
    <div className="space-y-5">
      {/* Key Metrics - Tactical Style */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Cases */}
        <div className={`relative overflow-hidden rounded-xl p-4 
          ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full 
            ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}></div>
          <Briefcase className={`w-5 h-5 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1
            ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Active Cases</p>
          <p className="text-2xl font-bold font-mono">{stats.activeCases}</p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            of {stats.totalCases} total
          </p>
        </div>

        {/* Arrests */}
        <div className={`relative overflow-hidden rounded-xl p-4 
          ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full 
            ${isDark ? 'bg-red-500/10' : 'bg-red-100'}`}></div>
          <Shield className={`w-5 h-5 mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1
            ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Arrests</p>
          <p className="text-2xl font-bold font-mono">{stats.totalArrests}</p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            individuals
          </p>
        </div>

        {/* Active Suspects */}
        <div className={`relative overflow-hidden rounded-xl p-4 
          ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full 
            ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}></div>
          <Target className={`w-5 h-5 mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1
            ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Active Targets</p>
          <p className="text-2xl font-bold font-mono">{stats.totalSuspects}</p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            under surveillance
          </p>
        </div>

        {/* Seizures */}
        <div className={`relative overflow-hidden rounded-xl p-4 
          ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full 
            ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}></div>
          <Scale className={`w-5 h-5 mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1
            ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Seizures</p>
          <p className="text-2xl font-bold font-mono">{drugSeizures.length}</p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            drug batches
          </p>
        </div>
      </div>

      {/* Drug Seizures by Type */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
        <h3 className={`text-[10px] uppercase tracking-wider font-semibold mb-4 flex items-center gap-2
          ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <Pill className="w-3.5 h-3.5" />
          Seizure Analysis
        </h3>
        <div className="space-y-3">
          {stats.drugStats.map((drug, idx) => {
            const maxQuantity = Math.max(...stats.drugStats.map(d => d.totalQuantity));
            const percentage = (drug.totalQuantity / maxQuantity) * 100;
            const colors = drugColors[drug.type] || { bg: 'bg-slate-500', ring: 'ring-slate-500/30' };
            
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {drug.type}
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {formatNumber(drug.totalQuantity)} {drug.unit}
                  </span>
                </div>
                <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cases */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'bg-white ring-1 ring-gray-200 shadow-sm'}`}>
        <h3 className={`text-[10px] uppercase tracking-wider font-semibold mb-4 flex items-center gap-2
          ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <Activity className="w-3.5 h-3.5" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentCases.map((c, idx) => (
            <div 
              key={c.CaseID} 
              className={`rounded-lg p-3 border-l-3 transition-all
                ${isDark 
                  ? 'bg-slate-700/30 border-l-blue-500 hover:bg-slate-700/50' 
                  : 'bg-gray-50 border-l-blue-500 hover:bg-gray-100'}`}
              style={{ borderLeftWidth: '3px' }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-mono text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {c.CaseNumber}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${c.Status === 'Under Investigation' 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : c.Status === 'Adjudicated' 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-blue-500/20 text-blue-400'}`}>
                  {c.Status}
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                {c.CaseType}
              </p>
              <p className={`text-[10px] mt-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                {new Date(c.ArrestDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Overview */}
      <div className={`rounded-xl p-4 ${isDark 
        ? 'bg-gradient-to-br from-blue-900/30 to-slate-800/50 ring-1 ring-blue-500/20' 
        : 'bg-gradient-to-br from-blue-50 to-white ring-1 ring-blue-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Operation Summary
          </span>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Monitoring <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalSuspects + stats.totalArrests}</span> individuals 
          across <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalCases}</span> active investigations. 
          Primary focus: Methamphetamine networks near the Myanmar-Thailand border.
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;
