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

import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

// Table renders a root div with id={blockId} (class lf-table) holding one scroller with
// role="grid". Body rows carry data-row-key (the row key) and data-row-index (display order);
// cells carry data-col-key and data-col-index. The body renders rows in display order.
const grid = (page, blockId) => getBlock(page, blockId).locator('[role="grid"]');
const scroller = (page, blockId) => getBlock(page, blockId).locator('.lf-table-scroller');
const bodyRows = (page, blockId) => getBlock(page, blockId).locator('.lf-table-body [role="row"]');
const header = (page, blockId, key) =>
  getBlock(page, blockId).locator(`[data-lf-header][data-col-key="${key}"]`);
const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const cell = (page, blockId, rowKey, key) =>
  row(page, blockId, rowKey).locator(`[data-col-key="${key}"]`);

function columnTexts(page, blockId, key) {
  return getBlock(page, blockId)
    .locator(`.lf-table-body [role="row"] [data-col-key="${key}"]`)
    .allInnerTexts();
}

function headerKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('[data-lf-header]')
    .evaluateAll((cells) => cells.map((element) => element.dataset.colKey));
}

function activeCell(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      row: Number(element.closest('[data-row-index]')?.dataset.rowIndex),
      col: Number(element.dataset.colIndex),
    };
  });
}

async function dragBy(page, locator, dx) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(x + (dx * i) / 10, y);
  }
  await page.mouse.up();
}

test.describe('Table Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table');
    await expect(bodyRows(page, 'table_basic')).toHaveCount(5);
  });

  // ============================================
  // RENDERING
  // ============================================

  test('renders headers, cells and grid roles', async ({ page }) => {
    await expect(header(page, 'table_basic', 'name')).toHaveText('Name');
    await expect(header(page, 'table_basic', 'team')).toHaveText('Team');
    await expect(cell(page, 'table_basic', 1, 'name')).toHaveText('Charlie');
    await expect(cell(page, 'table_basic', 5, 'city')).toHaveText('');
    await expect(grid(page, 'table_basic')).toHaveAttribute('aria-rowcount', '6');
    await expect(grid(page, 'table_basic')).toHaveAttribute('aria-colcount', '4');
    await expect(row(page, 'table_basic', 2)).toHaveAttribute('aria-rowindex', '3');
    await expect(cell(page, 'table_basic', 1, 'age')).toHaveAttribute('data-align', 'end');
    await expect(cell(page, 'table_basic', 1, 'age')).toHaveAttribute('aria-colindex', '3');
  });

  test('renders the empty text without rows', async ({ page }) => {
    await expect(getBlock(page, 'table_empty').locator('.lf-table-empty-state')).toContainText(
      'Nothing here yet'
    );
    await expect(bodyRows(page, 'table_empty')).toHaveCount(0);
  });

  test('renders skeleton rows while loading without data', async ({ page }) => {
    await expect(
      getBlock(page, 'table_loading').locator('.lf-table-skeleton-bar').first()
    ).toBeVisible();
    await expect(grid(page, 'table_loading')).toHaveAttribute('aria-busy', 'true');
  });

  // ============================================
  // SORTING
  // ============================================

  test('header click sorts ascending, descending, then off', async ({ page }) => {
    await header(page, 'table_sort', 'name').click();
    await expect(header(page, 'table_sort', 'name')).toHaveAttribute('aria-sort', 'ascending');
    expect(await columnTexts(page, 'table_sort', 'name')).toEqual([
      'alice',
      'Bob',
      'Charlie',
      'Dana',
      'Eve',
    ]);
    await expect(getBlock(page, 'table_sort_value')).toHaveText('sort=[{"key":"name"}] cause=sort');

    await header(page, 'table_sort', 'name').click();
    await expect(header(page, 'table_sort', 'name')).toHaveAttribute('aria-sort', 'descending');
    expect(await columnTexts(page, 'table_sort', 'name')).toEqual([
      'Eve',
      'Dana',
      'Charlie',
      'Bob',
      'alice',
    ]);
    await expect(getBlock(page, 'table_sort_value')).toHaveText(
      'sort=[{"key":"name","desc":true}] cause=sort'
    );

    await header(page, 'table_sort', 'name').click();
    await expect(header(page, 'table_sort', 'name')).toHaveAttribute('aria-sort', 'none');
    expect(await columnTexts(page, 'table_sort', 'name')).toEqual([
      'Charlie',
      'alice',
      'Bob',
      'Dana',
      'Eve',
    ]);
    await expect(getBlock(page, 'table_sort_value')).toHaveText('sort=[] cause=sort');
  });

  test('shift+click adds a column to a multi-sort', async ({ page }) => {
    await header(page, 'table_sort', 'team').click();
    await header(page, 'table_sort', 'age').click({ modifiers: ['Shift'] });
    await expect(header(page, 'table_sort', 'age')).toHaveAttribute('aria-sort', 'ascending');
    await expect(getBlock(page, 'table_sort_value')).toHaveText(
      'sort=[{"key":"team"},{"key":"age"}] cause=sort'
    );
    expect(await columnTexts(page, 'table_sort', 'name')).toEqual([
      'Bob',
      'Eve',
      'Charlie',
      'alice',
      'Dana',
    ]);
    await expect(header(page, 'table_sort', 'age').locator('.lf-table-sort-order')).toHaveText('2');
  });

  test('defaultView sort applies on load and ties keep data order', async ({ page }) => {
    await expect(header(page, 'table_default_sort', 'age')).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    expect(await columnTexts(page, 'table_default_sort', 'name')).toEqual([
      'Dana',
      'Charlie',
      'alice',
      'Eve',
      'Bob',
    ]);
  });

  // ============================================
  // COLUMNS
  // ============================================

  test('dragging the resize handle widens the column and commits the view', async ({ page }) => {
    const before = await header(page, 'table_columns', 'name').boundingBox();
    const handle = getBlock(page, 'table_columns').locator('[data-lf-resize][data-col-key="name"]');
    await dragBy(page, handle, 80);
    const after = await header(page, 'table_columns', 'name').boundingBox();
    expect(Math.round(after.width - before.width)).toBe(80);
    const bodyCell = await cell(page, 'table_columns', 1, 'name').boundingBox();
    expect(Math.round(bodyCell.width)).toBe(Math.round(after.width));
    await expect(getBlock(page, 'table_columns_value')).toHaveText(
      '[{"key":"name","width":240},{"key":"team"},{"key":"age"},{"key":"city"}]'
    );
    // A resize never sorts.
    await expect(header(page, 'table_columns', 'name')).toHaveAttribute('aria-sort', 'none');
  });

  test('dragging a header reorders columns and commits the view', async ({ page }) => {
    await getBlock(page, 'table_columns').scrollIntoViewIfNeeded();
    const target = await header(page, 'table_columns', 'name').boundingBox();
    const source = await header(page, 'table_columns', 'city').boundingBox();
    await page.mouse.move(source.x + 20, source.y + source.height / 2);
    await page.mouse.down();
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const x = source.x + 20 + ((target.x + 10 - (source.x + 20)) * i) / steps;
      await page.mouse.move(x, source.y + source.height / 2);
    }
    await expect(getBlock(page, 'table_columns').locator('.lf-table-reorder-line')).toHaveCount(1);
    await page.mouse.up();
    await expect
      .poll(() => headerKeys(page, 'table_columns'))
      .toEqual(['city', 'name', 'team', 'age']);
    expect(await cell(page, 'table_columns', 2, 'city').evaluate((el) => el.dataset.colIndex)).toBe(
      '0'
    );
    await expect(getBlock(page, 'table_columns_value')).toHaveText(
      '[{"key":"city"},{"key":"name"},{"key":"team"},{"key":"age"}]'
    );
    await expect(header(page, 'table_columns', 'city')).toHaveAttribute('aria-sort', 'none');
    await expect(getBlock(page, 'table_columns').locator('.lf-table-reorder-ghost')).toHaveCount(0);
  });

  test('pinned columns stay visible while scrolling horizontally', async ({ page }) => {
    await getBlock(page, 'table_pinned').scrollIntoViewIfNeeded();
    const table = await page.locator('#table_pinned').boundingBox();
    const scrollerElement = scroller(page, 'table_pinned');
    await scrollerElement.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await expect
      .poll(() => scrollerElement.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    // The last centre column scrolled in next to the end-pinned column; the first scrolled out
    // (and, with column virtualisation, out of the DOM).
    await expect(cell(page, 'table_pinned', 1, 'c7')).toBeVisible();
    const start = await cell(page, 'table_pinned', 1, 'id').boundingBox();
    const end = await cell(page, 'table_pinned', 1, 'action').boundingBox();
    const last = await cell(page, 'table_pinned', 1, 'c7').boundingBox();
    expect(Math.abs(start.x - table.x)).toBeLessThan(3);
    expect(end.x + end.width).toBeLessThanOrEqual(table.x + table.width + 1);
    expect(end.x + end.width).toBeGreaterThan(table.x + table.width - 30);
    expect(Math.abs(last.x + last.width - end.x)).toBeLessThan(2);
    // 1,290 px of columns in a 600 px table: column virtualisation is on, so the first centre
    // column left the DOM once it scrolled out.
    await expect(cell(page, 'table_pinned', 1, 'c1')).toHaveCount(0);
    await expect(cell(page, 'table_pinned', 1, 'id')).toHaveAttribute('data-pinned', 'start');
    await expect(cell(page, 'table_pinned', 1, 'action')).toHaveAttribute('data-pinned', 'end');
  });

  // ============================================
  // VIRTUALISATION
  // ============================================

  test('100k rows render a bounded number of DOM rows', async ({ page }) => {
    await expect(grid(page, 'table_virtual')).toHaveAttribute('aria-rowcount', '100001');
    const count = await bodyRows(page, 'table_virtual').count();
    expect(count).toBeGreaterThan(5);
    expect(count).toBeLessThan(40);
  });

  test('scrolling to the bottom shows the last row', async ({ page }) => {
    await getBlock(page, 'table_virtual').scrollIntoViewIfNeeded();
    await scroller(page, 'table_virtual').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(cell(page, 'table_virtual', 99999, 'name')).toHaveText('Row 99999');
    await expect(cell(page, 'table_virtual', 99999, 'name')).toBeInViewport();
    expect(await bodyRows(page, 'table_virtual').count()).toBeLessThan(40);
  });

  test('scrollToRow brings a row into view', async ({ page }) => {
    await getBlock(page, 'table_virtual').scrollIntoViewIfNeeded();
    await page.locator('#scroll_to_row').click();
    await getBlock(page, 'table_virtual').scrollIntoViewIfNeeded();
    await expect(cell(page, 'table_virtual', 90000, 'name')).toHaveText('Row 90000');
    await expect(cell(page, 'table_virtual', 90000, 'name')).toBeInViewport();
  });

  // ============================================
  // SELECTION
  // ============================================

  test('row checkbox selects the row without a row click', async ({ page }) => {
    await row(page, 'table_selection', 2).locator('[data-lf-select-cell] input').click();
    await expect(row(page, 'table_selection', 2)).toHaveAttribute('aria-selected', 'true');
    await expect(getBlock(page, 'table_selection_value')).toHaveText(
      'selected=[2] rows=1 rowClick=false'
    );
    await row(page, 'table_selection', 4).locator('[data-lf-select-cell] input').click();
    await expect(getBlock(page, 'table_selection_value')).toHaveText(
      'selected=[2,4] rows=2 rowClick=false'
    );
    await row(page, 'table_selection', 2).locator('[data-lf-select-cell] input').click();
    await expect(getBlock(page, 'table_selection_value')).toHaveText(
      'selected=[4] rows=1 rowClick=false'
    );
  });

  test('header checkbox selects every row, then clears them', async ({ page }) => {
    const all = getBlock(page, 'table_selection').locator('[data-lf-select-all]');
    await all.click();
    await expect(getBlock(page, 'table_selection_value')).toHaveText(
      'selected=[1,2,3,4,5] rows=5 rowClick=false'
    );
    await expect(all).toBeChecked();
    await all.click();
    await expect(getBlock(page, 'table_selection_value')).toHaveText(
      'selected=[] rows=0 rowClick=false'
    );
  });

  test('header checkbox is indeterminate for a partial selection', async ({ page }) => {
    await row(page, 'table_selection', 3).locator('[data-lf-select-cell] input').click();
    const all = getBlock(page, 'table_selection').locator('[data-lf-select-all]');
    await expect.poll(() => all.evaluate((element) => element.indeterminate)).toBe(true);
  });

  test('clearSelection and SetState drive the selection from outside', async ({ page }) => {
    await page.locator('#selection_set').click();
    await expect(row(page, 'table_selection', 4)).toHaveAttribute('aria-selected', 'true');
    await expect(row(page, 'table_selection', 4).locator('input')).toBeChecked();
    await expect(getBlock(page, 'table_selection_value')).toContainText('selected=[4]');
    await page.locator('#selection_clear').click();
    await expect(row(page, 'table_selection', 4)).toHaveAttribute('aria-selected', 'false');
    await expect(getBlock(page, 'table_selection_value')).toContainText('selected=[]');
  });

  test('radio selection keeps one row', async ({ page }) => {
    await row(page, 'table_radio', 1).locator('[data-lf-select-cell] input').click();
    await row(page, 'table_radio', 3).locator('[data-lf-select-cell] input').click();
    await expect(getBlock(page, 'table_radio_value')).toHaveText('[3]');
    await expect(row(page, 'table_radio', 1)).toHaveAttribute('aria-selected', 'false');
    await expect(getBlock(page, 'table_radio').locator('[data-lf-select-all]')).toHaveCount(0);
  });

  // ============================================
  // EVENTS
  // ============================================

  test('a cell click fires onCellClick and onRowClick with the row payload', async ({ page }) => {
    await cell(page, 'table_events', 3, 'team').click();
    const bob = '{"id":3,"name":"Bob","team":"Blue","age":25,"city":"Austin"}';
    await expect(getBlock(page, 'table_events_value')).toHaveText(
      `row={"row":${bob},"rowKey":3,"index":2} cell={"row":${bob},"rowKey":3,"column":{"key":"team","field":"team"},"value":"Blue"} double=null`
    );
  });

  test('a double click fires onRowDoubleClick', async ({ page }) => {
    await cell(page, 'table_events', 2, 'age').dblclick();
    await expect(getBlock(page, 'table_events_value')).toContainText(
      'double={"row":{"id":2,"name":"alice","team":"Red","age":30,"city":"Berlin"},"rowKey":2,"index":1}'
    );
  });

  // ============================================
  // ROW LINK
  // ============================================

  test('a row click follows rowLink', async ({ page }) => {
    await cell(page, 'table_link', 3, 'name').click();
    await expect(page).toHaveURL(/\/table-link-target\?id=3$/);
    await expect(getBlock(page, 'link_target_id')).toHaveText('Target id: 3');
  });

  test('a modified click opens rowLink in a new tab', async ({ page, context }) => {
    const popupPromise = context.waitForEvent('page');
    await cell(page, 'table_link', 4, 'name').click({ modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(popup.url()).toMatch(/\/table-link-target\?id=4$/);
    await expect(page).toHaveURL(/\/table$/);
  });

  test('selecting text by drag never follows rowLink', async ({ page }) => {
    await cell(page, 'table_link', 1, 'city').scrollIntoViewIfNeeded();
    const box = await cell(page, 'table_link', 1, 'city').boundingBox();
    await page.mouse.move(box.x + 6, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.getSelection().toString().length)).toBeGreaterThan(0);
    // Still on the page: a later event on this page lands (a navigation would have replaced it).
    await cell(page, 'table_events', 2, 'name').click();
    await expect(getBlock(page, 'table_events_value')).toContainText('"rowKey":2');
    await expect(page).toHaveURL(/\/table$/);
  });

  // ============================================
  // KEYBOARD
  // ============================================

  test('arrow keys, Home, End and Ctrl+End move the active cell', async ({ page }) => {
    await cell(page, 'table_keyboard', 1, 'name').click();
    expect(await activeCell(page)).toEqual({ row: 0, col: 1 });
    await expect(cell(page, 'table_keyboard', 1, 'name')).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowDown');
    expect(await activeCell(page)).toEqual({ row: 1, col: 1 });
    await page.keyboard.press('ArrowRight');
    expect(await activeCell(page)).toEqual({ row: 1, col: 2 });
    await page.keyboard.press('End');
    expect(await activeCell(page)).toEqual({ row: 1, col: 4 });
    await page.keyboard.press('Home');
    expect(await activeCell(page)).toEqual({ row: 1, col: 0 });
    await page.keyboard.press('Control+End');
    expect(await activeCell(page)).toEqual({ row: 4, col: 4 });
    await page.keyboard.press('Control+Home');
    expect(await activeCell(page)).toEqual({ row: 0, col: 0 });
    // Only the active cell is tabbable.
    expect(
      await getBlock(page, 'table_keyboard').locator('[data-lf-cell][tabindex="0"]').count()
    ).toBe(1);
  });

  test('Space toggles the focused row selection', async ({ page }) => {
    await cell(page, 'table_keyboard', 3, 'team').click();
    await page.keyboard.press('Space');
    await expect(getBlock(page, 'table_keyboard_value')).toContainText('selected=[3]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(getBlock(page, 'table_keyboard_value')).toContainText('selected=[3,4]');
    await page.keyboard.press('Space');
    await expect(getBlock(page, 'table_keyboard_value')).toContainText('selected=[3]');
  });

  test('ArrowUp reaches the header and Enter sorts', async ({ page }) => {
    await cell(page, 'table_keyboard', 1, 'age').click();
    await page.keyboard.press('ArrowUp');
    expect(await activeCell(page)).toEqual({ row: -1, col: 3 });
    await page.keyboard.press('Enter');
    await expect(getBlock(page, 'table_keyboard_value')).toContainText('sort=[{"key":"age"}]');
    await expect(header(page, 'table_keyboard', 'age')).toHaveAttribute('aria-sort', 'ascending');
  });

  test('Ctrl/Cmd+C copies the focused cell', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await cell(page, 'table_keyboard', 4, 'city').click();
    await page.keyboard.press('ControlOrMeta+c');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Durban');
  });

  // ============================================
  // METHODS
  // ============================================

  test('exportCsv downloads the current view', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export_csv').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('people.csv');
    const content = fs.readFileSync(await download.path(), 'utf8').replace(/^\ufeff/, '');
    expect(content.split('\r\n')).toEqual([
      'Name,Team,Age,City',
      'alice,Red,30,Berlin',
      'Bob,Blue,25,Austin',
      'Charlie,Blue,35,Cape Town',
      'Dana,Red,41,Durban',
      'Eve,Blue,30,',
    ]);
  });
});
