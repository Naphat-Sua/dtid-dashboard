import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { geocode, buildQuery, clearGeocodeCache } from './geocode.js';

const realFetch = global.fetch;

describe('geocode', () => {
  beforeEach(() => {
    clearGeocodeCache();
    process.env.GEOCODER_MIN_INTERVAL_MS = '0'; // no throttle delay in tests
  });
  afterEach(() => { global.fetch = realFetch; });

  it('buildQuery joins address + admin parts + country', () => {
    assert.equal(
      buildQuery('X Rd', { province: 'Nakhon Pathom', district: 'Sam Phran' }),
      'X Rd, Sam Phran, Nakhon Pathom, Thailand'
    );
  });

  it('returns lat/lng and caches (one fetch for repeated query)', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; return { ok: true, json: async () => [{ lat: '13.72', lon: '100.21', display_name: 'x' }] }; };
    const r1 = await geocode('A Rd', { province: 'Nakhon Pathom' });
    assert.equal(r1.latitude, 13.72);
    assert.equal(r1.longitude, 100.21);
    await geocode('A Rd', { province: 'Nakhon Pathom' }); // same query → cache
    assert.equal(calls, 1);
  });

  it('returns null on empty result and on HTTP error (never throws)', async () => {
    global.fetch = async () => ({ ok: true, json: async () => [] });
    assert.equal(await geocode('nowhere at all', {}), null);
    global.fetch = async () => ({ ok: false, status: 403, json: async () => ({}) });
    assert.equal(await geocode('blocked place', {}), null);
  });
});
