import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RISK_COLORS, getRiskConfig } from './riskLevels.js';

describe('riskLevels', () => {
  it('maps each level to a label + colours', () => {
    assert.equal(getRiskConfig('Critical').label, 'CRITICAL');
    assert.equal(getRiskConfig('Critical').colors.raw, RISK_COLORS.Critical.raw);
    assert.equal(getRiskConfig('High').label, 'HIGH');
    assert.equal(getRiskConfig('Medium').label, 'MEDIUM');
    assert.equal(getRiskConfig('Low').label, 'LOW');
  });
  it('falls back to Low for unknown/missing', () => {
    assert.equal(getRiskConfig(undefined).level, 'Low');
    assert.equal(getRiskConfig('bogus').label, 'LOW');
  });
  it('exposes all four risk colours', () => {
    assert.deepEqual(Object.keys(RISK_COLORS).sort(), ['Critical', 'High', 'Low', 'Medium']);
  });
});
