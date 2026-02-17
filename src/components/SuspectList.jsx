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

const SuspectList = ({ onFlyTo, onPersonSelect, selectedPersonId }) => {
  const { persons, locations, cases, getCasesForPerson } = useDataStore(
    useShallow(s => ({ persons: s.persons, locations: s.locations, cases: s.cases, getCasesForPerson: s.getCasesForPerson }))
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, Arrested, Suspect

  // Helper to get location by ID
  const getLocationById = (id) => locations.find(l => l.LocationID === id);

  // Filter and search persons
  const filteredPersons = useMemo(() => {
    return persons.filter(person => {
      // Status filter
      if (statusFilter !== 'all' && person.Status !== statusFilter) {
        return false;
      }

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
  }, [persons, searchQuery, statusFilter]);

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

  // Get risk level based on role
  const getRiskLevel = (role) => {
    if (role === 'Boss') return { level: 'critical', label: 'CRITICAL', color: 'red' };
    if (role === 'Manager') return { level: 'high', label: 'HIGH', color: 'orange' };
    return { level: 'medium', label: 'MEDIUM', color: 'yellow' };
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
          { key: 'Arrested', label: 'DETAINED', icon: UserX, accent: 'var(--accent-red)' },
          { key: 'Suspect', label: 'AT LARGE', icon: AlertTriangle, accent: 'var(--accent-orange)' },
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
            const personCases = getCasesForPerson(person.PersonID);
            const isSelected = selectedPersonId === person.PersonID;
            const risk = getRiskLevel(person.RoleInNetwork);

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
                  style={{ background: risk.level === 'critical' ? 'var(--accent-red)' : risk.level === 'high' ? 'var(--accent-orange)' : 'var(--accent-yellow)' }}
                />

                <div className="flex items-start justify-between pl-2">
                  <div className="flex items-start gap-3">
                    {/* Avatar with status ring */}
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold
                        ${person.Status === 'Arrested' 
                          ? 'bg-gradient-to-br from-red-600 to-red-700 ring-2 ring-red-500/30' 
                          : 'bg-gradient-to-br from-amber-500 to-amber-600 ring-2 ring-amber-500/30'}`}>
                        {person.Gender === 'M' ? '👨' : '👩'}
                      </div>
                      {person.RoleInNetwork === 'Boss' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-[8px]">👑</span>
                        </div>
                      )}
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
                          {person.Status}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                          style={{ background: 'var(--glass-thin)', color: 'var(--text-secondary)' }}>
                          {person.RoleInNetwork}
                        </span>
                        {personCases.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-quaternary)' }}>
                            <Briefcase className="w-3 h-3" />
                            {personCases.length} case{personCases.length > 1 ? 's' : ''}
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
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-green)', boxShadow: 'var(--glow-green)' }} />
            Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuspectList;
