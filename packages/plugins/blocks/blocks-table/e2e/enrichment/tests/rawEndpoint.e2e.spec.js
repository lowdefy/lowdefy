/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { test, expect } from '@playwright/test';
import { getBlock } from '@lowdefy/block-dev-e2e';

import { callEndpoint, reset, rowKeys, settle } from './helpers.js';

// The Table's rawEndpoint (pages/enrichment_raw_endpoint.yaml): its rows leave every cell's raw
// result out, and the details panel loads the raw result of the cell it shows from
// leads_cell_raw.
test.describe.configure({ mode: 'serial' });

const table = (page) => getBlock(page, 'leads_table');
const cell = (page, name, key) =>
  table(page)
    .locator('.lf-table-body [data-row-key]')
    .filter({ has: page.locator('[data-col-key="name"]', { hasText: new RegExp(`^${name}$`) }) })
    .locator(`[data-lf-cell][data-col-key="${key}"]`);
const details = (page) => page.locator('[data-lf-cell-details]');
const rawEndpoint = '**/api/endpoints/leads_cell_raw';

// Ada's company cell, run and finished: the provider's raw answer is stored in the row.
test.beforeEach(async ({ request }) => {
  await reset(request);
  const [adaKey] = await rowKeys(request, ['Ada Brightwell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection: [adaKey] });
  await settle(request);
});

async function openDetails(page) {
  await cell(page, 'Ada Brightwell', 'company').click({ position: { x: 150, y: 10 } });
  await expect(details(page)).toHaveAttribute('data-lf-cell-details', 'company');
}

test('the rows carry no raw result, and the details panel loads it from rawEndpoint', async ({
  page,
  request,
}) => {
  const rowsResponse = page.waitForResponse('**/api/request/enrichment_raw_endpoint/leads');
  await page.goto('/enrichment_raw_endpoint');
  const rows = JSON.stringify(await (await rowsResponse).json());
  expect(rows).toContain('Logistics');
  expect(rows).not.toContain('"raw"');
  await expect(cell(page, 'Ada Brightwell', 'company')).toHaveText('Logistics');

  // Hold the call, so the panel shows that it is loading.
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const payloads = [];
  await page.route(rawEndpoint, async (route) => {
    payloads.push(route.request().postDataJSON().payload);
    await held;
    await route.continue();
  });
  await openDetails(page);
  await expect(details(page).locator('[data-lf-details-raw-loading]')).toHaveText(
    'Loading the raw result…'
  );
  release();
  await expect(details(page).locator('[data-lf-json-node="country"]')).toContainText('"NL"');
  await expect(details(page).locator('[data-lf-details-raw-loading]')).toHaveCount(0);
  const [adaKey] = await rowKeys(request, ['Ada Brightwell']);
  expect(payloads).toEqual([{ rowKey: adaKey, key: 'company' }]);
});

test('the details panel says so when the raw result can not be loaded', async ({ page }) => {
  await page.route(rawEndpoint, (route) => route.fulfill({ status: 500, body: 'Server error' }));
  await page.goto('/enrichment_raw_endpoint');
  await expect(cell(page, 'Ada Brightwell', 'company')).toHaveText('Logistics');
  await openDetails(page);
  await expect(details(page).locator('[data-lf-details-raw-error]')).toHaveText(
    'The raw result could not be loaded.'
  );
  // The rest of the panel still shows.
  await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Done');
});

test('a cell that has not run calls no endpoint', async ({ page }) => {
  let calls = 0;
  await page.route(rawEndpoint, async (route) => {
    calls += 1;
    await route.continue();
  });
  await page.goto('/enrichment_raw_endpoint');
  await expect(cell(page, 'Ben Quill', 'domain')).not.toBeEmpty();
  await cell(page, 'Ben Quill', 'company').click({ position: { x: 150, y: 10 } });
  await expect(details(page)).toHaveAttribute('data-lf-cell-details', 'company');
  await expect(details(page)).toContainText('No raw result.');
  expect(calls).toBe(0);
});
