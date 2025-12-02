import React, { useState, useMemo } from 'react';
import { 
  Search, 
  User, 
  MapPin, 
  ChevronRight,
  Filter,
  UserCheck,
  UserX,
  Briefcase
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

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search by name, alias, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg pl-10 pr-4 py-2 text-sm 
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     ${isDark 
                       ? 'bg-slate-800 border-slate-600 placeholder-slate-500 text-white' 
                       : 'bg-white border-gray-300 placeholder-gray-400 text-gray-900'} border`}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${statusFilter === 'all' 
              ? isDark ? 'bg-slate-600 text-white' : 'bg-gray-600 text-white'
              : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Filter className="w-3 h-3" />
          All ({persons.length})
        </button>
        <button
          onClick={() => setStatusFilter('Arrested')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${statusFilter === 'Arrested' 
              ? 'bg-red-600 text-white' 
              : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <UserX className="w-3 h-3" />
          Arrested
        </button>
        <button
          onClick={() => setStatusFilter('Suspect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${statusFilter === 'Suspect' 
              ? 'bg-yellow-600 text-white' 
              : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <UserCheck className="w-3 h-3" />
          Suspects
        </button>
      </div>

      {/* Person List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredPersons.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No persons found</p>
          </div>
        ) : (
          filteredPersons.map((person) => {
            const location = getLocationById(person.CurrentAddressID);
            const personCases = getCasesForPerson(person.PersonID);
            const isSelected = selectedPersonId === person.PersonID;

            return (
              <div
                key={person.PersonID}
                className={`rounded-lg p-3 border transition-all cursor-pointer
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : isDark 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => handlePersonClick(person)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${person.Status === 'Arrested' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                      {person.Gender === 'M' ? '👨' : '👩'}
                    </div>

                    {/* Info */}
                    <div>
                      <h4 className="font-semibold text-sm">
                        {person.FirstName} {person.LastName}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        "{person.Alias}"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${
                          person.Status === 'Arrested' ? 'badge-arrested' : 'badge-suspect'
                        }`}>
                          {person.Status}
                        </span>
                        {personCases.length > 0 && (
                          <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            <Briefcase className="w-3 h-3" />
                            {personCases.length} case{personCases.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fly to button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlyTo(person);
                    }}
                    className={`p-2 rounded-lg transition-colors group
                      ${isDark ? 'bg-slate-700 hover:bg-blue-600' : 'bg-gray-100 hover:bg-blue-600'}`}
                    title="Fly to location"
                  >
                    <MapPin className={`w-4 h-4 group-hover:text-white ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                  </button>
                </div>

                {/* Location Preview */}
                {location && (
                  <div className={`mt-2 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <MapPin className="w-3 h-3" />
                      {(location.AddressDetail || location.Address || '').substring(0, 40)}...
                    </p>
                  </div>
                )}

                {/* National ID */}
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    ID: {person.NationalID}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Results Count */}
      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          Showing {filteredPersons.length} of {persons.length} persons
        </p>
      </div>
    </div>
  );
};

export default SuspectList;
