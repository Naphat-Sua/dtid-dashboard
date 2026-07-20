import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dbService } from '../services/dbService';

// ── Mock data is now lazy-loaded, not statically imported ──
// This removes ~30 KB from the initial bundle.  The mock arrays
// are only fetched when resetData() is explicitly called.
let _mockDataCache = null;
const loadMockData = async () => {
  if (!_mockDataCache) {
    _mockDataCache = await import('../data/mockData');
  }
  return _mockDataCache;
};

// Empty arrays used as initial state (hydrated from localStorage
// via Zustand persist, or from the database via loadFromDatabase).
const EMPTY = [];

// Theme Store - persisted to localStorage
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' | 'dark'
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'dtid-theme',
    }
  )
);

// ── Role hierarchy for RBAC (mirrors the server) ──
const ROLE_LEVEL = { Viewer: 1, Analyst: 2, Admin: 3 };
const DEMO_NAMES = {
  Admin: 'ผู้ดูแลระบบ (Demo)',
  Analyst: 'นักวิเคราะห์ (Demo)',
  Viewer: 'ผู้บังคับบัญชา (Demo)',
};

// Auth Store — JWT session + RBAC. The refresh token is persisted (so a
// session survives reload); the access token lives only in memory.
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,            // { userId, username, fullName, role }
      refreshToken: null,    // persisted; access token stays in dbService memory
      isDemo: false,         // demo mode = client-only role, no backend
      isAuthenticated: false,
      authError: null,
      isAuthLoading: false,

      // Real login against the backend (/api/auth/login).
      login: async (username, password) => {
        set({ isAuthLoading: true, authError: null });
        try {
          const { user } = await dbService.login(username, password);
          set({ user, refreshToken: dbService.refreshToken, isDemo: false, isAuthenticated: true, isAuthLoading: false });
          return true;
        } catch (e) {
          set({ authError: e.message || 'เข้าสู่ระบบไม่สำเร็จ', isAuthLoading: false, isAuthenticated: false });
          return false;
        }
      },

      // Demo login — pick a role locally (no backend needed, for the offline demo).
      loginDemo: (role) => {
        dbService.clearAuth();
        set({
          user: { userId: null, username: role.toLowerCase(), fullName: DEMO_NAMES[role] || role, role },
          refreshToken: null, isDemo: true, isAuthenticated: true, authError: null,
        });
      },

      logout: () => {
        if (!get().isDemo) dbService.logout();
        else dbService.clearAuth();
        set({ user: null, refreshToken: null, isDemo: false, isAuthenticated: false, authError: null });
      },

      // Restore a real backend session at startup using the persisted refresh token.
      restoreSession: async () => {
        if (get().isDemo || !get().refreshToken) return;
        try {
          dbService.setRefreshToken(get().refreshToken);
          const { user } = await dbService.refresh();
          set({ user, refreshToken: dbService.refreshToken, isAuthenticated: true });
        } catch {
          set({ user: null, refreshToken: null, isAuthenticated: false });
        }
      },

      hasRole: (minRole) => {
        const r = get().user?.role;
        return r ? (ROLE_LEVEL[r] || 0) >= (ROLE_LEVEL[minRole] || 99) : false;
      },
    }),
    {
      name: 'dtid-auth',
      partialize: (s) => ({ user: s.user, refreshToken: s.refreshToken, isDemo: s.isDemo }),
      // Restore isAuthenticated from persisted user; hand the refresh token to dbService.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.user) state.isAuthenticated = true;
        if (state.refreshToken) dbService.setRefreshToken(state.refreshToken);
      },
    }
  )
);

// Let dbService push rotated refresh tokens back into the persisted store.
dbService.onTokens = ({ refreshToken }) => {
  useAuthStore.setState({ refreshToken: refreshToken || null });
};

// Database connection state
const DB_MODE = {
  LOCAL: 'local',    // Use local state only (mock data)
  SYNC: 'sync',      // Sync with database
  DB_ONLY: 'db_only' // Database as source of truth
};

// Main Data Store
export const useDataStore = create(
  persist(
    (set, get) => ({
      // Database connection mode
      dbMode: DB_MODE.LOCAL,
      isLoading: false,
      lastError: null,

      // Data — starts empty; hydrated by persist middleware or loadFromDatabase
      persons: EMPTY,
      cases: EMPTY,
      drugSeizures: EMPTY,
      locations: EMPTY,
      personCases: EMPTY,
      personNetwork: EMPTY,
      personContacts: EMPTY,
      personLocations: EMPTY,

      // Province filter — selected province for spatial scoping
      selectedProvince: null,
      setSelectedProvince: (province) => set({ selectedProvince: province }),

      // Set database mode
      setDbMode: (mode) => set({ dbMode: mode }),

      // Helper to get next ID
      getNextPersonId: () => Math.max(...get().persons.map(p => p.PersonID), 0) + 1,
      getNextCaseId: () => Math.max(...get().cases.map(c => c.CaseID), 0) + 1,
      getNextLocationId: () => Math.max(...get().locations.map(l => l.LocationID), 0) + 1,
      getNextSeizureId: () => Math.max(...get().drugSeizures.map(s => s.SeizureID), 0) + 1,
      getNextContactId: () => Math.max(...get().personContacts.map(c => c.ContactID), 0) + 1,
      getNextCasePersonId: () => Math.max(...get().personCases.map(cp => cp.CasePersonID), 0) + 1,
      getNextRelationshipId: () => Math.max(...get().personNetwork.map(r => r.RelationshipID), 0) + 1,

      // ============================================================
      // CRUD - Persons
      // ============================================================
      addPerson: async (person, contacts = []) => {
        const state = get();
        const newPersonId = state.getNextPersonId();
        const newPerson = {
          ...person,
          PersonID: newPersonId,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };

        // Add contacts for this person
        let newContacts = [];
        if (contacts.length > 0) {
          let contactId = state.getNextContactId();
          newContacts = contacts.map(c => ({
            ...c,
            ContactID: contactId++,
            PersonID: newPersonId,
            IsActive: c.IsActive ?? true
          }));
        }

        // Update local state
        set((state) => ({
          persons: [...state.persons, newPerson],
          personContacts: [...state.personContacts, ...newContacts]
        }));

        // Sync with database if enabled
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            const dbPerson = await dbService.createCompletePerson(person, contacts, null);
            // Update with database IDs
            set((state) => ({
              persons: state.persons.map(p => 
                p.PersonID === newPersonId ? { ...p, ...dbPerson } : p
              )
            }));
          } catch (error) {
            console.error('Failed to sync person to database:', error);
            set({ lastError: error.message });
          }
        }

        return newPersonId;
      },

      updatePerson: async (personId, updates) => {
        set((state) => ({
          persons: state.persons.map(p => 
            p.PersonID === personId 
              ? { ...p, ...updates, UpdatedAt: new Date().toISOString() } 
              : p
          )
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.updatePerson(personId, updates);
          } catch (error) {
            console.error('Failed to update person in database:', error);
            set({ lastError: error.message });
          }
        }
      },

      deletePerson: async (personId) => {
        set((state) => ({
          persons: state.persons.filter(p => p.PersonID !== personId),
          personCases: state.personCases.filter(pc => pc.PersonID !== personId),
          personNetwork: state.personNetwork.filter(
            pn => pn.Person1ID !== personId && pn.Person2ID !== personId
          ),
          personContacts: state.personContacts.filter(c => c.PersonID !== personId),
          personLocations: state.personLocations.filter(pl => pl.PersonID !== personId)
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.deletePerson(personId);
          } catch (error) {
            console.error('Failed to delete person from database:', error);
            set({ lastError: error.message });
          }
        }
      },

      // ============================================================
      // CRUD - Person Contacts
      // ============================================================
      addContact: async (personId, contact) => {
        const state = get();
        const newContactId = state.getNextContactId();
        const newContact = {
          ...contact,
          ContactID: newContactId,
          PersonID: personId,
          IsActive: contact.IsActive ?? true
        };

        set((state) => ({
          personContacts: [...state.personContacts, newContact]
        }));

        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.createContact(personId, contact);
          } catch (error) {
            console.error('Failed to sync contact to database:', error);
            set({ lastError: error.message });
          }
        }

        return newContactId;
      },

      updateContact: async (contactId, updates) => {
        set((state) => ({
          personContacts: state.personContacts.map(c =>
            c.ContactID === contactId ? { ...c, ...updates } : c
          )
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.updateContact(contactId, updates);
          } catch (error) {
            console.error('Failed to update contact in database:', error);
            set({ lastError: error.message });
          }
        }
      },

      deleteContact: async (contactId) => {
        set((state) => ({
          personContacts: state.personContacts.filter(c => c.ContactID !== contactId)
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.deleteContact(contactId);
          } catch (error) {
            console.error('Failed to delete contact from database:', error);
            set({ lastError: error.message });
          }
        }
      },

      getContactsForPerson: (personId) => {
        return get().personContacts.filter(c => c.PersonID === personId);
      },

      // ============================================================
      // CRUD - Locations
      // ============================================================
      addLocation: async (location) => {
        const state = get();
        const newLocationId = state.getNextLocationId();
        const newLocation = {
          ...location,
          LocationID: newLocationId,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };

        set((state) => ({
          locations: [...state.locations, newLocation]
        }));

        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            const dbLocation = await dbService.createLocation(location);
            set((state) => ({
              locations: state.locations.map(l =>
                l.LocationID === newLocationId ? { ...l, ...dbLocation } : l
              )
            }));
          } catch (error) {
            console.error('Failed to sync location to database:', error);
            set({ lastError: error.message });
          }
        }

        return newLocationId;
      },

      getLocationById: (id) => get().locations.find(l => l.LocationID === id),

      updateLocation: async (locationId, updates) => {
        set((state) => ({
          locations: state.locations.map(l =>
            l.LocationID === locationId
              ? { ...l, ...updates, UpdatedAt: new Date().toISOString() }
              : l
          )
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.updateLocation(locationId, updates);
          } catch (error) {
            console.error('Failed to update location in database:', error);
            set({ lastError: error.message });
          }
        }
      },

      // ============================================================
      // CRUD - Cases
      // ============================================================
      addCase: async (caseData, involvedPersons = [], seizures = []) => {
        const state = get();
        const newCaseId = state.getNextCaseId();
        const newCase = {
          ...caseData,
          CaseID: newCaseId,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };

        // Create person-case links
        let casePersonId = state.getNextCasePersonId();
        const newPersonCases = involvedPersons.map(p => ({
          CasePersonID: casePersonId++,
          PersonID: p.personId,
          CaseID: newCaseId,
          Role: p.role,
          InvolvementDetails: p.details || null
        }));

        // Create seizures
        let currentSeizureId = state.getNextSeizureId();
        const newSeizures = seizures.map(s => ({
          ...s,
          SeizureID: currentSeizureId++,
          CaseID: newCaseId,
        }));

        set((state) => ({
          cases: [...state.cases, newCase],
          personCases: [...state.personCases, ...newPersonCases],
          drugSeizures: [...state.drugSeizures, ...newSeizures]
        }));

        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            const locationData = caseData.LocationID 
              ? state.locations.find(l => l.LocationID === caseData.LocationID)
              : null;
            await dbService.createCompleteCase(caseData, locationData, involvedPersons, seizures);
          } catch (error) {
            console.error('Failed to sync case to database:', error);
            set({ lastError: error.message });
          }
        }

        return newCaseId;
      },

      updateCase: async (caseId, updates) => {
        set((state) => ({
          cases: state.cases.map(c => 
            c.CaseID === caseId 
              ? { ...c, ...updates, UpdatedAt: new Date().toISOString() } 
              : c
          )
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.updateCase(caseId, updates);
          } catch (error) {
            console.error('Failed to update case in database:', error);
            set({ lastError: error.message });
          }
        }
      },

      deleteCase: async (caseId) => {
        set((state) => ({
          cases: state.cases.filter(c => c.CaseID !== caseId),
          personCases: state.personCases.filter(pc => pc.CaseID !== caseId),
          drugSeizures: state.drugSeizures.filter(s => s.CaseID !== caseId)
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.deleteCase(caseId);
          } catch (error) {
            console.error('Failed to delete case from database:', error);
            set({ lastError: error.message });
          }
        }
      },

      // ============================================================
      // CRUD - Drug Seizures
      // ============================================================
      addSeizure: async (seizure) => {
        const state = get();
        const newSeizureId = state.getNextSeizureId();
        const newSeizure = {
          ...seizure,
          SeizureID: newSeizureId
        };

        set((state) => ({
          drugSeizures: [...state.drugSeizures, newSeizure]
        }));

        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.createSeizure(seizure.CaseID, seizure);
          } catch (error) {
            console.error('Failed to sync seizure to database:', error);
            set({ lastError: error.message });
          }
        }

        return newSeizureId;
      },

      deleteSeizure: async (seizureId) => {
        set((state) => ({
          drugSeizures: state.drugSeizures.filter(s => s.SeizureID !== seizureId)
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.deleteSeizure(seizureId);
          } catch (error) {
            console.error('Failed to delete seizure from database:', error);
            set({ lastError: error.message });
          }
        }
      },

      // ============================================================
      // CRUD - Network Relationships
      // ============================================================
      addNetworkConnection: async (connection) => {
        const state = get();
        const newRelationshipId = state.getNextRelationshipId();
        const newConnection = {
          ...connection,
          RelationshipID: newRelationshipId
        };

        set((state) => ({
          personNetwork: [...state.personNetwork, newConnection]
        }));

        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            await dbService.createRelationship(connection);
          } catch (error) {
            console.error('Failed to sync relationship to database:', error);
            set({ lastError: error.message });
          }
        }

        return newRelationshipId;
      },

      deleteNetworkConnection: async (personAId, personBId) => {
        set((state) => ({
          personNetwork: state.personNetwork.filter(
            pn => !(pn.Person1ID === personAId && pn.Person2ID === personBId)
          )
        }));

        const state = get();
        if (state.dbMode === DB_MODE.SYNC || state.dbMode === DB_MODE.DB_ONLY) {
          try {
            // Find the relationship ID and delete
            const rel = state.personNetwork.find(
              pn => pn.Person1ID === personAId && pn.Person2ID === personBId
            );
            if (rel) {
              await dbService.deleteRelationship(rel.RelationshipID);
            }
          } catch (error) {
            console.error('Failed to delete relationship from database:', error);
            set({ lastError: error.message });
          }
        }
      },

      // ============================================================
      // Helper functions
      // ============================================================
      getPersonById: (id) => get().persons.find(p => p.PersonID === id),
      
      getCaseById: (id) => get().cases.find(c => c.CaseID === id),
      
      getCasesForPerson: (personId) => {
        const caseIds = get().personCases
          .filter(pc => pc.PersonID === personId)
          .map(pc => pc.CaseID);
        return get().cases.filter(c => caseIds.includes(c.CaseID));
      },

      getSeizuresForCase: (caseId) => get().drugSeizures.filter(s => s.CaseID === caseId),

      getPersonsForCase: (caseId) => {
        const personIds = get().personCases.filter(pc => pc.CaseID === caseId);
        return personIds.map(pc => ({
          ...get().getPersonById(pc.PersonID),
          Role: pc.Role,
          InvolvementDetails: pc.InvolvementDetails
        }));
      },

      getNetworkConnections: (personId) => {
        const network = get().personNetwork;
        return {
          subordinates: network.filter(pn => pn.Person1ID === personId),
          superiors: network.filter(pn => pn.Person2ID === personId)
        };
      },

      getCaseLocations: () => {
        const { cases, locations, drugSeizures, personCases, persons } = get();
        return cases.map(c => {
          const location = locations.find(l => l.LocationID === c.LocationID);
          const seizures = drugSeizures.filter(s => s.CaseID === c.CaseID);
          const involvedPersonIds = personCases.filter(pc => pc.CaseID === c.CaseID);
          const involvedPersons = involvedPersonIds.map(pc => ({
            ...persons.find(p => p.PersonID === pc.PersonID),
            Role: pc.Role
          }));
          return {
            ...location,
            case: c,
            seizures,
            involvedPersons
          };
        });
      },

      getPersonLocations: () => {
        const { persons, locations, personCases, cases } = get();
        return persons.map(p => {
          const location = locations.find(l => l.LocationID === p.CurrentAddressID);
          const caseIds = personCases.filter(pc => pc.PersonID === p.PersonID).map(pc => pc.CaseID);
          const personCasesList = cases.filter(c => caseIds.includes(c.CaseID));
          return {
            ...location,
            person: p,
            cases: personCasesList
          };
        });
      },

      getStats: () => {
        const { cases, persons, drugSeizures } = get();
        const activeCases = cases.filter(c => c.Status === 'Under Investigation').length;
        const totalArrests = persons.filter(p => p.Status === 'Arrested').length;
        const totalSuspects = persons.filter(p => p.Status === 'Suspect' || p.Status === 'Active').length;
        
        const drugStats = drugSeizures.reduce((acc, s) => {
          const key = s.DrugType;
          if (!acc[key]) {
            acc[key] = { type: key, totalQuantity: 0, unit: s.Unit, count: 0, totalValue: 0 };
          }
          acc[key].totalQuantity += s.Quantity;
          acc[key].count += 1;
          acc[key].totalValue += s.EstimatedValue || 0;
          return acc;
        }, {});
        
        return {
          activeCases,
          totalArrests,
          totalSuspects,
          totalCases: cases.length,
          drugStats: Object.values(drugStats)
        };
      },

      // ============================================================
      // Database Sync Operations
      // ============================================================
      loadFromDatabase: async () => {
        set({ isLoading: true, lastError: null });
        try {
          const [persons, cases, locations, seizures, relationships] = await Promise.all([
            dbService.getPersons(),
            dbService.getCases(),
            dbService.getLocations(),
            dbService.getSeizuresForCase('all'),
            dbService.getRelationships()
          ]);

          set({
            persons,
            cases,
            locations,
            drugSeizures: seizures,
            personNetwork: relationships,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to load data from database:', error);
          set({ isLoading: false, lastError: error.message });
          throw error;
        }
      },

      /**
       * Refresh all data from the PostgreSQL/PostGIS database.
       * Called after CSV import or any external data change.
       * Maps DB snake_case keys (already camelCased by the API) to store fields.
       */
      refreshFromDatabase: async () => {
        set({ isLoading: true, lastError: null });
        try {
          const data = await dbService.fetchAllData();

          // Map API field names → store field names
          // The API returns camelCase: personId, caseId, etc.
          // The store expects PascalCase: PersonID, CaseID, etc. (from mockData)
          // The camelCase→PascalCase mapping is handled naturally because
          // both the store and API use the same key names now.

          set({
            persons: data.persons || [],
            cases: data.cases || [],
            locations: data.locations || [],
            personNetwork: data.relationships || [],
            personLocations: data.personLocations || [],
            isLoading: false,
            lastError: null
          });
        } catch (error) {
          console.error('Failed to refresh data from database:', error);
          set({ isLoading: false, lastError: error.message });
          throw error;
        }
      },

      syncToDatabase: async () => {
        set({ isLoading: true, lastError: null });
        
        try {
          // This would batch sync all local data to database
          // Implementation depends on your backend API design
          console.log('Syncing data to database...');
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to sync data to database:', error);
          set({ isLoading: false, lastError: error.message });
          throw error;
        }
      },

      // Reset to initial mock data (lazy-loaded on demand)
      resetData: async () => {
        set({ isLoading: true });
        try {
          const mock = await loadMockData();
          set({
            persons: [...mock.persons],
            cases: [...mock.cases],
            drugSeizures: [...mock.drugSeizures],
            locations: [...mock.locations],
            personCases: [...mock.casePersons],
            personNetwork: [...mock.relationships],
            personContacts: [...mock.personContacts],
            personLocations: [...mock.personLocations],
            lastError: null,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to load mock data:', error);
          set({ isLoading: false, lastError: error.message });
        }
      }
    }),
    {
      name: 'dtid-data-store',
      version: 4, // Bumped — Operation Mekong Serpent cross-provincial data added
      migrate: () => ({
        // Discard stale localStorage on version bump — onRehydrateStorage
        // will re-seed from the latest mockData.
        persons: EMPTY, cases: EMPTY, drugSeizures: EMPTY, locations: EMPTY,
        personCases: EMPTY, personNetwork: EMPTY, personContacts: EMPTY,
        personLocations: EMPTY, dbMode: DB_MODE.LOCAL,
      }),
      partialize: (state) => ({
        persons: state.persons,
        cases: state.cases,
        drugSeizures: state.drugSeizures,
        locations: state.locations,
        personCases: state.personCases,
        personNetwork: state.personNetwork,
        personContacts: state.personContacts,
        personLocations: state.personLocations,
        dbMode: state.dbMode
      }),
      // When localStorage is empty (first visit or version bump),
      // automatically seed the store with mock data.
      onRehydrateStorage: () => (state) => {
        if (state && state.persons.length === 0) {
          loadMockData().then(mock => {
            useDataStore.setState({
              persons: [...mock.persons],
              cases: [...mock.cases],
              drugSeizures: [...mock.drugSeizures],
              locations: [...mock.locations],
              personCases: [...mock.casePersons],
              personNetwork: [...mock.relationships],
              personContacts: [...mock.personContacts],
              personLocations: [...mock.personLocations],
            });
          });
        }
      },
    }
  )
);
