// ============================================================
// End-to-end checks of the website demo mode (LOCAL data, no backend).
//
//   BASE_URL=http://localhost:4173 node --test e2e/demo.e2e.mjs          (after `npm run build && npm run preview`)
//   BASE_URL=https://<your-app>.vercel.app node --test e2e/demo.e2e.mjs  (deployed site)
//
// Needs the `playwright` package and a Chromium build (`npx playwright install chromium`).
// Not picked up by `npm test`: the file name does not match node --test's default patterns.
// Expected values come from the 220-case demo dataset (server/demo-data/README.md).
// ============================================================

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

/** Fresh context per test; map tiles are blocked so tests do not depend on OSM. */
async function openPage(initState) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  if (initState) {
    await context.addInitScript((s) => {
      if (!sessionStorage.getItem('e2e-seeded')) {
        localStorage.setItem('dtid-data-store', s);
        sessionStorage.setItem('e2e-seeded', '1');
      }
    }, initState);
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  return { page, context, errors };
}

const demoLogin = async (page, label) => {
  await page.locator('button', { hasText: label }).first().click();
  await page.getByText(/of \d+ total/).first().waitFor({ timeout: 20000 });
};
const bodyText = (page) => page.locator('body').innerText();
const clickButton = async (page, text, wait = 2500) => {
  await page.locator('button', { hasText: text }).first().click();
  await page.waitForTimeout(wait);
};
const storeCounts = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dtid-data-store')).state;
  return [s.cases.length, s.persons.length, s.drugSeizures.length, s.personNetwork.length];
});

test('login page offers the three demo roles', async () => {
  const { page, context, errors } = await openPage();
  for (const label of ['ผู้ดูแลระบบ', 'นักวิเคราะห์', 'ผู้บังคับบัญชา']) {
    assert.equal(await page.locator('button', { hasText: label }).count() > 0, true, label);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test('analyst demo: dashboard stats reflect the 220-case dataset', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'นักวิเคราะห์');
  assert.deepEqual(await storeCounts(page), [220, 121, 236, 80]);
  const text = await bodyText(page);
  assert.match(text, /of 220 total/);
  assert.match(text, /ACTIVE CASES\s*156/i);
  assert.match(text, /SEIZURES\s*236/i);
  assert.match(text, /Methamphetamine/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('analyst demo: KDE, Gi*, Moran\'s I and corridors match the recorded results', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'นักวิเคราะห์');
  await clickButton(page, 'KDE Surface', 4000);
  let text = await bodyText(page);
  assert.match(text, /Bandwidth:\s*1\.1\d km/, 'KDE bandwidth ≈ 1.125 km');
  assert.match(text, /Grid:\s*111×111/);
  assert.match(text, /Max density:\s*40\.04/);

  await clickButton(page, 'Gi* Hotspot', 4000);
  text = await bodyText(page);
  assert.match(text, /Points:\s*201/);
  assert.match(text, /Dist\. threshold:\s*1\.43 km/);
  assert.match(text, /Moran's I[\s\S]*CLUSTERED[\s\S]*0\.157/i);
  // Hotspot tiles read 99% / 95% / 90% counts in order.
  assert.match(text, /Hotspots\s*14\s*99%\s*23\s*95%\s*7\s*90%/);

  await clickButton(page, 'Base Map');
  await clickButton(page, 'Corridors', 4000);
  assert.match(await bodyText(page), /Corridors\)\s*21/, '21 corridor segments');
  assert.deepEqual(errors, []);
  await context.close();
});

test('analyst demo: network view shows 121 nodes and the expected key persons', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'นักวิเคราะห์');
  await clickButton(page, 'Network', 6000);
  const text = await bodyText(page);
  assert.match(text, /Nodes\s*121/);
  assert.match(text, /Edges\s*80/);
  const key = text.split(/KEY PERSONS/i)[1] || '';
  assert.match(key, /#1\s*พี่ต้น\s*31/);
  assert.match(key, /#2\s*เฮียกิจ\s*29/);
  assert.match(key, /#3\s*แม็ก\s*25/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('targets list finds a new and an original person', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'นักวิเคราะห์');
  await clickButton(page, 'Targets', 1500);
  const search = page.getByPlaceholder('Search name, alias, or National ID...');
  await search.fill('เกรียงไกร');
  await page.waitForTimeout(800);
  assert.match(await bodyText(page), /เกรียงไกร/);
  await search.fill('มาลี');
  await page.waitForTimeout(800);
  assert.match(await bodyText(page), /มาลี/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('admin demo: data management lists 220 cases including old and new case numbers', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'ผู้ดูแลระบบ');
  await clickButton(page, 'Admin', 3000);
  let text = await bodyText(page);
  assert.match(text, /121 Persons · 220 Cases · 236 Seizures/);
  await clickButton(page, 'Cases', 2500);
  text = await bodyText(page);
  assert.match(text, /Cases Database \(220\)/);
  assert.match(text, /NCB-CR-2569-1001/);
  assert.match(text, /NCB-CR-2568-0304/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('viewer demo: read-only role has no Network or Admin access', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'ผู้บังคับบัญชา');
  assert.equal(await page.locator('button', { hasText: 'Network' }).count(), 0);
  assert.equal(await page.locator('button', { hasText: /^\s*Admin\s*$/ }).count(), 0);
  assert.match(await bodyText(page), /of 220 total/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('a browser holding the old 36-case cache gets the 220-case data after demo login', async () => {
  const oldState = JSON.stringify({ state: { persons: [{ PersonID: 1 }], cases: Array.from({ length: 36 }, (_, i) => ({ CaseID: i + 1 })), drugSeizures: [], locations: [], personCases: [], personNetwork: [], personContacts: [], personLocations: [] }, version: 4 });
  const { page, context } = await openPage(oldState);
  assert.equal((await storeCounts(page))[0], 36);
  await demoLogin(page, 'นักวิเคราะห์');
  // The stale cache renders first; demo login then loads the mock dataset asynchronously.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('dtid-data-store')).state.cases.length === 220, null, { timeout: 10000 });
  assert.deepEqual(await storeCounts(page), [220, 121, 236, 80]);
  await page.getByText('of 220 total').first().waitFor({ timeout: 5000 });
  await context.close();
});

test('logout returns to the login page', async () => {
  const { page, context, errors } = await openPage();
  await demoLogin(page, 'นักวิเคราะห์');
  await page.locator('button[title="ออกจากระบบ (Logout)"]').click();
  await page.locator('button', { hasText: 'นักวิเคราะห์' }).first().waitFor({ timeout: 10000 });
  assert.deepEqual(errors, []);
  await context.close();
});
