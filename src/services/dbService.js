// Database API Service for DTID Dashboard
// This service handles communication with the backend SQL database

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class DatabaseService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.accessToken = null;   // in-memory (never persisted)
    this.refreshToken = null;  // mirrored from the persisted auth store
    this.onTokens = null;      // callback so the store can persist rotated tokens
    this._lastUser = null;
  }

  // ── Token management ──────────────────────────────────────
  setTokens({ accessToken, refreshToken }) {
    if (accessToken !== undefined) this.accessToken = accessToken;
    if (refreshToken !== undefined) this.refreshToken = refreshToken;
    if (typeof this.onTokens === 'function') {
      this.onTokens({ accessToken: this.accessToken, refreshToken: this.refreshToken });
    }
  }
  setRefreshToken(rt) { this.refreshToken = rt || null; }
  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof this.onTokens === 'function') this.onTokens({ accessToken: null, refreshToken: null });
  }

  // Generic fetch wrapper — attaches the Bearer token and transparently
  // refreshes it once on a 401 (the documented Auto Refresh Token behavior).
  async request(endpoint, options = {}, _retried = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    try {
      const response = await fetch(url, { ...options, headers });

      // Access token expired → refresh once, then retry the original request.
      if (response.status === 401 && this.refreshToken && !_retried && !endpoint.startsWith('/auth/')) {
        const ok = await this._doRefresh().catch(() => false);
        if (ok) return this.request(endpoint, options, true);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        const err = new Error(error.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ── Auth operations ───────────────────────────────────────
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data; // { user, accessToken, refreshToken }
  }

  async _doRefresh() {
    if (!this.refreshToken) return false;
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    if (!res.ok) { this.clearAuth(); return false; }
    const data = await res.json();
    this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    this._lastUser = data.user;
    return true;
  }

  async refresh() {
    if (!(await this._doRefresh())) throw new Error('Session expired');
    return { user: this._lastUser };
  }

  async logout() {
    try { await this.request('/auth/logout', { method: 'POST' }); } catch { /* best effort */ }
    this.clearAuth();
  }

  async me() {
    return this.request('/auth/me');
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

  // ============================================================
  // Person-Location Operations
  // ============================================================

  async getPersonLocations() {
    return this.request('/person-locations');
  }

  async createPersonLocation(data) {
    return this.request('/person-locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // CSV Upload
  // ============================================================

  async uploadCsv(file, _retried = false) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/upload/csv`;
    // Attach the Bearer token — /api/upload/csv is Admin-gated. Do NOT set
    // Content-Type; the browser adds the multipart boundary itself.
    const headers = {};
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    const response = await fetch(url, { method: 'POST', body: formData, headers });

    // Access token expired → refresh once and retry (matches request()).
    if (response.status === 401 && this.refreshToken && !_retried) {
      const ok = await this._doRefresh().catch(() => false);
      if (ok) return this.uploadCsv(file, true);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // ============================================================
  // Health Check
  // ============================================================

  async healthCheck() {
    return this.request('/health');
  }

  // ============================================================
  // Fetch all data at once (for store hydration)
  // Uses the aggregate /api/all endpoint — 1 round trip instead of 5
  // ============================================================

  async fetchAllData() {
    return this.request('/all');
  }
}

// Singleton instance
export const dbService = new DatabaseService();

// Export default instance
export default dbService;
