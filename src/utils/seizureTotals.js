// ============================================================
// Seizure totals per drug for the stats panel.
// Quantities of one drug can be recorded in different units (e.g. Crystal Meth
// in g and kg), so they are converted to a base unit per dimension before
// summing. Quantity may arrive as a string (PostgreSQL NUMERIC in DB mode).
// ============================================================

const UNITS = {
  mg: { dimension: 'mass', toBase: 0.001 },
  g: { dimension: 'mass', toBase: 1 },
  kg: { dimension: 'mass', toBase: 1000 },
  ml: { dimension: 'volume', toBase: 1 },
  L: { dimension: 'volume', toBase: 1000 },
  pills: { dimension: 'count', toBase: 1 },
};

/** Express a base-unit amount in the unit the panel shows. */
const displayFor = (dimension, base, rawUnit) => {
  if (dimension === 'mass') return base >= 1000 ? { totalQuantity: base / 1000, unit: 'kg' } : { totalQuantity: base, unit: 'g' };
  if (dimension === 'volume') return base >= 1000 ? { totalQuantity: base / 1000, unit: 'L' } : { totalQuantity: base, unit: 'ml' };
  return { totalQuantity: base, unit: rawUnit };
};

/**
 * @param {Array<{DrugType, Quantity, Unit}>} seizures
 * @returns {Array<{type, totalQuantity, unit}>} one row per drug and dimension, largest first
 */
export function summarizeSeizuresByDrug(seizures = []) {
  const groups = new Map();
  for (const s of seizures) {
    const known = UNITS[s.Unit];
    const dimension = known ? known.dimension : `unit:${s.Unit}`;
    const key = `${s.DrugType}|${dimension}`;
    if (!groups.has(key)) groups.set(key, { type: s.DrugType, dimension, rawUnit: s.Unit, base: 0 });
    groups.get(key).base += (Number(s.Quantity) || 0) * (known ? known.toBase : 1);
  }
  return [...groups.values()]
    .map(g => ({ type: g.type, ...displayFor(g.dimension, g.base, g.rawUnit) }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}
