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

import openTablePage from '../../../../e2e/openTablePage.js';

// Server mode against a mocked request endpoint: page.route answers the table's requests from a
// synthetic 100k row dataset in the test process, so the tests count requests, delay responses
// and answer them out of order. The server contract is MongoDBTableQuery's: the payload is
// { startRow, endRow, view, groupPath, selected } and the response { rows, total, groups?,
// aggregates? }.

const TOTAL = 100000;
const STAGES = ['lead', 'qualified', 'won', 'lost'];
const DATASET = Array.from({ length: TOTAL }, (_, i) => ({
  id: i,
  name: `Person ${String(i).padStart(5, '0')}`,
  stage: STAGES[i % STAGES.length],
  amount: (i * 7919) % 1000,
}));

function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function query({ startRow, endRow, view, groupPath }) {
  let rows = DATASET;
  const { filter } = view;
  if (filter?.key) rows = rows.filter((row) => row[filter.key] === filter.value);
  const group = view.group ?? [];
  group.slice(0, groupPath.length).forEach((entry, level) => {
    rows = rows.filter((row) => row[entry.key] === groupPath[level]);
  });
  const aggregates = {};
  Object.keys(view.aggregates ?? {}).forEach((key) => {
    aggregates[key] = rows.reduce((sum, row) => sum + row[key], 0);
  });
  if (groupPath.length < group.length) {
    const key = group[groupPath.length].key;
    const byValue = new Map();
    rows.forEach((row) => {
      const entry = byValue.get(row[key]) ?? { key: row[key], count: 0, aggregates: { amount: 0 } };
      entry.count += 1;
      entry.aggregates.amount += row.amount;
      byValue.set(row[key], entry);
    });
    const groups = [...byValue.values()].sort((a, b) => compare(a.key, b.key));
    return { rows: [], groups: groups.slice(startRow, endRow), total: groups.length, aggregates };
  }
  const sort = view.sort ?? [];
  if (sort.length) {
    rows = [...rows].sort((a, b) => {
      for (const { key, desc } of sort) {
        const order = compare(a[key], b[key]);
        if (order !== 0) return desc ? -order : order;
      }
      return a.id - b.id;
    });
  }
  return { rows: rows.slice(startRow, endRow), total: rows.length, aggregates };
}

// The client serialises the payload with Lowdefy's serializer: arrays from config arrive as
// { '~arr': [...] } and objects carry their config key ('~k'). The API deserialises them; the
// mock only needs the arrays back.
function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value['~arr'])) return revive(value['~arr']);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
}

// Every request the page makes, with a per-request delay chosen by `delayFor(payload)`.
async function mockServer(page, { delayFor = () => 20 } = {}) {
  const requests = [];
  await page.route('**/api/request/table-server/table_rows', async (route) => {
    const body = route.request().postDataJSON();
    const payload = revive(body.payload);
    const entry = { blockId: body.blockId, payload };
    requests.push(entry);
    await new Promise((resolve) => setTimeout(resolve, delayFor(payload)));
    entry.answered = true;
    await route.fulfill({
      json: { id: 'table_rows', success: true, type: 'TestLog', response: query(payload) },
    });
  });
  return {
    requests,
    for: (blockId) => requests.filter((entry) => entry.blockId === blockId),
  };
}

// Button blocks render the button inside a full-width column; click the button itself.
const clickButton = (page, blockId) => page.locator(`#${blockId}`).click();
const grid = (page, blockId) => getBlock(page, blockId).locator('[role="grid"]');
const scroller = (page, blockId) => getBlock(page, blockId).locator('.lf-table-scroller');
const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const cell = (page, blockId, rowKey, key) =>
  row(page, blockId, rowKey).locator(`[data-col-key="${key}"]`);

function firstRowKeys(page, blockId, count) {
  return getBlock(page, blockId)
    .locator('.lf-table-body [data-row-key]')
    .evaluateAll((rows, n) => rows.slice(0, n).map((element) => element.dataset.rowKey), count);
}

async function scrollTo(page, blockId, top) {
  await scroller(page, blockId).evaluate((element, value) => {
    element.scrollTop = value;
  }, top);
}

test.describe('Table server mode', () => {
  test('loads the first block and sizes the grid from the total', async ({ page }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await expect(grid(page, 'table_server')).toHaveAttribute('aria-rowcount', String(TOTAL + 1));
    const [first] = server.for('table_server');
    // The engine marks config objects with their config key (~k); the request ignores it.
    const { '~k': configKey, ...payload } = first.payload;
    expect(payload).toEqual({
      startRow: 0,
      endRow: 100,
      view: { sort: [], filter: null, search: null, group: [], aggregates: {} },
      groupPath: [],
      selected: [],
    });
    const height = await getBlock(page, 'table_server')
      .locator('.lf-table-body')
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBe(TOTAL * 40);
  });

  test('scrolling to the end of 100k rows loads only the blocks it stops on', async ({ page }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    // A fast scroll through the whole table: many range changes, far apart, one per frame. The
    // steps run in the page: a round trip per step can take longer than the 120 ms settle time
    // on a loaded machine, and a range that stays that long loads its blocks, as it should.
    await scroller(page, 'table_server').evaluate(async (element) => {
      for (let step = 1; step <= 40; step++) {
        element.scrollTop = step * 100000;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    });
    await scrollTo(page, 'table_server', TOTAL * 40);
    await expect(cell(page, 'table_server', String(TOTAL - 1), 'name')).toHaveText('Person 99999');
    await page.waitForTimeout(300);
    const starts = server.for('table_server').map((entry) => entry.payload.startRow);
    // The first block, then only the blocks under the final position.
    expect(starts[0]).toBe(0);
    expect(starts).toContain(99900);
    expect(starts.length).toBeLessThanOrEqual(5);
  });

  test('onRowClick reports the absolute index of a row in a later block', async ({ page }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await scrollTo(page, 'table_server', 50000 * 40);
    await expect(cell(page, 'table_server', '50002', 'name')).toHaveText('Person 50002');
    await cell(page, 'table_server', '50002', 'name').click();
    await expect(getBlock(page, 'server_click_value')).toHaveText(
      'click={"rowKey":50002,"index":50002}'
    );
  });

  test('shows skeleton rows while a block loads', async ({ page }) => {
    await mockServer(page, { delayFor: (payload) => (payload.startRow === 0 ? 20 : 1000) });
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await scrollTo(page, 'table_server', 5000 * 40);
    const skeletons = getBlock(page, 'table_server').locator('.lf-table-body [data-skeleton]');
    await expect(skeletons.first()).toBeVisible();
    await expect(cell(page, 'table_server', '5000', 'name')).toHaveText('Person 05000');
    await expect(skeletons).toHaveCount(0);
  });

  test('a sort change refetches from the top and keeps the old rows dimmed until it lands', async ({
    page,
  }) => {
    const server = await mockServer(page, {
      delayFor: (payload) => (payload.view.sort.length ? 800 : 20),
    });
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await scrollTo(page, 'table_server', 2000);
    await getBlock(page, 'table_server').locator('[data-lf-header][data-col-key="amount"]').click();
    await expect(page.locator('#table_server')).toHaveAttribute('data-pending', '');
    await expect(row(page, 'table_server', '0')).toBeVisible();
    await expect(scroller(page, 'table_server')).toHaveJSProperty('scrollTop', 0);
    const sorted = server.for('table_server').at(-1);
    expect(sorted.payload.startRow).toBe(0);
    expect(sorted.payload.view.sort).toEqual([{ key: 'amount' }]);
    await expect(page.locator('#table_server')).not.toHaveAttribute('data-pending', '');
    await expect(cell(page, 'table_server', '0', 'amount')).toHaveText('0');
    const keys = await firstRowKeys(page, 'table_server', 3);
    expect(keys).toEqual(
      query({
        startRow: 0,
        endRow: 3,
        view: { sort: [{ key: 'amount' }] },
        groupPath: [],
      }).rows.map((r) => String(r.id))
    );
  });

  test('a filter set through the value refetches from the top with the filter', async ({
    page,
  }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await clickButton(page, 'server_filter');
    await expect(grid(page, 'table_server')).toHaveAttribute(
      'aria-rowcount',
      String(TOTAL / 4 + 1)
    );
    const filtered = server.for('table_server').at(-1);
    expect(filtered.payload.startRow).toBe(0);
    expect(filtered.payload.view.filter).toMatchObject({ key: 'stage', op: 'eq', value: 'won' });
    await expect(cell(page, 'table_server', '2', 'stage')).toHaveText('won');
  });

  test('ignores a stale response that lands after a newer view', async ({ page }) => {
    // Ascending answers slowly, descending at once: the ascending rows land last and must not
    // replace the descending ones.
    await mockServer(page, {
      delayFor: (payload) => {
        const [sort] = payload.view.sort;
        if (!sort) return 20;
        return sort.desc ? 20 : 1500;
      },
    });
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    const header = getBlock(page, 'table_server').locator('[data-lf-header][data-col-key="name"]');
    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await expect(cell(page, 'table_server', '99999', 'name')).toHaveText('Person 99999');
    await page.waitForTimeout(1800);
    const keys = await firstRowKeys(page, 'table_server', 2);
    expect(keys).toEqual(['99999', '99998']);
  });

  test('header checkbox selects every matching row as { all: true, except }', async ({ page }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await getBlock(page, 'table_server').locator('[data-lf-select-all]').click();
    await expect(getBlock(page, 'server_selection_value')).toHaveText(
      'selected={"all":true,"except":[],"filter":null,"search":null} event={"all":true,"except":[],"filter":null,"search":null} rows=100'
    );
    await row(page, 'table_server', '2').locator('[data-lf-select-cell] input').click();
    await expect(getBlock(page, 'server_selection_value')).toHaveText(
      'selected={"all":true,"except":[2],"filter":null,"search":null} event={"all":true,"except":[2],"filter":null,"search":null} rows=99'
    );
    await expect(getBlock(page, 'table_server').locator('[data-lf-select-all]')).toHaveJSProperty(
      'indeterminate',
      true
    );
    // A row loaded later is selected too, and the exception survives its block being reloaded.
    await scrollTo(page, 'table_server', 5000 * 40);
    await expect(row(page, 'table_server', '5000')).toHaveAttribute('aria-selected', 'true');
    await scrollTo(page, 'table_server', 0);
    await expect(row(page, 'table_server', '2')).toHaveAttribute('aria-selected', 'false');
    await getBlock(page, 'table_server').locator('[data-lf-select-all]').click();
    await expect(getBlock(page, 'server_selection_value')).toContainText(
      'selected={"all":true,"except":[],"filter":null,"search":null}'
    );
    await getBlock(page, 'table_server').locator('[data-lf-select-all]').click();
    await expect(getBlock(page, 'server_selection_value')).toContainText('selected=[]');
  });

  test('a filter change ends an all selection', async ({ page }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await getBlock(page, 'table_server').locator('[data-lf-select-all]').click();
    await expect(getBlock(page, 'server_selection_value')).toContainText(
      'selected={"all":true,"except":[],"filter":null,"search":null}'
    );
    await clickButton(page, 'server_filter');
    await expect(cell(page, 'table_server', '2', 'stage')).toHaveText('won');
    await expect(getBlock(page, 'server_selection_value')).toContainText('selected=[]');
    await expect(row(page, 'table_server', '2')).toHaveAttribute('aria-selected', 'false');
  });

  test('the fetch sends the selection', async ({ page }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await row(page, 'table_server', '1').locator('[data-lf-select-cell] input').click();
    await scrollTo(page, 'table_server', 5000 * 40);
    await expect(cell(page, 'table_server', '5000', 'name')).toHaveText('Person 05000');
    expect(server.for('table_server').at(-1).payload.selected).toEqual([1]);
  });

  test('exportCsv fires onExport with the view instead of exporting loaded rows', async ({
    page,
  }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await getBlock(page, 'table_server').locator('[data-lf-header][data-col-key="amount"]').click();
    await expect(cell(page, 'table_server', '0', 'amount')).toHaveText('0');
    await clickButton(page, 'server_export');
    await expect(getBlock(page, 'server_export_value')).toHaveText('export=[{"key":"amount"}]');
  });

  test('refresh refetches the visible rows and keeps them on screen', async ({ page }) => {
    const server = await mockServer(page, { delayFor: () => 400 });
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    const before = server.for('table_server').length;
    await clickButton(page, 'server_refresh');
    await expect(cell(page, 'table_server', '0', 'name')).toHaveText('Person 00000');
    await expect.poll(() => server.for('table_server').length).toBeGreaterThan(before);
    expect(server.for('table_server').at(-1).payload.startRow).toBe(0);
  });

  test('applyTransaction updates a loaded row without a request', async ({ page }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_server', '1', 'name')).toHaveText('Person 00001');
    const before = server.for('table_server').length;
    await clickButton(page, 'server_update');
    await expect(cell(page, 'table_server', '1', 'name')).toHaveText('Updated one');
    await expect(cell(page, 'table_server', '2', 'name')).toHaveText('Person 00002');
    await page.waitForTimeout(200);
    expect(server.for('table_server').length).toBe(before);
  });

  // ============================================
  // GROUPING
  // ============================================

  test('loads groups first and the rows of a group when it opens', async ({ page }) => {
    const server = await mockServer(page);
    await openTablePage(page, 'table-server');
    const block = getBlock(page, 'table_server_grouped');
    const groups = block.locator('.lf-table-body [data-group-key]');
    await expect(groups).toHaveCount(4);
    await expect(groups.first()).toContainText('lead');
    await expect(groups.first()).toContainText('25,000');
    const first = server.for('table_server_grouped')[0];
    expect(first.payload.groupPath).toEqual([]);
    expect(first.payload.view.group).toMatchObject([{ key: 'stage' }]);
    expect(server.for('table_server_grouped')).toHaveLength(1);
    await block.locator('[data-group-key=\'["qualified"]\']').click();
    await expect(block.locator('.lf-table-body [data-row-key="1"]')).toBeVisible();
    const opened = server.for('table_server_grouped').at(-1);
    expect(opened.payload).toMatchObject({ groupPath: ['qualified'], startRow: 0, endRow: 50 });
    await expect(block.locator('.lf-table-body [data-row-key="1"]')).toHaveAttribute(
      'data-row-index',
      '3'
    );
    await block.locator('[data-group-key=\'["qualified"]\']').click();
    await expect(block.locator('.lf-table-body [data-row-key="1"]')).toHaveCount(0);
    // Four groups, the header row and the summary footer with the root list's aggregates.
    await expect(block.locator('[role="grid"]')).toHaveAttribute('aria-rowcount', '6');
  });

  // ============================================
  // CLIENT TRANSACTIONS
  // ============================================

  test('applyTransaction adds, updates and removes client rows by key', async ({ page }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await expect(cell(page, 'table_transactions', '2', 'name')).toHaveText('Two');
    await clickButton(page, 'transactions_apply');
    await expect(cell(page, 'table_transactions', '2', 'name')).toHaveText('Two updated');
    await expect(row(page, 'table_transactions', '3')).toHaveCount(0);
    await expect(cell(page, 'table_transactions', '4', 'name')).toHaveText('Four');
    await expect(cell(page, 'table_transactions', '1', 'name')).toHaveText('One');
  });

  test('onRowClick reports the index in data, and null for a row a transaction added', async ({
    page,
  }) => {
    await mockServer(page);
    await openTablePage(page, 'table-server');
    await clickButton(page, 'transactions_apply');
    await expect(cell(page, 'table_transactions', '4', 'name')).toHaveText('Four');
    await cell(page, 'table_transactions', '4', 'name').click();
    await expect(getBlock(page, 'transactions_click_value')).toHaveText(
      'click={"rowKey":4,"index":null}'
    );
    await cell(page, 'table_transactions', '2', 'name').click();
    await expect(getBlock(page, 'transactions_click_value')).toHaveText(
      'click={"rowKey":2,"index":1}'
    );
  });
});
