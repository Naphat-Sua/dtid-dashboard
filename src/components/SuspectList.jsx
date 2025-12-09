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
import { useDataStore, useThemeStore } from '../store/useStore';

const SuspectList = ({ onFlyTo, onPersonSelect, selectedPersonId }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { persons, locations, cases, getCasesForPerson } = useDataStore();
  
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
      {/* Header */}
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <Target className="w-4 h-4 text-red-500" />
        <span className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Target Database
        </span>
        <span className="ml-auto px-2 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-bold rounded">
          {persons.length} RECORDS
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search name, alias, or National ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                     ${isDark 
                       ? 'bg-slate-900 border-slate-700 placeholder-slate-600 text-slate-200' 
                       : 'bg-white border-gray-200 placeholder-gray-400 text-gray-900 shadow-sm'} border`}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            ${statusFilter === 'all' 
              ? isDark 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : isDark 
                ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
        >
          <Shield className="w-3 h-3" />
          ALL ({persons.length})
        </button>
        <button
          onClick={() => setStatusFilter('Arrested')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            ${statusFilter === 'Arrested' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/25' 
              : isDark 
                ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
        >
          <UserX className="w-3 h-3" />
          DETAINED
        </button>
        <button
          onClick={() => setStatusFilter('Suspect')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            ${statusFilter === 'Suspect' 
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25' 
              : isDark 
                ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
        >
          <AlertTriangle className="w-3 h-3" />
          AT LARGE
        </button>
      </div>

      {/* Person List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredPersons.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No targets found</p>
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
                className={`person-card rounded-xl p-3.5 border transition-all cursor-pointer relative overflow-hidden
                  ${isSelected 
                    ? isDark
                      ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10' 
                      : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                    : isDark 
                      ? 'bg-slate-800/60 border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800'
                      : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`}
                onClick={() => handlePersonClick(person)}
              >
                {/* Risk indicator strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 
                  ${risk.level === 'critical' ? 'bg-red-500' : 
                    risk.level === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} 
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
                      <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {person.FirstName} {person.LastName}
                      </h4>
                      <p className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        a.k.a. "{person.Alias}"
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                          ${person.Status === 'Arrested' 
                            ? 'bg-red-600/20 text-red-400 ring-1 ring-red-500/30' 
                            : 'bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30'}`}>
                          {person.Status === 'Arrested' ? <UserX className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {person.Status}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold
                          ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                          {person.RoleInNetwork}
                        </span>
                        {personCases.length > 0 && (
                          <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                      className={`p-2 rounded-lg transition-all group
                        ${isDark 
                          ? 'bg-slate-700/80 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20' 
                          : 'bg-gray-100 hover:bg-blue-600 hover:shadow-lg'}`}
                      title="Locate on map"
                    >
                      <MapPin className={`w-4 h-4 transition-colors group-hover:text-white ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>

                {/* Location Preview */}
                {location && (
                  <div className={`mt-3 pt-2.5 border-t ml-2 ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
                    <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{(location.AddressDetail || location.Address || 'Unknown location')}</span>
                    </p>
                  </div>
                )}

                {/* National ID */}
                <div className="mt-2 flex items-center justify-between ml-2">
                  <span className={`text-[10px] font-mono tracking-wide ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    NID: {person.NationalID}
                  </span>
                  <Eye className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Results Footer */}
      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
        <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          <span className="font-medium">
            Displaying {filteredPersons.length} of {persons.length} targets
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuspectList;
