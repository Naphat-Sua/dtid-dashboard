import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSeizuresByDrug } from './seizureTotals.js';

test('converts g and kg of the same drug before summing', () => {
  const rows = summarizeSeizuresByDrug([
    { DrugType: 'Crystal Meth', Quantity: 92, Unit: 'kg' },
    { DrugType: 'Crystal Meth', Quantity: 860, Unit: 'g' },
    { DrugType: 'Crystal Meth', Quantity: 35, Unit: 'kg' },
    { DrugType: 'Crystal Meth', Quantity: 1493.5, Unit: 'g' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unit, 'kg');
  assert.ok(Math.abs(rows[0].totalQuantity - 129.3535) < 1e-9);
});

test('small mass totals stay in grams', () => {
  assert.deepEqual(summarizeSeizuresByDrug([{ DrugType: 'Cannabis', Quantity: 500, Unit: 'g' }]), [{ type: 'Cannabis', totalQuantity: 500, unit: 'g' }]);
});

test('numeric strings from the database are added, not concatenated', () => {
  const [row] = summarizeSeizuresByDrug([
    { DrugType: 'Methamphetamine', Quantity: '500000.0000', Unit: 'pills' },
    { DrugType: 'Methamphetamine', Quantity: '200000.0000', Unit: 'pills' },
  ]);
  assert.deepEqual(row, { type: 'Methamphetamine', totalQuantity: 700000, unit: 'pills' });
});

test('counts and masses of one drug are kept apart', () => {
  const rows = summarizeSeizuresByDrug([
    { DrugType: 'Ecstasy', Quantity: 13, Unit: 'pills' },
    { DrugType: 'Ecstasy', Quantity: 2, Unit: 'g' },
  ]);
  assert.deepEqual(rows.map(r => r.unit).sort(), ['g', 'pills']);
});
