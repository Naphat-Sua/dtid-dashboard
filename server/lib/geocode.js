// ============================================================
// Auto-geocoding via OpenStreetMap Nominatim
// Converts a street address (+ admin parts) into lat/lng before INSERT.
// - In-memory cache (dedupes repeated addresses within a run)
// - Polite throttling (~1 req/s, per Nominatim usage policy)
// Requires outbound HTTPS to the Nominatim host.
// ============================================================

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const USER_AGENT    = process.env.GEOCODER_USER_AGENT || 'DTID-Dashboard/1.0 (research prototype)';
// Read at call time so tests (and runtime config) can adjust without re-import.
const minIntervalMs = () => Number(process.env.GEOCODER_MIN_INTERVAL_MS || 1100);
const geocoderEnabled = () => process.env.GEOCODER_ENABLED !== 'false';

const cache = new Map();
let lastCall = 0;
let queue = Promise.resolve(); // serializes requests so throttling is respected

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Build a single-line query from the address and Thai admin parts. */
export function buildQuery(address, { province, district, subDistrict, country = 'Thailand' } = {}) {
  return [address, subDistrict, district, province, country]
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter(Boolean)
    .join(', ');
}

async function geocodeOnce(q) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  const latitude = parseFloat(data[0].lat);
  const longitude = parseFloat(data[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude, displayName: data[0].display_name };
}

/**
 * Geocode an address. Returns { latitude, longitude, displayName } or null.
 * Never throws — a failed lookup resolves to null so callers can report it
 * per-row without aborting a batch import.
 */
export async function geocode(address, parts = {}) {
  if (!geocoderEnabled()) return null;
  const q = buildQuery(address, parts);
  if (!q || q === 'Thailand') return null;
  if (cache.has(q)) return cache.get(q);

  const run = queue.then(async () => {
    if (cache.has(q)) return cache.get(q); // may have been filled while queued
    const wait = minIntervalMs() - (Date.now() - lastCall);
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    try {
      const result = await geocodeOnce(q);
      cache.set(q, result);
      return result;
    } catch (err) {
      console.warn(`geocode failed for "${q}": ${err.message}`);
      return null;
    }
  });
  queue = run.catch(() => {}); // keep the chain alive on failure
  return run;
}

export function clearGeocodeCache() {
  cache.clear();
}
