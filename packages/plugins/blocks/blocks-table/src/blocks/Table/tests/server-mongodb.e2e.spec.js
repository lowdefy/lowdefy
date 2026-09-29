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
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

// Server mode end to end against MongoDB through MongoDBTableQuery. Needs a MongoDB the e2e
// server can reach, passed as a Lowdefy secret, for example:
//
//   mongod --dbpath <dir> --port 27189
//   LOWDEFY_SECRET_TABLE_MONGODB_URI=mongodb://127.0.0.1:27189/table_e2e LOWDEFY_E2E_PORT=<port> pnpm e2e
//
// Without the secret the suite is skipped.

test.skip(!process.env.LOWDEFY_SECRET_TABLE_MONGODB_URI, 'Set LOWDEFY_SECRET_TABLE_MONGODB_URI.');
// One collection, seeded once per worker: the tests share it and run in order.
test.describe.configure({ mode: 'serial' });

const TOTAL = 10000;
const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const cell = (page, blockId, rowKey, key) =>
  row(page, blockId, rowKey).locator(`[data-col-key="${key}"]`);
const grid = (page, blockId) => getBlock(page, blockId).locator('[role="grid"]');
const scroller = (page, blockId) => getBlock(page, blockId).locator('.lf-table-scroller');

function trackRequests(page) {
  const requests = [];
  page.on('request', (request) => {
    if (!request.url().includes('/api/request/table-server-mongodb/people_page')) return;
    requests.push(request.postDataJSON());
  });
  return requests;
}

// The tables fetch when the page loads, so the tests after the seed test see the seeded data.
async function open(page) {
  await navigateToTestPage(page, 'table-server-mongodb');
}

test.describe('Table server mode with MongoDBTableQuery', () => {
  test('seeds the collection', async ({ page }) => {
    await navigateToTestPage(page, 'table-server-mongodb');
    await page.locator('#mongo_seed').click();
    await expect(getBlock(page, 'mongo_seeded')).toHaveText('seeded', { timeout: 30000 });
  });

  test('pages through 10k documents while scrolling to the end', async ({ page }) => {
    const requests = trackRequests(page);
    await open(page);
    await expect(cell(page, 'table_mongo', '0', 'name')).toHaveText('Person 00000');
    await expect(grid(page, 'table_mongo')).toHaveAttribute('aria-rowcount', String(TOTAL + 1));
    for (let step = 1; step <= 20; step++) {
      await scroller(page, 'table_mongo').evaluate((element, top) => {
        element.scrollTop = top;
      }, step * 20000);
      await page.waitForTimeout(16);
    }
    await scroller(page, 'table_mongo').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(cell(page, 'table_mongo', String(TOTAL - 1), 'name')).toHaveText('Person 09999');
    const starts = requests
      .filter((body) => body.blockId === 'table_mongo')
      .map((body) => body.payload.startRow);
    expect(starts[0]).toBe(0);
    expect(starts).toContain(9800);
    expect(starts.length).toBeLessThanOrEqual(5);
  });

  test('sorts and filters on the server', async ({ page }) => {
    await open(page);
    await expect(cell(page, 'table_mongo', '0', 'name')).toHaveText('Person 00000');
    const header = getBlock(page, 'table_mongo').locator('[data-lf-header][data-col-key="amount"]');
    await header.click();
    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    const first = getBlock(page, 'table_mongo').locator('.lf-table-body [data-row-key]').first();
    await expect(first.locator('[data-col-key="amount"]')).toHaveText('999');
    await page.locator('#table_mongo_filter').click();
    await expect(grid(page, 'table_mongo')).toHaveAttribute('aria-rowcount', String(TOTAL / 4 + 1));
    await expect(first.locator('[data-col-key="stage"]')).toHaveText('won');
  });

  test('loads groups with counts and aggregates, and a group rows when it opens', async ({
    page,
  }) => {
    await open(page);
    const block = getBlock(page, 'table_mongo_grouped');
    const groups = block.locator('.lf-table-body [data-group-key]');
    await expect(groups).toHaveCount(4);
    await expect(block.locator('[data-group-key=\'["won"]\']')).toContainText('2,500');
    await block.locator('[data-group-key=\'["won"]\']').click();
    await expect(block.locator('.lf-table-body [data-row-key="2"]')).toBeVisible();
    await expect(
      block.locator('.lf-table-body [data-row-key="2"] [data-col-key="stage"]')
    ).toHaveText('won');
  });
});
