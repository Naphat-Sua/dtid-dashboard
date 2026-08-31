// ============================================================
// Normalize API rows (camelCase, e.g. personId / photoUrl / status) into the
// PascalCase shape the store and components use (PersonID / PhotoURL / Status).
//
// The backend serializes snake_case columns to camelCase (person_id → personId),
// but mockData and every component read PascalCase with ID/URL acronyms. Without
// this layer, DB-mode reads yield `undefined` everywhere (blank map, zero stats).
//
// Strategy: upper-case the first letter, then fix ONLY trailing acronyms
// (`...Id` → `...ID`, `...Url` → `...URL`). Suffix-only matching is deliberate —
// a global/case-insensitive replace would corrupt mid-word matches like
// "evidence" → "evIDence" or "district". The transform is idempotent, so passing
// already-PascalCase data through is harmless.
// ============================================================

export function normalizeKey(key) {
  if (typeof key !== 'string' || key.length === 0) return key;
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  return pascal.replace(/Id$/, 'ID').replace(/Url$/, 'URL');
}

export function normalizeRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeKey(k)] = v;
  }
  return out;
}

export function normalizeRows(rows) {
  return Array.isArray(rows) ? rows.map(normalizeRow) : [];
}

/**
 * Normalize a whole `/api/all`-style payload: every top-level entity array is
 * normalized row-by-row. Non-array values are passed through untouched.
 */
export function normalizeAllData(data) {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  for (const [entity, value] of Object.entries(data)) {
    out[entity] = Array.isArray(value) ? normalizeRows(value) : value;
  }
  return out;
}
