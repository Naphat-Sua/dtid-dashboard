// ============================================================
// Build a parameterized SQL UPDATE SET clause from a fixed column allow-list.
//
// Iterating the allow-list (never req.body's own keys) means the column
// identifier can only ever be one of our own constants — this closes both
// mass-assignment (writing e.g. created_at / primary keys) and
// identifier-position SQL injection. Values are still parameterized.
// ============================================================

/**
 * @param {Record<string, any>} body      request body (PascalCase keys)
 * @param {Record<string,string>} colMap  allow-list: request key → snake_case column
 * @param {number} startIdx               first $N placeholder index
 * @returns {{ setClauses: string[], values: any[], nextIdx: number } | null}
 *   null when the body contains none of the allow-listed columns.
 */
export function buildUpdate(body, colMap, startIdx = 1) {
  const setClauses = [];
  const values = [];
  let idx = startIdx;
  if (body && typeof body === 'object') {
    for (const [key, col] of Object.entries(colMap)) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        setClauses.push(`${col} = $${idx}`);
        values.push(body[key]);
        idx++;
      }
    }
  }
  return setClauses.length ? { setClauses, values, nextIdx: idx } : null;
}
