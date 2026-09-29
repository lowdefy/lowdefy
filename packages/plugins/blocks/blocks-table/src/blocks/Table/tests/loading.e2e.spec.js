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

// Loading states (design D17) for Table and TableLight. Requests are answered with page.route,
// held behind a gate until the test releases them, so each state is on screen for as long as the
// test looks at it. The 120 ms show delay and 300 ms minimum run on Playwright's clock.

const PAGE = 'table-loading';
const ROWS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  name: `Person ${i}`,
  amount: i * 10,
  owner: `Owner ${i}`,
  stage: ['lead', 'won'][i % 2],
  active: i % 2 === 0,
  progress: i,
}));

function createGate() {
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

// The client serialises arrays from config as { '~arr': [...] }; the mock only needs them back.
function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value['~arr'])) return revive(value['~arr']);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
}

// A request mock: `hold()` makes the next calls wait until `release()`, `fail` answers with an
// error. `calls` records every payload.
async function mockRequest(page, requestId, respond) {
  const mock = { calls: [], gate: null, fail: () => false };
  mock.hold = () => {
    mock.gate = createGate();
  };
  mock.release = () => {
    const { gate } = mock;
    mock.gate = null;
    gate?.release();
  };
  await page.route(`**/api/request/${PAGE}/${requestId}`, async (route) => {
    const payload = revive(route.request().postDataJSON().payload ?? {});
    mock.calls.push(payload);
    if (mock.gate) await mock.gate.promise;
    if (mock.fail(payload)) {
      await route.fulfill({ status: 500, json: { name: 'Error', message: 'Service down' } });
      return;
    }
    await route.fulfill({ json: { id: requestId, success: true, response: respond(payload) } });
  });
  return mock;
}

function serverRows({ startRow, endRow, view, groupPath }) {
  const group = view.group ?? [];
  if (group.length > (groupPath ?? []).length) {
    return {
      rows: [],
      groups: [
        { key: 'lead', count: 500 },
        { key: 'won', count: 500 },
      ],
      total: 2,
    };
  }
  const rows = [];
  for (let i = startRow; i < Math.min(endRow, 1000); i++) {
    rows.push({ id: i, name: `Server ${i}`, stage: ['lead', 'won'][i % 2] });
  }
  return { rows, total: 1000 };
}

async function mockAll(page) {
  return {
    rows: await mockRequest(page, 'rows', () => ROWS),
    server: await mockRequest(page, 'server_rows', serverRows),
    tree: await mockRequest(page, 'tree_children', ({ rowKey }) => [
      { id: `${rowKey}-1`, parent: rowKey, name: `Child of ${rowKey}` },
    ]),
  };
}

const table = (page, blockId) => page.locator(`#${blockId}`);
const bodyRows = (page, blockId) =>
  getBlock(page, blockId).locator('.lf-table-body [data-row-key]');
const skeletonRows = (page, blockId) => getBlock(page, blockId).locator('[data-skeleton]');
const lightRows = (page, blockId) => getBlock(page, blockId).locator('tbody tr[data-row-key]');

test.describe('Table loading states', () => {
  test('the first load shows the real header over type-shaped skeleton rows', async ({ page }) => {
    const mocks = await mockAll(page);
    mocks.rows.hold();
    await navigateToTestPage(page, PAGE);
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'initial');
    await expect(table(page, 'table_client')).not.toHaveAttribute('data-lf-fallback', '');
    await expect(getBlock(page, 'table_client').locator('[data-lf-header]')).toHaveText([
      '',
      'Name',
      'Amount',
      'Owner',
      'Stage',
      'Active',
      'Progress',
      '',
    ]);
    // 320px scroller, 40px header and rows: 7 rows fill it.
    await expect(skeletonRows(page, 'table_client')).toHaveCount(7);
    const firstRow = skeletonRows(page, 'table_client').first();
    await expect(firstRow.locator('[data-shape="square"]')).toHaveCount(2);
    await expect(firstRow.locator('[data-shape="number"][data-align="end"]')).toHaveCount(1);
    await expect(firstRow.locator('[data-shape="person"] .lf-table-skeleton-circle')).toHaveCount(
      1
    );
    await expect(firstRow.locator('[data-shape="pill"]')).toHaveCount(1);
    await expect(firstRow.locator('[data-shape="progress"]')).toHaveCount(1);
    await expect(firstRow.locator('[data-shape="buttons"] .lf-table-skeleton-square')).toHaveCount(
      2
    );
    // Stable seeded widths: the same row and column keep their width, rows differ.
    const widths = await skeletonRows(page, 'table_client').evaluateAll((rows) =>
      rows.map((row) =>
        row.querySelector('[data-shape="text"]').style.getPropertyValue('--lf-skeleton-w')
      )
    );
    expect(new Set(widths).size).toBeGreaterThan(3);
    await expect(getBlock(page, 'table_client').locator('[role="grid"]')).toHaveAttribute(
      'aria-busy',
      'true'
    );
    await expect(getBlock(page, 'table_client').locator('[data-lf-announcer]')).toHaveText(
      'Loading rows'
    );
    // Controls that need rows wait; search stays usable.
    await expect(
      getBlock(page, 'table_client').locator('[data-lf-toolbar-button="export"]')
    ).toBeDisabled();
    await expect(getBlock(page, 'table_client').locator('[data-lf-select-all]')).toBeDisabled();
    await expect(
      getBlock(page, 'table_client').locator('input[aria-label="Search rows"]')
    ).toBeEnabled();
    await expect(getBlock(page, 'table_client').locator('.lf-table-empty-state')).toHaveCount(0);

    mocks.rows.release();
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'ready');
    await expect(bodyRows(page, 'table_client').first()).toContainText('Person 0');
    await expect(skeletonRows(page, 'table_client')).toHaveCount(0);
    await expect(getBlock(page, 'table_client').locator('[data-lf-announcer]')).toHaveText(
      '30 rows loaded'
    );
    await expect(
      getBlock(page, 'table_client').locator('[data-lf-toolbar-button="export"]')
    ).toBeEnabled();
    await expect(getBlock(page, 'table_client').locator('[role="grid"]')).not.toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  test('a refetch without holdValue keeps the rows and runs the progress bar', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_client').first()).toContainText('Person 0');
    await expect(lightRows(page, 'light_client').first()).toContainText('Person 0');
    // Any empty state or skeleton that appears during the refetch is recorded.
    await page.evaluate(() => {
      window.__flashes = [];
      new MutationObserver(() => {
        if (
          document.querySelector(
            '#table_client .lf-table-empty-state, #table_client [data-skeleton]'
          )
        ) {
          window.__flashes.push('table');
        }
        if (
          document.querySelector(
            '#light_client .ant-table-placeholder, #light_client [data-skeleton]'
          )
        ) {
          window.__flashes.push('light');
        }
      }).observe(document.body, { subtree: true, childList: true, attributes: true });
    });
    mocks.rows.hold();
    await page.locator('#refetch').click();
    await expect(table(page, 'table_client')).toHaveAttribute('data-busy', '');
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'refreshing');
    await expect(
      getBlock(page, 'table_client').locator('.lf-table-header > .lf-table-loading-bar')
    ).toBeVisible();
    // A background refetch never dims.
    await expect(table(page, 'table_client')).not.toHaveAttribute('data-pending', '');
    await expect(bodyRows(page, 'table_client').first()).toContainText('Person 0');
    await expect(getBlock(page, 'light_client').locator('.lf-table-loading-bar')).toBeVisible();
    await expect(table(page, 'light_client')).toHaveAttribute('data-busy', '');
    await expect(lightRows(page, 'light_client').first()).toContainText('Person 0');
    mocks.rows.release();
    await expect(table(page, 'table_client')).not.toHaveAttribute('data-busy', '');
    await expect(getBlock(page, 'light_client').locator('.lf-table-loading-bar')).toHaveCount(0);
    expect(await page.evaluate(() => window.__flashes)).toEqual([]);
  });

  test('a refetch with holdValue shows the same refreshing state', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_client').first()).toContainText('Person 0');
    mocks.rows.hold();
    await page.locator('#refetch_hold').click();
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'refreshing');
    await expect(bodyRows(page, 'table_client')).not.toHaveCount(0);
    mocks.rows.release();
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'ready');
  });

  test('the skeleton shows after 120 ms and stays at least 300 ms, in Table and TableLight', async ({
    page,
  }) => {
    await mockAll(page);
    await page.clock.install();
    await navigateToTestPage(page, PAGE);
    await expect(table(page, 'table_prop')).toHaveAttribute('data-loading-state', 'empty');
    await page.clock.pauseAt(Date.now() + 60000);
    await page.locator('#set_loading').click();
    for (const id of ['table_prop', 'light_prop']) {
      const element = table(page, id);
      await expect(element).toHaveAttribute('data-loading-state', 'initial');
      await expect(element).toHaveAttribute('data-skeleton-hidden', '');
    }
    await page.clock.runFor(110);
    await expect(table(page, 'table_prop')).toHaveAttribute('data-skeleton-hidden', '');
    await page.clock.runFor(20);
    for (const id of ['table_prop', 'light_prop']) {
      await expect(table(page, id)).not.toHaveAttribute('data-skeleton-hidden', '');
      await expect(table(page, id).locator('.lf-table-skeleton').first()).toBeVisible();
    }
    // Rows land 10 ms after the skeleton showed: it stays until it has shown for 300 ms.
    await page.locator('#load_rows').click();
    await page.clock.runFor(200);
    for (const id of ['table_prop', 'light_prop']) {
      await expect(table(page, id)).toHaveAttribute('data-loading-state', 'initial');
    }
    await page.clock.runFor(120);
    await expect(table(page, 'table_prop')).toHaveAttribute('data-loading-state', 'ready');
    await expect(table(page, 'light_prop')).toHaveAttribute('data-loading-state', 'ready');
    await expect(bodyRows(page, 'table_prop')).toHaveText([/Ada/, /Grace/]);
    await expect(lightRows(page, 'light_prop')).toHaveText([/Ada/, /Grace/]);
  });

  test('a fast response never flashes the skeleton', async ({ page }) => {
    await mockAll(page);
    await page.clock.install();
    await navigateToTestPage(page, PAGE);
    await expect(table(page, 'table_prop')).toHaveAttribute('data-loading-state', 'empty');
    await page.clock.pauseAt(Date.now() + 60000);
    await page.locator('#set_loading').click();
    await expect(table(page, 'table_prop')).toHaveAttribute('data-skeleton-hidden', '');
    await page.clock.runFor(100);
    await page.locator('#load_rows').click();
    for (const id of ['table_prop', 'light_prop']) {
      await expect(table(page, id)).toHaveAttribute('data-loading-state', 'ready');
    }
    await expect(bodyRows(page, 'table_prop')).toHaveCount(2);
    await expect(lightRows(page, 'light_prop')).toHaveCount(2);
  });

  test('no rows says "No rows"; a filter that hides every row offers to clear it', async ({
    page,
  }) => {
    await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(getBlock(page, 'table_empty').locator('.lf-table-empty-state')).toContainText(
      'No rows'
    );
    await expect(table(page, 'table_empty')).toHaveAttribute('data-loading-state', 'empty');
    const search = getBlock(page, 'table_filtered').locator('input[aria-label="Search rows"]');
    await search.fill('zzz');
    const empty = getBlock(page, 'table_filtered').locator('[data-lf-empty="filtered"]');
    await expect(empty).toContainText('No matching rows');
    await empty.locator('[data-lf-clear-filters]').click();
    await expect(bodyRows(page, 'table_filtered')).toHaveCount(2);
    await expect(search).toHaveValue('');
  });

  test('the block skeleton config replaces the table while it loads', async ({ page }) => {
    const mocks = await mockAll(page);
    mocks.rows.hold();
    await navigateToTestPage(page, PAGE);
    // The client renders the skeleton block in place of the table's block layout.
    await expect(page.locator('[id^="s-bl-"]').first()).toBeVisible();
    await expect(page.locator('#table_skeleton')).toHaveCount(0);
    mocks.rows.release();
    await expect(page.locator('#table_skeleton')).toBeVisible();
    await expect(page.locator('[id^="s-bl-"]')).toHaveCount(0);
  });
});

test.describe('Table loading states in server mode', () => {
  test('a user sort shows the bar at once and dims the old rows only after 300 ms', async ({
    page,
  }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    mocks.server.hold();
    await getBlock(page, 'table_server').locator('[data-lf-header][data-col-key="name"]').click();
    await expect(table(page, 'table_server')).toHaveAttribute('data-pending', '');
    await expect(
      getBlock(page, 'table_server').locator('.lf-table-header > .lf-table-loading-bar')
    ).toBeVisible();
    const dim = await getBlock(page, 'table_server')
      .locator('.lf-table-body')
      .evaluate((body) =>
        body.getAnimations().map((animation) => ({
          name: animation.animationName,
          delay: animation.effect.getTiming().delay,
        }))
      );
    expect(dim).toContainEqual({ name: 'lf-table-dim', delay: 300 });
    await expect
      .poll(() =>
        getBlock(page, 'table_server')
          .locator('.lf-table-body')
          .evaluate((body) => Number(getComputedStyle(body).opacity))
      )
      .toBeCloseTo(0.6, 1);
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    mocks.server.release();
    await expect(table(page, 'table_server')).not.toHaveAttribute('data-pending', '');
    await expect
      .poll(() =>
        getBlock(page, 'table_server')
          .locator('.lf-table-body')
          .evaluate((body) => Number(getComputedStyle(body).opacity))
      )
      .toBe(1);
  });

  test('a refresh runs the bar and never dims', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    mocks.server.hold();
    await page.locator('#server_refresh').click();
    await expect(table(page, 'table_server')).toHaveAttribute('data-busy', '');
    await expect(table(page, 'table_server')).not.toHaveAttribute('data-pending', '');
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    mocks.server.release();
    await expect(table(page, 'table_server')).not.toHaveAttribute('data-busy', '');
  });

  test('a failed block becomes an error row whose Retry reloads only that block', async ({
    page,
  }) => {
    const mocks = await mockAll(page);
    mocks.server.fail = ({ startRow }) => startRow === 50;
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    await getBlock(page, 'table_server')
      .locator('.lf-table-scroller')
      .evaluate((scroller) => {
        scroller.scrollTop = 40 * 45;
      });
    const errorRow = getBlock(page, 'table_server').locator('[data-lf-error-row]');
    await expect(errorRow).toContainText("Couldn't load rows");
    await expect(getBlock(page, 'table_server').locator('[data-row-key="49"]')).toBeVisible();
    const blockZeroCalls = mocks.server.calls.filter((call) => call.startRow === 0).length;
    mocks.server.fail = () => false;
    await errorRow.locator('[data-lf-retry]').click();
    await expect(getBlock(page, 'table_server').locator('[data-row-key="50"]')).toContainText(
      'Server 50'
    );
    await expect(errorRow).toHaveCount(0);
    expect(mocks.server.calls.filter((call) => call.startRow === 50)).toHaveLength(2);
    expect(mocks.server.calls.filter((call) => call.startRow === 0)).toHaveLength(blockZeroCalls);
  });

  test('a failed first block shows the error row, and Retry loads the rows', async ({ page }) => {
    const mocks = await mockAll(page);
    mocks.server.fail = () => true;
    await navigateToTestPage(page, PAGE);
    const errorRow = getBlock(page, 'table_server').locator('[data-lf-error-row]');
    await expect(errorRow).toContainText("Couldn't load rows");
    await expect(skeletonRows(page, 'table_server')).toHaveCount(0);
    mocks.server.fail = () => false;
    await errorRow.locator('[data-lf-retry]').click();
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
  });

  test('a failed block raises no global error message, and the error is still logged', async ({
    page,
  }) => {
    const logged = [];
    page.on('console', (message) => {
      if (message.type() === 'error') logged.push(message.text());
    });
    const mocks = await mockAll(page);
    mocks.server.fail = () => true;
    await navigateToTestPage(page, PAGE);
    const errorRow = getBlock(page, 'table_server').locator('[data-lf-error-row]');
    await expect(errorRow).toContainText("Couldn't load rows");
    await expect.poll(() => logged.some((text) => text.includes('Service down'))).toBe(true);
    // The table's inline error row with Retry is the UX; the page shows no message over it.
    await expect(page.locator('.ant-message-notice')).toHaveCount(0);
  });

  test('expanding a server group spins its chevron and shows skeleton rows', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await page.locator('#server_group').click();
    const group = getBlock(page, 'table_server').locator('[data-group-key=\'["lead"]\']');
    await expect(group).toBeVisible();
    mocks.server.hold();
    await group.click();
    await expect(group.locator('[data-loading] .lf-table-spinner')).toBeVisible();
    await expect(skeletonRows(page, 'table_server').first()).toBeVisible();
    mocks.server.release();
    await expect(getBlock(page, 'table_server').locator('[data-row-key="0"]')).toContainText(
      'Server 0'
    );
    await expect(group.locator('[data-loading]')).toHaveCount(0);
  });

  test('the export button spins while the app builds the file', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    await expect(bodyRows(page, 'table_server').first()).toContainText('Server 0');
    mocks.rows.hold();
    const button = getBlock(page, 'table_server').locator('[data-lf-toolbar-button="export"]');
    await button.click();
    await expect(button).toHaveClass(/ant-btn-loading/);
    mocks.rows.release();
    await expect(button).not.toHaveClass(/ant-btn-loading/);
  });
});

test.describe('Table lazy loading', () => {
  test('a lazy tree expand spins the chevron and shows a skeleton child', async ({ page }) => {
    const mocks = await mockAll(page);
    await navigateToTestPage(page, PAGE);
    const toggle = getBlock(page, 'table_tree').locator(
      '[data-row-key="region-a"] [data-lf-tree-toggle]'
    );
    mocks.tree.hold();
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-loading', '');
    await expect(toggle.locator('.lf-table-spinner')).toBeVisible();
    await expect(skeletonRows(page, 'table_tree')).toHaveCount(1);
    mocks.tree.release();
    await expect(getBlock(page, 'table_tree').locator('[data-row-key="region-a-1"]')).toContainText(
      'Child of region-a'
    );
    await expect(toggle).not.toHaveAttribute('data-loading', '');
    await expect(skeletonRows(page, 'table_tree')).toHaveCount(0);
  });

  test('a failed lazy tree expand collapses the row and shows the error', async ({ page }) => {
    const mocks = await mockAll(page);
    mocks.tree.fail = () => true;
    await navigateToTestPage(page, PAGE);
    const toggle = getBlock(page, 'table_tree').locator(
      '[data-row-key="region-b"] [data-lf-tree-toggle]'
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-error', '');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.ant-tooltip')).toContainText('Service down');
    await expect(skeletonRows(page, 'table_tree')).toHaveCount(0);
  });

  test('a menu whose code is loading opens at once with a spinner in its frame', async ({
    page,
  }) => {
    await mockAll(page);
    const chunk = createGate();
    await page.route('**/HeaderMenuDropdown-*.js', async (route) => {
      await chunk.promise;
      await route.continue();
    });
    await navigateToTestPage(page, PAGE);
    const header = getBlock(page, 'table_empty').locator('[data-lf-header][data-col-key="name"]');
    await header.hover();
    await header.locator('[data-lf-header-menu]').click();
    await expect(page.locator('[data-lf-popover-loading] .lf-table-spinner')).toBeVisible();
    chunk.release();
    await expect(page.locator('[data-lf-header-menu-popup]')).toBeVisible();
    await expect(page.locator('[data-lf-popover-loading]')).toHaveCount(0);
  });

  test('the fallback is the table: the swap to the loaded table moves nothing', async ({
    page,
  }) => {
    const mocks = await mockAll(page);
    mocks.rows.hold();
    const chunk = createGate();
    await page.route('**/Table.lazy-*.js', async (route) => {
      await chunk.promise;
      await route.continue();
    });
    await navigateToTestPage(page, PAGE);
    const ids = ['table_client', 'table_swap', 'table_empty'];
    for (const id of ids) {
      await expect(table(page, id)).toHaveAttribute('data-lf-fallback', '');
    }
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'initial');
    await expect(skeletonRows(page, 'table_client')).toHaveCount(7);
    // Rows known before the code: as many skeleton rows as there are rows.
    await expect(skeletonRows(page, 'table_swap')).toHaveCount(3);
    // The page's onMount is still running, so every table on it is loading (Lowdefy's signal).
    await expect(table(page, 'table_empty')).toHaveAttribute('data-loading-state', 'initial');

    async function measure() {
      return page.evaluate((blockIds) => {
        const box = (element) => {
          const rect = element.getBoundingClientRect();
          return [rect.x, rect.y, rect.width, rect.height].map(Math.round);
        };
        return Object.fromEntries(
          blockIds.map((id) => {
            const root = document.getElementById(id);
            return [
              id,
              {
                root: box(root),
                scroller: box(root.querySelector('.lf-table-scroller')),
                header: box(root.querySelector('.lf-table-header')),
                headers: [...root.querySelectorAll('[data-lf-header]')].map(box),
              },
            ];
          })
        );
      }, ids);
    }
    const before = await measure();
    chunk.release();
    for (const id of ids) {
      await expect(table(page, id)).not.toHaveAttribute('data-lf-fallback', '');
    }
    await expect(bodyRows(page, 'table_swap')).toHaveCount(3);
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'initial');
    const after = await measure();
    expect(after).toEqual(before);
    mocks.rows.release();
    await expect(table(page, 'table_client')).toHaveAttribute('data-loading-state', 'ready');
    const loaded = await measure();
    expect(loaded.table_client.root).toEqual(before.table_client.root);
  });
});
