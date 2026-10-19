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

// Popups (menu, column filter) render in portals at the end of the body. The header menu popup
// carries data-lf-header-menu-popup and the column filter data-lf-column-filter, both with the
// column's data-col-key.
const grid = (page, blockId) => getBlock(page, blockId).locator('[role="grid"]');
const header = (page, blockId, key) =>
  getBlock(page, blockId).locator(`[data-lf-header][data-col-key="${key}"]`);
const filterPopover = (page, key) => page.locator(`[data-lf-column-filter][data-col-key="${key}"]`);

function rowKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('.lf-table-body [role="row"]')
    .evaluateAll((rows) => rows.map((element) => Number(element.dataset.rowKey)));
}

async function expectRows(page, blockId, keys) {
  await expect(grid(page, blockId)).toHaveAttribute('aria-rowcount', String(keys.length + 1));
  await expect.poll(() => rowKeys(page, blockId)).toEqual(keys);
}

// How many of the 100k generated rows (id 0..99999) pass `test`.
function countRows(test) {
  return Array.from({ length: 100000 }, (_, i) => i).filter(test).length;
}

async function openMenu(page, blockId, key) {
  const cell = header(page, blockId, key);
  await cell.hover();
  await cell.locator('[data-lf-header-menu]').click();
  const menu = page.locator(`[data-lf-header-menu-popup][data-col-key="${key}"]`);
  await expect(menu).toBeVisible();
  return menu;
}

async function openFilter(page, blockId, key) {
  const menu = await openMenu(page, blockId, key);
  await menu.getByRole('menuitem', { name: 'Filter…' }).click();
  const popover = filterPopover(page, key);
  await expect(popover).toBeVisible();
  return popover;
}

// antd Select: open it, then pick the option by its label. A closing dropdown stays in the DOM
// until its animation ends, so wait for none to be open first.
async function choose(page, select, label) {
  const open = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  await expect(open).toHaveCount(0);
  await select.click();
  await open
    .locator('.ant-select-item-option')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .click();
}

test.describe('Table filtering', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'table-filtering');
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
  });

  // ============================================
  // COLUMN FILTERS
  // ============================================

  test('an options filter narrows rows, shows the filter icon and writes view.filter', async ({
    page,
  }) => {
    await expect(header(page, 'filter_table', 'stage')).not.toHaveAttribute('data-filtered', '');
    await expect(
      header(page, 'filter_table', 'stage').locator('[data-lf-filter-indicator]')
    ).toHaveCount(0);
    const popover = await openFilter(page, 'filter_table', 'stage');
    await popover.getByLabel('Search values').fill('wo');
    await expect(popover.locator('.ant-checkbox-wrapper')).toHaveText(['Won']);
    await popover.getByText('Won', { exact: true }).click();
    await expectRows(page, 'filter_table', [1, 5]);
    await expect(header(page, 'filter_table', 'stage')).toHaveAttribute('data-filtered', '');
    await expect(
      header(page, 'filter_table', 'stage').locator('[data-lf-filter-indicator]')
    ).toBeVisible();
    await expect(getBlock(page, 'filter_value')).toHaveText(
      'filter={"and":[{"key":"stage","op":"in","value":["won"]}]} search=null cause=filter'
    );
    await popover.getByLabel('Search values').fill('');
    await popover.getByText('Lead', { exact: true }).click();
    await expectRows(page, 'filter_table', [1, 3, 5, 6]);
  });

  test('a text filter matches case-insensitively with the chosen operator', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'name');
    await popover.getByLabel('Filter text').fill('ACME');
    await expectRows(page, 'filter_table', [1, 5]);
    await choose(page, popover.getByLabel('Operator'), 'ends with');
    await popover.getByLabel('Filter text').fill('trial');
    await expectRows(page, 'filter_table', [6]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      'filter={"and":[{"key":"name","op":"endsWith","value":"trial"}]}'
    );
  });

  test('a number range filter keeps rows between min and max', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'amount');
    await popover.getByRole('spinbutton', { name: 'Minimum' }).fill('300');
    await popover.getByRole('spinbutton', { name: 'Minimum' }).press('Enter');
    await expectRows(page, 'filter_table', [1, 2, 4, 5]);
    await popover.getByRole('spinbutton', { name: 'Maximum' }).fill('900');
    await popover.getByRole('spinbutton', { name: 'Maximum' }).press('Enter');
    await expectRows(page, 'filter_table', [2, 4, 5]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      '{"key":"amount","op":"between","value":[300,900]}'
    );
  });

  test('a relative date filter keeps rows within the last N days', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'created');
    await popover.getByText('Relative', { exact: true }).click();
    await expectRows(page, 'filter_table', [1]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      '{"key":"created","op":"within","value":{"last":7,"unit":"day"}}'
    );
    await popover.getByRole('spinbutton', { name: 'Amount' }).fill('60');
    await popover.getByRole('spinbutton', { name: 'Amount' }).press('Tab');
    await expectRows(page, 'filter_table', [1, 2]);
  });

  test('a date range filter keeps rows between the picked days', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'created');
    const inputs = popover.locator('.ant-picker-input input');
    await inputs.nth(0).fill('2020-01-01');
    await inputs.nth(0).press('Enter');
    await inputs.nth(1).fill('2020-04-01');
    await inputs.nth(1).press('Enter');
    await expectRows(page, 'filter_table', [3, 5]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      '{"key":"created","op":"between","value":["2020-01-01","2020-04-01"]}'
    );
  });

  test('a boolean filter keeps yes or no rows', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'active');
    await popover.getByText('Yes', { exact: true }).click();
    await expectRows(page, 'filter_table', [1, 3, 5]);
    await popover.getByText('No', { exact: true }).click();
    await expectRows(page, 'filter_table', [2, 4, 6]);
    await popover.getByText('Any', { exact: true }).click();
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
    await expect(getBlock(page, 'filter_value')).toHaveText('filter=null search=null cause=filter');
  });

  test('column filters combine with and, and editing one keeps the others', async ({ page }) => {
    let popover = await openFilter(page, 'filter_table', 'stage');
    await popover.getByText('Won', { exact: true }).click();
    await popover.getByText('Lead', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    popover = await openFilter(page, 'filter_table', 'owner');
    await popover.getByLabel('Filter text').fill('dana');
    await expectRows(page, 'filter_table', [1, 3]);
    await page.keyboard.press('Escape');
    // The filter icon opens the column filter again, showing its current state.
    await header(page, 'filter_table', 'stage').locator('[data-lf-filter-indicator]').click();
    popover = filterPopover(page, 'stage');
    await expect(popover.locator('.ant-checkbox-wrapper-checked')).toHaveText(['Lead', 'Won']);
    await popover.getByText('Lead', { exact: true }).click();
    await expectRows(page, 'filter_table', [1]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      'filter={"and":[{"key":"stage","op":"in","value":["won"]},{"key":"owner","op":"contains","value":"dana"}]}'
    );
    await popover
      .locator('.lf-table-overlay-footer')
      .getByRole('button', { name: 'Clear' })
      .click();
    await expectRows(page, 'filter_table', [1, 3]);
    await expect(header(page, 'filter_table', 'stage')).not.toHaveAttribute('data-filtered', '');
    await expect(header(page, 'filter_table', 'owner')).toHaveAttribute('data-filtered', '');
  });

  test('the column menu offers Clear filter while the column is filtered', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'stage');
    await popover.getByText('Won', { exact: true }).click();
    await expectRows(page, 'filter_table', [1, 5]);
    await page.keyboard.press('Escape');
    const menu = await openMenu(page, 'filter_table', 'stage');
    await menu.getByRole('menuitem', { name: 'Clear filter' }).click();
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
  });

  // ============================================
  // FILTER BUILDER
  // ============================================

  test('the filter builder edits nested and/or groups', async ({ page }) => {
    const popover = await openFilter(page, 'filter_table', 'amount');
    await popover.getByRole('button', { name: 'Advanced' }).click();
    const builder = popover.locator('[data-lf-filter-builder]');
    await builder.getByRole('button', { name: '+ Add condition' }).click();
    const first = builder.locator('[data-lf-filter-leaf]').nth(0);
    await choose(page, first.getByLabel('Operator'), 'less than');
    await first.getByRole('spinbutton', { name: 'Value' }).fill('200');
    await first.getByRole('spinbutton', { name: 'Value' }).press('Enter');
    await expectRows(page, 'filter_table', [3]);

    await builder.getByText('Any', { exact: true }).click();
    await builder.getByRole('button', { name: '+ Add group' }).first().click();
    await expect(builder.locator('[data-lf-filter-group]')).toHaveCount(2);
    const nested = builder.locator('[data-lf-filter-group][data-depth="2"]');
    const second = nested.locator('[data-lf-filter-leaf]').nth(0);
    await choose(page, second.getByLabel('Operator'), 'greater than');
    await second.getByRole('spinbutton', { name: 'Value' }).fill('1000');
    await second.getByRole('spinbutton', { name: 'Value' }).press('Enter');
    await expectRows(page, 'filter_table', [1, 3]);
    await expect(getBlock(page, 'filter_value')).toContainText(
      'filter={"and":[{"or":[{"key":"amount","op":"lt","value":200},{"and":[{"key":"amount","op":"gt","value":1000}]}]}]}'
    );
    // Groups nest three levels deep: the third level offers no further group.
    await nested.getByRole('button', { name: '+ Add group' }).click();
    const third = builder.locator('[data-lf-filter-group][data-depth="3"]');
    await expect(third).toHaveCount(1);
    await expect(third.getByRole('button', { name: '+ Add group' })).toHaveCount(0);
    // An incomplete condition (no value yet) filters nothing.
    await expectRows(page, 'filter_table', [1, 3]);
    await nested.getByRole('button', { name: 'Remove group' }).first().click();
    await expectRows(page, 'filter_table', [3]);
    await first.getByRole('button', { name: 'Remove condition' }).click();
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
    await expect(getBlock(page, 'filter_value')).toContainText('filter=null');
  });

  // ============================================
  // VALUE ROUND TRIP AND METHODS
  // ============================================

  test('view.filter set with SetState drives the table and its column filters', async ({
    page,
  }) => {
    await page.locator('#set_filter_state').click();
    await expectRows(page, 'filter_table', [1, 2]);
    await expect(header(page, 'filter_table', 'stage')).toHaveAttribute('data-filtered', '');
    await expect(header(page, 'filter_table', 'amount')).toHaveAttribute('data-filtered', '');
    await expect(header(page, 'filter_table', 'active')).toHaveAttribute('data-filtered', '');
    await expect(header(page, 'filter_table', 'name')).not.toHaveAttribute('data-filtered', '');
    const popover = await openFilter(page, 'filter_table', 'stage');
    await expect(popover.locator('.ant-checkbox-wrapper-checked')).toHaveText(['Won', 'Lost']);
    await popover.getByText('Lost', { exact: true }).click();
    await expectRows(page, 'filter_table', [1]);
    // The mixed `or` group stays when the stage filter is edited.
    await expect(getBlock(page, 'filter_value')).toHaveText(
      'filter={"and":[{"key":"stage","op":"in","value":["won"]},{"or":[{"key":"amount","op":"gte","value":1000},{"key":"active","op":"isFalse"}]}]} search=null cause=filter'
    );
  });

  test('setFilter and clearFilters methods replace and clear the filter', async ({ page }) => {
    await page.locator('#call_set_filter').click();
    await expectRows(page, 'filter_table', [1, 3]);
    await expect(getBlock(page, 'filter_value')).toHaveText(
      'filter={"key":"owner","op":"eq","value":"dana"} search=null cause=filter'
    );
    await page.locator('#call_clear_filters').click();
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
    await expect(getBlock(page, 'filter_value')).toHaveText('filter=null search=null cause=filter');
  });

  test('setSearch matches every word across the visible columns display text', async ({ page }) => {
    await page.locator('#call_set_search').click();
    // "won" is the stage label (display text), "acme" the name.
    await expectRows(page, 'filter_table', [1, 5]);
    await expect(getBlock(page, 'filter_value')).toHaveText(
      'filter=null search="ACME   won" cause=search'
    );
    // Hiding a searched column takes it out of the search.
    const menu = await openMenu(page, 'filter_table', 'stage');
    await menu.getByRole('menuitem', { name: 'Hide column' }).click();
    await expectRows(page, 'filter_table', []);
    await page.locator('#call_clear_search').click();
    await expectRows(page, 'filter_table', [1, 2, 3, 4, 5, 6]);
    await expect(getBlock(page, 'filter_value')).toHaveText('filter=null search=null cause=search');
  });

  test('defaultView filter and search apply on load', async ({ page }) => {
    await expectRows(page, 'filter_default_table', [6]);
    await expect(header(page, 'filter_default_table', 'stage')).toHaveAttribute(
      'data-filtered',
      ''
    );
  });

  // Only `name` declares `searchable`, so "dana" (an owner) matches nothing.
  test('search reads only the searchable columns when any declare it', async ({ page }) => {
    await expectRows(page, 'filter_searchable_table', []);
  });

  test('the header checkbox selects the filtered rows only', async ({ page }) => {
    await expectRows(page, 'filter_select_table', [1, 3]);
    const all = getBlock(page, 'filter_select_table').locator('[data-lf-select-all]');
    await all.click();
    await expect(all).toBeChecked();
    await expect(getBlock(page, 'filter_select_value')).toHaveText('[1,3]');
    await all.click();
    await expect(getBlock(page, 'filter_select_value')).toHaveText('[]');
  });

  // ============================================
  // 100K ROWS
  // ============================================

  async function measure(page, blockId, trigger, expectedRows) {
    await page.evaluate(() => {
      const probe = { longTasks: [], t0: null };
      window.__filterProbe = probe;
      probe.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => probe.longTasks.push(entry.duration));
      });
      probe.observer.observe({ type: 'longtask' });
      document.addEventListener(
        'pointerdown',
        () => {
          probe.t0 = performance.now();
        },
        { capture: true, once: true }
      );
    });
    await trigger.click();
    return page.evaluate(
      ({ blockId, count }) =>
        new Promise((resolve) => {
          const probe = window.__filterProbe;
          function poll() {
            const grid = document.querySelector(`#${blockId} [role="grid"]`);
            if (grid.getAttribute('aria-rowcount') === String(count + 1)) {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  probe.observer.disconnect();
                  resolve({
                    clickToPaintMs: Math.round(performance.now() - probe.t0),
                    longestTaskMs: Math.round(Math.max(0, ...probe.longTasks)),
                  });
                })
              );
              return;
            }
            requestAnimationFrame(poll);
          }
          poll();
        }),
      { blockId, count: expectedRows }
    );
  }

  test('filtering 100k rows stays responsive', async ({ page }) => {
    await expect(grid(page, 'filter_big_table')).toHaveAttribute('aria-rowcount', '100001');
    const expected = countRows((i) => i % 1000 < 10 && i % 3 === 0);
    const result = await measure(
      page,
      'filter_big_table',
      page.locator('#filter_big_set'),
      expected
    );
    process.stdout.write(`filter 100k: ${JSON.stringify(result)}\n`);
    expect(result.clickToPaintMs).toBeLessThan(1000);
    const texts = await getBlock(page, 'filter_big_table')
      .locator('.lf-table-body [role="row"] [data-col-key="team"]')
      .allInnerTexts();
    expect(new Set(texts)).toEqual(new Set(['Red']));
  });

  test('searching 100k rows stays responsive', async ({ page }) => {
    await expect(grid(page, 'filter_big_table')).toHaveAttribute('aria-rowcount', '100001');
    // Every word must appear: "row" is in every name, "9999" in 19 of them.
    const expected = countRows((i) => String(i).includes('9999'));
    const result = await measure(
      page,
      'filter_big_table',
      page.locator('#filter_big_search'),
      expected
    );
    process.stdout.write(`search 100k: ${JSON.stringify(result)}\n`);
    expect(result.clickToPaintMs).toBeLessThan(1500);
  });
});
