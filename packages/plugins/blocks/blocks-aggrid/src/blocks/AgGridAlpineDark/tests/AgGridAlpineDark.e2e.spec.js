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

// AgGridAlpineDark renders a div with id={blockId} and class ag-theme-alpine-dark,
// containing the AgGridReact component.
const getGrid = (page, blockId) => getBlock(page, blockId).locator('.ag-root-wrapper');
const getHeaderCells = (page, blockId) => getBlock(page, blockId).locator('.ag-header-cell-text');
const getRows = (page, blockId) => getBlock(page, blockId).locator('.ag-row');
const getCells = (page, blockId) => getBlock(page, blockId).locator('.ag-cell');

test.describe('AgGridAlpineDark Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'aggridalpinedark');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic grid', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_basic');
    await expect(block).toBeVisible();
    const grid = getGrid(page, 'aggridalpinedark_basic');
    await expect(grid).toBeVisible();
  });

  test('renders with ag-theme-alpine-dark class', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_basic');
    await expect(block.locator('[class*="ag-theme-alpine-dark"]')).toBeVisible();
  });

  test('renders column headers', async ({ page }) => {
    const headers = getHeaderCells(page, 'aggridalpinedark_basic');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Age');
  });

  test('renders row data', async ({ page }) => {
    const rows = getRows(page, 'aggridalpinedark_basic');
    await expect(rows).toHaveCount(3);
  });

  test('renders cell values', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_basic');
    const firstRowCells = block.locator('.ag-row[row-index="0"] .ag-cell');
    await expect(firstRowCells.nth(0)).toHaveText('Alice');
    await expect(firstRowCells.nth(1)).toHaveText('25');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom height', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_height');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.height).toBeCloseTo(300, -1);
  });

  test('renders with default column definitions', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_default_col_def');
    await expect(block).toBeVisible();
    const headers = getHeaderCells(page, 'aggridalpinedark_default_col_def');
    await expect(headers).toHaveCount(2);
  });

  test('renders empty grid with no rows', async ({ page }) => {
    const grid = getGrid(page, 'aggridalpinedark_empty');
    await expect(grid).toBeVisible();
    const overlay = getBlock(page, 'aggridalpinedark_empty').locator('.ag-overlay-no-rows-center');
    await expect(overlay).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onRowClick event fires when row is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_onrowclick');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'row_click_display');
    await expect(display).toHaveText('Row: Alice');
  });

  test('onCellClick event fires when cell is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_oncellclick');
    const nameCell = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await nameCell.click();
    const display = getBlock(page, 'cell_click_display');
    await expect(display).toHaveText('Cell: Bob');
  });

  test('onRowSelected event fires when row is selected', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_onrowselected');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'row_selected_display');
    await expect(display).toHaveText('Selected: Alice');
  });

  // ============================================
  // SORTING & FILTERING
  // ============================================

  test('columns can be sorted when sortable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_sortable');
    // Click Name header to sort ascending
    const nameHeader = block.locator('.ag-header-cell-text').nth(0);
    await nameHeader.click();

    // Verify sort changed event fired
    const display = getBlock(page, 'sort_changed_display');
    await expect(display).toHaveText('Sort changed');

    // Verify rows are sorted alphabetically
    const firstRowName = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstRowName).toHaveText('Alice');
  });

  test('columns can be filtered when filter is true', async ({ page }) => {
    const block = getBlock(page, 'aggridalpinedark_filterable');
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
    const display = getBlock(page, 'filter_changed_display');
    await expect(display).toHaveText('Filter changed');

    // Verify filtered results
    const rows = getRows(page, 'aggridalpinedark_filterable');
    await expect(rows).toHaveCount(1);
  });
});
