import React, { useState, useMemo } from 'react';
import { 
  Search, 
  User, 
  MapPin, 
  ChevronRight,
  Filter,
  UserCheck,
  UserX,
  Briefcase,
  AlertTriangle,
  Shield,
  Target,
  Eye
} from 'lucide-react';
import { useDataStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { getRiskConfig } from '../utils/riskLevels';
import { filterCasesByProvince, getPersonIdsForCases } from '../utils/provinceFilter';
import { AT_LARGE_STATUSES, DETAINED_STATUSES, PERSON_STATUSES, labelFor } from '../constants/enums';

const SuspectList = ({ onFlyTo, onPersonSelect, selectedPersonId }) => {
  const { persons, locations, cases, personCases, getCasesForPerson, selectedProvince } = useDataStore(
    useShallow(s => ({
      persons: s.persons, locations: s.locations, cases: s.cases,
      personCases: s.personCases, getCasesForPerson: s.getCasesForPerson,
      selectedProvince: s.selectedProvince,
    }))
  );

  const dbMode = useDataStore((s) => s.dbMode);
  const isLiveDb = dbMode !== 'local';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'detained' | 'at-large'

  // Helper to get location by ID
  const getLocationById = (id) => locations.find(l => l.LocationID === id);

  // Case IDs within the selected province (null = no province filter active)
  const scopedCaseIds = useMemo(() => (
    selectedProvince
      ? new Set(filterCasesByProvince(cases, locations, selectedProvince).map(c => c.CaseID))
      : null
  ), [cases, locations, selectedProvince]);

  // Filter and search persons
  const filteredPersons = useMemo(() => {
    const scopedPersonIds = scopedCaseIds ? getPersonIdsForCases(personCases, scopedCaseIds) : null;

    return persons.filter(person => {
      // Province filter — only people tied to a case in the selected province
      if (scopedPersonIds && !scopedPersonIds.has(person.PersonID)) return false;

      // Status filter (detained vs at-large sets)
      if (statusFilter === 'detained' && !DETAINED_STATUSES.includes(person.Status)) return false;
      if (statusFilter === 'at-large' && !AT_LARGE_STATUSES.includes(person.Status)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          person.FirstName.toLowerCase().includes(query) ||
          person.LastName.toLowerCase().includes(query) ||
          (person.Alias && person.Alias.toLowerCase().includes(query)) ||
          person.NationalID.includes(query)
        );
      }

      return true;
    });
  }, [persons, personCases, scopedCaseIds, searchQuery, statusFilter]);

  // Counts for the filter pills (over the full target list)
  const statusCounts = useMemo(() => ({
    detained: persons.filter(p => DETAINED_STATUSES.includes(p.Status)).length,
    atLarge: persons.filter(p => AT_LARGE_STATUSES.includes(p.Status)).length,
  }), [persons]);

  const handleFlyTo = (person) => {
    const location = getLocationById(person.CurrentAddressID);
    if (location && onFlyTo) {
      onFlyTo({
        lat: location.Latitude,
        lng: location.Longitude,
        zoom: 15
      });
    }
  };

  const handlePersonClick = (person) => {
    if (onPersonSelect) {
      onPersonSelect(person);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — Spatial glass */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Target className="w-4 h-4" style={{ color: 'var(--accent-red)' }} />
        <span className="text-xs font-bold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
          Target Database
        </span>
        <span className="ml-auto px-2.5 py-1 text-[10px] font-bold rounded-lg"
          style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
          {persons.length} RECORDS
        </span>
      </div>

      {/* Search — Spatial glass input */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-quaternary)' }} />
        <input
          type="text"
          placeholder="Search name, alias, or National ID..."
          aria-label="ค้นหาเป้าหมายด้วยชื่อ ฉายา หรือเลขบัตรประชาชน"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl pl-10 pr-4 py-2.5 text-sm transition-all duration-300
                     focus:outline-none focus:ring-2"
          style={{
            background: 'var(--glass-thin)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent-blue)',
          }}
        />
      </div>

      {/* Filter — Fluid spatial pills */}
      <div className="flex gap-1.5 mb-4">
        {[
          { key: 'all', label: `ALL (${persons.length})`, icon: Shield, accent: 'var(--accent-blue)' },
          { key: 'detained', label: `DETAINED (${statusCounts.detained})`, icon: UserX, accent: 'var(--accent-red)' },
          { key: 'at-large', label: `AT LARGE (${statusCounts.atLarge})`, icon: AlertTriangle, accent: 'var(--accent-orange)' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300"
            style={statusFilter === f.key
              ? { background: f.accent, color: 'white', boxShadow: `0 4px 12px color-mix(in srgb, ${f.accent} 35%, transparent)` }
              : { background: 'var(--glass-thin)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <f.icon className="w-3 h-3" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Person List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredPersons.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-quaternary)' }}>
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No targets found</p>
            <p className="text-xs mt-1 opacity-70">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredPersons.map((person) => {
            const location = getLocationById(person.CurrentAddressID);
            const personCaseList = getCasesForPerson(person.PersonID);
            // Case count respects the active province filter, if any
            const caseCount = scopedCaseIds
              ? personCaseList.filter(c => scopedCaseIds.has(c.CaseID)).length
              : personCaseList.length;
            const isSelected = selectedPersonId === person.PersonID;
            const risk = getRiskConfig(person.RiskLevel);

            return (
              <div
                key={person.PersonID}
                className="person-card spatial-card rounded-2xl p-3.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={isSelected ? { 
                  border: '1px solid var(--accent-blue)',
                  boxShadow: 'var(--glow-blue)'
                } : {}}
                onClick={() => handlePersonClick(person)}
              >
                {/* Risk indicator strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: risk.colors.raw }}
                />

                <div className="flex items-start justify-between pl-2">
                  <div className="flex items-start gap-3">
                    {/* Avatar with status ring */}
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold
                        ${person.Status === 'Arrested'
                          ? 'bg-gradient-to-br from-red-600 to-red-700 ring-2 ring-red-500/30'
                          : 'bg-gradient-to-br from-amber-500 to-amber-600 ring-2 ring-amber-500/30'}`}>
                        {person.Gender === 'M' ? '👨' : person.Gender === 'F' ? '👩' : '🧑'}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {person.FirstName} {person.LastName}
                      </h4>
                      <p className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>
                        a.k.a. "{person.Alias}"
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase"
                          style={person.Status === 'Arrested' 
                            ? { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 69, 58, 0.15)' }
                            : { background: 'rgba(255, 159, 10, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 159, 10, 0.15)' }}>
                          {person.Status === 'Arrested' ? <UserX className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {labelFor(PERSON_STATUSES, person.Status)}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase"
                          style={{ background: `${risk.colors.raw}22`, color: risk.colors.raw }}>
                          {risk.label}
                        </span>
                        {caseCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-quaternary)' }}>
                            <Briefcase className="w-3 h-3" />
                            {caseCount} case{caseCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlyTo(person);
                      }}
                      className="p-2 rounded-xl transition-all duration-300 group"
                      style={{ background: 'var(--glass-thin)' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-blue)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'var(--glass-thin)'; }}
                      title="Locate on map"
                    >
                      <MapPin className="w-4 h-4 transition-colors group-hover:text-white" style={{ color: 'var(--text-quaternary)' }} />
                    </button>
                  </div>
                </div>

                {/* Location Preview */}
                {location && (
                  <div className="mt-3 pt-2.5 ml-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-quaternary)' }}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{(location.AddressDetail || location.Address || 'Unknown location')}</span>
                    </p>
                  </div>
                )}

                {/* National ID */}
                <div className="mt-2 flex items-center justify-between ml-2">
                  <span className="text-[10px] tracking-wide" style={{ fontFeatureSettings: '"tnum"', color: 'var(--text-quaternary)' }}>
                    NID: {person.NationalID}
                  </span>
                  <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-quaternary)' }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Results Footer — Ambient */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-quaternary)' }}>
          <span className="font-semibold">
            Displaying {filteredPersons.length} of {persons.length} targets
          </span>
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isLiveDb ? 'animate-pulse' : ''}`}
              style={isLiveDb
                ? { background: 'var(--accent-green)', boxShadow: 'var(--glow-green)' }
                : { background: 'var(--accent-orange)' }} />
            {isLiveDb ? 'Live' : 'Demo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuspectList;
