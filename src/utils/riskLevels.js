// ============================================================
// Shared risk-level palette + config.
// Kept in utils (rather than imported from the lazy NetworkGraph chunk) so
// eagerly-loaded views like SuspectList don't pull in the D3/Leaflet bundle.
// ============================================================

export const RISK_COLORS = {
  Critical: { bg: 'var(--accent-purple)', raw: '#BF5AF2', ring: 'rgba(191,90,242,0.3)' },
  High:     { bg: 'var(--accent-red)',    raw: '#FF453A', ring: 'rgba(255,69,58,0.3)' },
  Medium:   { bg: 'var(--accent-orange)', raw: '#FF9F0A', ring: 'rgba(255,159,10,0.3)' },
  Low:      { bg: 'var(--accent-green)',  raw: '#30D158', ring: 'rgba(48,209,88,0.3)' },
};

const RISK_LABELS = { Critical: 'CRITICAL', High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW' };

/**
 * Map a person's RiskLevel to a display config.
 * Falls back to 'Low' (the DB default) for any missing/unknown value.
 */
export const getRiskConfig = (riskLevel) => {
  const level = RISK_LABELS[riskLevel] ? riskLevel : 'Low';
  return { level, label: RISK_LABELS[level], colors: RISK_COLORS[level] };
};
