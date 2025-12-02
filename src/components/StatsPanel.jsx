import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertTriangle,
  Scale,
  MapPin,
  Clock,
  Pill
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
    'Methamphetamine': 'bg-red-500',
    'Crystal Meth': 'bg-purple-500',
    'Heroin': 'bg-orange-500',
    'Ketamine': 'bg-blue-500',
    'Ecstasy': 'bg-pink-500',
    'Cannabis': 'bg-green-500'
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Active Cases</span>
          </div>
          <p className="text-2xl font-bold text-blue-100">{stats.activeCases}</p>
          <p className="text-xs text-blue-400/70">of {stats.totalCases} total</p>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">Arrests Made</span>
          </div>
          <p className="text-2xl font-bold text-red-100">{stats.totalArrests}</p>
          <p className="text-xs text-red-400/70">individuals</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">Active Suspects</span>
          </div>
          <p className="text-2xl font-bold text-yellow-100">{stats.totalSuspects}</p>
          <p className="text-xs text-yellow-400/70">under surveillance</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Total Seizures</span>
          </div>
          <p className="text-2xl font-bold text-purple-100">{drugSeizures.length}</p>
          <p className="text-xs text-purple-400/70">drug batches</p>
        </div>
      </div>

      {/* Drug Seizures by Type */}
      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Pill className="w-4 h-4 text-pink-400" />
          Drug Seizures by Type
        </h3>
        <div className="space-y-3">
          {stats.drugStats.map((drug, idx) => {
            const maxQuantity = Math.max(...stats.drugStats.map(d => d.totalQuantity));
            const percentage = (drug.totalQuantity / maxQuantity) * 100;
            
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">{drug.type}</span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {formatNumber(drug.totalQuantity)} {drug.unit}
                  </span>
                </div>
                <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full ${drugColors[drug.type] || 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cases */}
      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Recent Cases
        </h3>
        <div className="space-y-3">
          {recentCases.map((c, idx) => (
            <div 
              key={c.CaseID} 
              className={`${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'} rounded-lg p-3 border-l-4 border-cyan-500`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-cyan-300">{c.CaseNumber}</span>
                <span className={`badge text-[10px] ${
                  c.Status === 'Under Investigation' ? 'badge-pending' :
                  c.Status === 'Adjudicated' ? 'badge-arrested' : 'badge-active'
                }`}>
                  {c.Status}
                </span>
              </div>
              <p className="text-sm font-medium">{c.CaseType}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                {new Date(c.ArrestDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className={`${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200'} rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold">Investigation Overview</span>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Currently tracking <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalSuspects + stats.totalArrests}</span> individuals 
          across <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalCases}</span> cases in the Chiang Rai region. 
          The primary focus is on methamphetamine trafficking networks operating near the 
          Myanmar-Thailand border.
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;
