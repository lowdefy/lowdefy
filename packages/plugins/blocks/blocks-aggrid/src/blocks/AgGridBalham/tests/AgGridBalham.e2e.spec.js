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

// AgGridBalham renders a div with id={blockId} and class ag-theme-balham,
// containing the AgGridReact component.
const getGrid = (page, blockId) => getBlock(page, blockId).locator('.ag-root-wrapper');
const getHeaderCells = (page, blockId) => getBlock(page, blockId).locator('.ag-header-cell-text');
const getRows = (page, blockId) => getBlock(page, blockId).locator('.ag-row');

test.describe('AgGridBalham Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'aggridbalham');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic grid', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_basic');
    await expect(block).toBeVisible();
    const grid = getGrid(page, 'aggridbalham_basic');
    await expect(grid).toBeVisible();
  });

  test('renders with ag-theme-balham class', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_basic');
    await expect(block.locator('[class*="ag-theme-balham"]')).toBeVisible();
  });

  test('renders column headers', async ({ page }) => {
    const headers = getHeaderCells(page, 'aggridbalham_basic');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Age');
  });

  test('renders row data', async ({ page }) => {
    const rows = getRows(page, 'aggridbalham_basic');
    await expect(rows).toHaveCount(3);
  });

  test('renders cell values', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_basic');
    const firstRowCells = block.locator('.ag-row[row-index="0"] .ag-cell');
    await expect(firstRowCells.nth(0)).toHaveText('Alice');
    await expect(firstRowCells.nth(1)).toHaveText('25');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom height', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_height');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.height).toBeCloseTo(300, -1);
  });

  test('renders with default column definitions', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_default_col_def');
    await expect(block).toBeVisible();
    const headers = getHeaderCells(page, 'aggridbalham_default_col_def');
    await expect(headers).toHaveCount(2);
  });

  test('renders empty grid with no rows', async ({ page }) => {
    const grid = getGrid(page, 'aggridbalham_empty');
    await expect(grid).toBeVisible();
    const overlay = getBlock(page, 'aggridbalham_empty').locator('.ag-overlay-no-rows-center');
    await expect(overlay).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onRowClick event fires when row is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_onrowclick');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'aggridbalham_row_click_display');
    await expect(display).toHaveText('Row: Alice');
  });

  test('onCellClick event fires when cell is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_oncellclick');
    const nameCell = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await nameCell.click();
    const display = getBlock(page, 'aggridbalham_cell_click_display');
    await expect(display).toHaveText('Cell: Bob');
  });

  test('onRowSelected event fires when row is selected', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_onrowselected');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'aggridbalham_row_selected_display');
    await expect(display).toHaveText('Selected: Alice');
  });

  // ============================================
  // SORTING & FILTERING
  // ============================================

  test('columns can be sorted when sortable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_sortable');
    // Click Name header to sort ascending
    const nameHeader = block.locator('.ag-header-cell-text').nth(0);
    await nameHeader.click();

    // Verify sort changed event fired
    const display = getBlock(page, 'aggridbalham_sort_changed_display');
    await expect(display).toHaveText('Sort changed');

    // Verify rows are sorted alphabetically
    const firstRowName = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstRowName).toHaveText('Alice');
  });

  test('columns can be filtered when filter is true', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_filterable');
    // Open filter menu on Name column
    const nameHeader = block.locator('.ag-header-cell').nth(0);
    await nameHeader.hover();
    const menuButton = nameHeader.locator('.ag-header-cell-menu-button');
    await menuButton.click();

    // Wait for filter popup
    const filterPopup = page.locator('.ag-popup .ag-filter');
    await expect(filterPopup).toBeVisible();

    // Type a filter value
    const filterInput = filterPopup.locator('input').first();
    await filterInput.fill('Alice');

    // Verify filter changed event fired
    const display = getBlock(page, 'aggridbalham_filter_changed_display');
    await expect(display).toHaveText('Filter changed');

    // Verify filtered results
    const rows = getRows(page, 'aggridbalham_filterable');
    await expect(rows).toHaveCount(1);
  });

  // ============================================
  // BUILT-IN CELL RENDERERS — cell.type
  // ============================================

  test('cell.type: tag renders value in a styled span with colorMap colour', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_tag');
    const firstCellSpan = block.locator('.ag-row[row-index="0"] .ag-cell span').first();
    await expect(firstCellSpan).toHaveText('Active');
    // Uses inline style with color-mix pattern — assert the style contains the pattern.
    const style = await firstCellSpan.getAttribute('style');
    expect(style).toContain('color-mix');
    expect(style).toContain('12%');
    expect(style).toContain('30%');
  });

  test('cell.type: tag renders em-dash for null values', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_tag');
    const lastRowCell = block.locator('.ag-row[row-index="4"] .ag-cell').first();
    await expect(lastRowCell).toContainText('\u2014');
  });

  test('cell.type: tag with colorFrom reads colour from row data path', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_tag_from');
    const firstRowSpan = block.locator('.ag-row[row-index="0"] .ag-cell span').first();
    await expect(firstRowSpan).toHaveText('A');
    const firstStyle = await firstRowSpan.getAttribute('style');
    expect(firstStyle).toContain('color-mix');
  });

  test('cell.type: avatar renders picture when srcField is present', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_avatar');
    const firstRow = block.locator('.ag-row[row-index="0"]');
    await expect(firstRow.locator('img')).toHaveAttribute('src', 'https://example.com/a.png');
    await expect(firstRow).toContainText('Alice Johnson');
  });

  test('cell.type: avatar renders initials when no src is provided', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_avatar');
    const secondRow = block.locator('.ag-row[row-index="1"]');
    await expect(secondRow.locator('img')).toHaveCount(0);
    await expect(secondRow).toContainText('BS');
    await expect(secondRow).toContainText('Bob Smith');
  });

  test('cell.type: avatar renders em-dash when name and src are both null', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_avatar');
    const thirdRow = block.locator('.ag-row[row-index="2"] .ag-cell').first();
    await expect(thirdRow).toContainText('\u2014');
  });

  test('cell.type: avatar with link emits onCellLink with link config', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_avatar_link');
    const anchor = block.locator('.ag-row[row-index="0"] a').first();
    await expect(anchor).toHaveAttribute('href', /\/user\?userId=u1/);
    await anchor.click();
    const display = getBlock(page, 'aggridbalham_avatar_link_display');
    await expect(display).toHaveText('Link: user');
  });

  test('cell.type: link renders anchor with resolved href', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_link');
    const anchor = block.locator('.ag-row[row-index="0"] a').first();
    await expect(anchor).toHaveText('TSK-001');
    await expect(anchor).toHaveAttribute('href', /\/detail\?_id=TSK-001/);
  });

  test('cell.type: link click emits onCellLink with resolved urlQuery', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_link');
    const anchor = block.locator('.ag-row[row-index="1"] a').first();
    await anchor.click();
    const display = getBlock(page, 'aggridbalham_link_display');
    await expect(display).toHaveText('Linked to: TSK-002');
  });

  test('cell.type: date formats with default YYYY-MM-DD HH:mm', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_date');
    const firstCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstCell).toContainText(/^2025-01-15 \d{2}:\d{2}$/);
  });

  test('cell.type: date accepts custom format string', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_date');
    const secondCell = block.locator('.ag-row[row-index="0"] .ag-cell').nth(1);
    await expect(secondCell).toHaveText('2025/01/15');
  });

  test('cell.type: date renders em-dash for null and invalid values', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_date');
    const nullRow = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await expect(nullRow).toContainText('\u2014');
    const invalidRow = block.locator('.ag-row[row-index="2"] .ag-cell').first();
    await expect(invalidRow).toContainText('\u2014');
  });

  test('cell.type: boolean renders default Yes/No labels', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_boolean');
    const trueCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(trueCell).toHaveText('Yes');
    const falseCell = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await expect(falseCell).toHaveText('No');
  });

  test('cell.type: boolean honours custom labels', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_boolean');
    const trueCell = block.locator('.ag-row[row-index="0"] .ag-cell').nth(1);
    await expect(trueCell).toHaveText('Yes!');
    const falseCell = block.locator('.ag-row[row-index="1"] .ag-cell').nth(1);
    await expect(falseCell).toHaveText('Nope');
  });

  test('cell.type: boolean renders em-dash for null', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_boolean');
    const nullCell = block.locator('.ag-row[row-index="2"] .ag-cell').first();
    await expect(nullCell).toContainText('\u2014');
  });

  test('cell.type: progress renders percent with suffix', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_progress');
    const cell = block.locator('.ag-row[row-index="0"] .ag-cell span').first();
    await expect(cell).toHaveText('10%');
  });

  test('cell.type: progress renders None for null', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_progress');
    const cell = block.locator('.ag-row[row-index="3"] .ag-cell').first();
    await expect(cell).toContainText('None');
  });

  test('cell.type: number with format currency renders with symbol', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_number');
    const cell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    const text = await cell.innerText();
    expect(text).toMatch(/\$1,245,000/);
  });

  test('cell.type: number with negative parentheses wraps negatives', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_number');
    const deltaNegative = block.locator('.ag-row[row-index="1"] .ag-cell').nth(1);
    const text = await deltaNegative.innerText();
    expect(text).toMatch(/^\(.*\)$/);
  });

  test('cell.type: number with format percent applies Intl percent formatter', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_number');
    const marginCell = block.locator('.ag-row[row-index="0"] .ag-cell').nth(2);
    const text = await marginCell.innerText();
    // Intl.NumberFormat multiplies by 100 — 0.184 → "18.4%"
    expect(text).toMatch(/18\.4%/);
  });

  test('cell.type: number with format compact renders K/M/B suffix', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_number');
    const viewsCell = block.locator('.ag-row[row-index="1"] .ag-cell').nth(3);
    const text = await viewsCell.innerText();
    expect(text).toMatch(/1\.1M|1M/);
  });

  test('cell.type: number right-aligns by default', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_number');
    const revenueCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    const style = await revenueCell.getAttribute('style');
    expect(style).toContain('justify-content: flex-end');
  });

  test('cell.align: left override wins over auto right-align', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_cell_align_override');
    const cell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    const style = await cell.getAttribute('style');
    expect(style).toContain('justify-content: flex-start');
  });

  test('ellipsis: N installs a line-clamp renderer', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_ellipsis');
    const longCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    const clampSpan = longCell.locator('span').first();
    const style = await clampSpan.getAttribute('style');
    expect(style).toContain('-webkit-line-clamp: 2');
    expect(style).toContain('-webkit-box');
  });

  // ============================================
  // LOADING FLAG — runtime toggle
  // ============================================

  test('loading flag toggles native overlay at runtime', async ({ page }) => {
    const block = getBlock(page, 'aggridbalham_loading_grid');
    const overlay = block.locator('.ag-overlay-loading-center');

    // Initial: loading is false → no visible loading overlay.
    await expect(overlay).toBeHidden();

    // Toggle switch → loading becomes true.
    const toggle = getBlock(page, 'aggridbalham_loading_toggle').locator('button').first();
    await toggle.click();
    await expect(overlay).toBeVisible();

    // Toggle again → loading false → overlay hides.
    await toggle.click();
    await expect(overlay).toBeHidden();
  });
});
