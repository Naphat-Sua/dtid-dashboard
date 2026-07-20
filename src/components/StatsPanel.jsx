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
import { useDataStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { filterCasesByProvince, getPersonIdsForCases } from '../utils/provinceFilter';

const StatsPanel = () => {
  const { persons, cases, drugSeizures, locations, personCases, selectedProvince } = useDataStore(
    useShallow(s => ({
      persons: s.persons, cases: s.cases, drugSeizures: s.drugSeizures,
      locations: s.locations, personCases: s.personCases, selectedProvince: s.selectedProvince,
    }))
  );

  // Calculate stats from store data — scoped to the selected province (if any)
  const stats = useMemo(() => {
    const scopedCases = filterCasesByProvince(cases, locations, selectedProvince);
    const scopedCaseIds = new Set(scopedCases.map(c => c.CaseID));
    const scopedPersonIds = selectedProvince ? getPersonIdsForCases(personCases, scopedCaseIds) : null;
    const scopedPersons = scopedPersonIds ? persons.filter(p => scopedPersonIds.has(p.PersonID)) : persons;
    const scopedSeizures = selectedProvince ? drugSeizures.filter(s => scopedCaseIds.has(s.CaseID)) : drugSeizures;

    const totalCases = scopedCases.length;
    const activeCases = scopedCases.filter(c => c.Status === 'Under Investigation').length;
    const totalArrests = scopedPersons.filter(p => p.Status === 'Arrested').length;
    const totalSuspects = scopedPersons.filter(p => p.Status === 'Active' || p.Status === 'Under Surveillance').length;
    const totalSeizures = scopedSeizures.length;

    // Drug seizure stats
    const drugStats = scopedSeizures.reduce((acc, s) => {
      const existing = acc.find(d => d.type === s.DrugType);
      if (existing) {
        existing.totalQuantity += s.Quantity;
      } else {
        acc.push({ type: s.DrugType, totalQuantity: s.Quantity, unit: s.Unit });
      }
      return acc;
    }, []).sort((a, b) => b.totalQuantity - a.totalQuantity);

    return { totalCases, activeCases, totalArrests, totalSuspects, totalSeizures, drugStats };
  }, [persons, cases, drugSeizures, locations, personCases, selectedProvince]);

  // Get recent cases (last 3) — also scoped to the selected province
  const recentCases = useMemo(() =>
    [...filterCasesByProvince(cases, locations, selectedProvince)]
      .sort((a, b) => new Date(b.ArrestDate) - new Date(a.ArrestDate))
      .slice(0, 3),
    [cases, locations, selectedProvince]
  );

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Drug type living colors
  const drugColors = {
    'Methamphetamine': { color: 'var(--accent-red)', glow: 'var(--glow-red)' },
    'Crystal Meth': { color: 'var(--accent-purple)', glow: 'var(--glow-purple)' },
    'Heroin': { color: 'var(--accent-orange)', glow: 'rgba(255, 159, 10, 0.25)' },
    'Ketamine': { color: 'var(--accent-blue)', glow: 'var(--glow-blue)' },
    'Ecstasy': { color: 'var(--accent-pink)', glow: 'rgba(255, 55, 95, 0.25)' },
    'Cannabis': { color: 'var(--accent-green)', glow: 'var(--glow-green)' }
  };

  const metricCards = [
    { icon: Briefcase, label: 'Active Cases', value: stats.activeCases, sub: `of ${stats.totalCases} total`, accent: 'var(--accent-blue)', glow: 'var(--glow-blue)' },
    { icon: Shield, label: 'Arrests', value: stats.totalArrests, sub: 'individuals', accent: 'var(--accent-red)', glow: 'var(--glow-red)' },
    { icon: Target, label: 'Active Targets', value: stats.totalSuspects, sub: 'under surveillance', accent: 'var(--accent-orange)', glow: 'rgba(255,159,10,0.2)' },
    { icon: Scale, label: 'Seizures', value: stats.totalSeizures, sub: 'drug batches', accent: 'var(--accent-purple)', glow: 'var(--glow-purple)' },
  ];

  return (
    <div className="space-y-5">
      {/* Key Metrics — Spatial glass cards */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((card, i) => (
          <div key={i} className="spatial-card relative overflow-hidden rounded-2xl p-4"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[20px] opacity-[0.06]"
              style={{ background: card.accent }} />
            <card.icon className="w-5 h-5 mb-2" style={{ color: card.accent }} />
            <p className="text-[10px] font-bold mb-1" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
              {card.label}
            </p>
            <p className="text-2xl font-bold" style={{ letterSpacing: '-0.03em', fontFeatureSettings: '"tnum"', color: 'var(--text-primary)' }}>
              {card.value}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-quaternary)' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Drug Seizures — Living color bars */}
      <div className="spatial-card rounded-2xl p-4">
        <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2"
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
          <Pill className="w-3.5 h-3.5" />
          Seizure Analysis
        </h3>
        <div className="space-y-3.5">
          {stats.drugStats.map((drug, idx) => {
            const maxQuantity = Math.max(...stats.drugStats.map(d => d.totalQuantity));
            const percentage = (drug.totalQuantity / maxQuantity) * 100;
            const colors = drugColors[drug.type] || { color: 'var(--accent-cyan)', glow: 'rgba(100,210,255,0.2)' };
            
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {drug.type}
                  </span>
                  <span className="text-xs font-semibold" style={{ fontFeatureSettings: '"tnum"', color: 'var(--text-tertiary)' }}>
                    {formatNumber(drug.totalQuantity)} {drug.unit}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-thin)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${percentage}%`, 
                      background: colors.color,
                      boxShadow: `0 0 12px ${colors.glow}`,
                      animationDelay: `${idx * 100}ms`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cases — Spatial timeline */}
      <div className="spatial-card rounded-2xl p-4">
        <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2"
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
          <Activity className="w-3.5 h-3.5" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentCases.map((c) => {
            const statusStyle = c.Status === 'Under Investigation'
              ? { background: 'rgba(255, 159, 10, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 159, 10, 0.15)' }
              : c.Status === 'Adjudicated'
              ? { background: 'rgba(48, 209, 88, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(48, 209, 88, 0.15)' }
              : { background: 'rgba(10, 132, 255, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(10, 132, 255, 0.15)' };
            
            return (
              <div 
                key={c.CaseID} 
                className="rounded-xl p-3 transition-all duration-300 cursor-default"
                style={{ 
                  background: 'var(--glass-thin)', 
                  borderLeft: `3px solid var(--accent-blue)` 
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold" style={{ fontFeatureSettings: '"tnum"', color: 'var(--accent-blue)' }}>
                    {c.CaseNumber}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={statusStyle}>
                    {c.Status}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {c.CaseType}
                </p>
                <p className="text-[10px] mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-quaternary)' }}>
                  <Clock className="w-3 h-3" />
                  {new Date(c.ArrestDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operation Summary — Ambient glass callout */}
      <div className="rounded-2xl p-4 siri-glow" style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--accent-blue)' }}>
            Operation Summary
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          Monitoring <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalSuspects + stats.totalArrests}</span> individuals 
          across <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalCases}</span> active investigations. 
          Primary focus: Methamphetamine networks near the Myanmar-Thailand border.
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;
