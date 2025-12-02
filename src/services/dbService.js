// Database API Service for DTID Dashboard
// This service handles communication with the backend SQL database

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class DatabaseService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Generic fetch wrapper with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================================
  // PERSON CRUD Operations
  // ============================================================

  async getPersons() {
    return this.request('/persons');
  }

  async getPersonById(id) {
    return this.request(`/persons/${id}`);
  }

  async createPerson(personData) {
    return this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(personData),
    });
  }

  async updatePerson(id, updates) {
    return this.request(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePerson(id) {
    return this.request(`/persons/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // PERSON_CONTACT CRUD Operations
  // ============================================================

  async getContactsForPerson(personId) {
    return this.request(`/persons/${personId}/contacts`);
  }

  async createContact(personId, contactData) {
    return this.request(`/persons/${personId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(contactId, updates) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteContact(contactId) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // LOCATION CRUD Operations
  // ============================================================

  async getLocations() {
    return this.request('/locations');
  }

  async getLocationById(id) {
    return this.request(`/locations/${id}`);
  }

  async createLocation(locationData) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async updateLocation(id, updates) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLocation(id) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // CASE CRUD Operations
  // ============================================================

  async getCases() {
    return this.request('/cases');
  }

  async getCaseById(id) {
    return this.request(`/cases/${id}`);
  }

  async createCase(caseData) {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  async updateCase(id, updates) {
    return this.request(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCase(id) {
    return this.request(`/cases/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // CASE_PERSON (Link Table) Operations
  // ============================================================

  async getPersonsForCase(caseId) {
    return this.request(`/cases/${caseId}/persons`);
  }

  async addPersonToCase(caseId, personId, role, details) {
    return this.request(`/cases/${caseId}/persons`, {
      method: 'POST',
      body: JSON.stringify({ personId, role, involvementDetails: details }),
    });
  }

  async removePersonFromCase(caseId, personId) {
    return this.request(`/cases/${caseId}/persons/${personId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // DRUG_SEIZURE CRUD Operations
  // ============================================================

  async getSeizuresForCase(caseId) {
    return this.request(`/cases/${caseId}/seizures`);
  }

  async createSeizure(caseId, seizureData) {
    return this.request(`/cases/${caseId}/seizures`, {
      method: 'POST',
      body: JSON.stringify(seizureData),
    });
  }

  async updateSeizure(seizureId, updates) {
    return this.request(`/seizures/${seizureId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSeizure(seizureId) {
    return this.request(`/seizures/${seizureId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // PERSON_RELATIONSHIP (Network) Operations
  // ============================================================

  async getRelationships() {
    return this.request('/relationships');
  }

  async createRelationship(relationshipData) {
    return this.request('/relationships', {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    });
  }

  async deleteRelationship(id) {
    return this.request(`/relationships/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // Batch/Composite Operations
  // ============================================================

  // Create a complete case with persons, location, and seizures
  async createCompleteCase(caseData, locationData, involvedPersons, seizures) {
    return this.request('/cases/complete', {
      method: 'POST',
      body: JSON.stringify({
        case: caseData,
        location: locationData,
        involvedPersons,
        seizures,
      }),
    });
  }

  // Create a person with contacts and location
  async createCompletePerson(personData, contacts, locationData) {
    return this.request('/persons/complete', {
      method: 'POST',
      body: JSON.stringify({
        person: personData,
        contacts,
        location: locationData,
      }),
    });
  }

  // ============================================================
  // Analytics/Stats Operations
  // ============================================================

  async getStats() {
    return this.request('/stats');
  }

  async getCrimeHotspots(province = null) {
    const params = province ? `?province=${encodeURIComponent(province)}` : '';
    return this.request(`/analytics/hotspots${params}`);
  }

  async getNetworkGraph(personId, depth = 2) {
    return this.request(`/analytics/network/${personId}?depth=${depth}`);
  }
}

// Singleton instance
export const dbService = new DatabaseService();

// Export default instance
export default dbService;
