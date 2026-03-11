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

// AgGridInputAlpineDark renders a div with id={blockId} and class ag-theme-alpine-dark,
// containing the AgGridReact input component with editable cells and row dragging.
const getGrid = (page, blockId) => getBlock(page, blockId).locator('.ag-root-wrapper');
const getHeaderCells = (page, blockId) => getBlock(page, blockId).locator('.ag-header-cell-text');
const getRows = (page, blockId) => getBlock(page, blockId).locator('.ag-row');

test.describe('AgGridInputAlpineDark Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'aggridinputalpinedark');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic grid', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_basic');
    await expect(block).toBeVisible();
    const grid = getGrid(page, 'aggridinputalpinedark_basic');
    await expect(grid).toBeVisible();
  });

  test('renders with ag-theme-alpine-dark class', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_basic');
    await expect(block).toHaveClass(/ag-theme-alpine-dark/);
  });

  test('renders column headers', async ({ page }) => {
    const headers = getHeaderCells(page, 'aggridinputalpinedark_basic');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Age');
  });

  test('renders row data from value', async ({ page }) => {
    const rows = getRows(page, 'aggridinputalpinedark_basic');
    await expect(rows).toHaveCount(3);
  });

  test('renders cell values', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_basic');
    const firstRowCells = block.locator('.ag-row[row-index="0"] .ag-cell');
    await expect(firstRowCells.nth(0)).toHaveText('Alice');
    await expect(firstRowCells.nth(1)).toHaveText('25');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom height', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_height');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.height).toBeCloseTo(300, -1);
  });

  test('renders with default column definitions', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_default_col_def');
    await expect(block).toBeVisible();
    const headers = getHeaderCells(page, 'aggridinputalpinedark_default_col_def');
    await expect(headers).toHaveCount(2);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onRowClick event fires when row is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_onrowclick');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'row_click_display');
    await expect(display).toHaveText('Row: Alice');
  });

  test('onCellClick event fires when cell is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_oncellclick');
    const nameCell = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await nameCell.click();
    const display = getBlock(page, 'cell_click_display');
    await expect(display).toHaveText('Cell: Bob');
  });

  test('onRowSelected event fires when row is selected', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_onrowselected');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'row_selected_display');
    await expect(display).toHaveText('Selected: Alice');
  });

  // ============================================
  // SORTING & FILTERING
  // ============================================

  test('columns can be sorted when sortable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_sortable');
    const nameHeader = block.locator('.ag-header-cell-text').nth(0);
    await nameHeader.click();

    const display = getBlock(page, 'sort_changed_display');
    await expect(display).toHaveText('Sort changed');

    const firstRowName = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstRowName).toHaveText('Alice');
  });

  test('columns can be filtered when filter is true', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_filterable');
    const nameHeader = block.locator('.ag-header-cell').nth(0);
    await nameHeader.hover();
    const menuButton = nameHeader.locator('.ag-header-cell-menu-button');
    await menuButton.click();

    const filterPopup = page.locator('.ag-popup');
    await expect(filterPopup).toBeVisible();

    const filterInput = filterPopup.locator('.ag-filter-filter input').first();
    await filterInput.fill('Alice');

    const display = getBlock(page, 'filter_changed_display');
    await expect(display).toHaveText('Filter changed');

    const rows = getRows(page, 'aggridinputalpinedark_filterable');
    await expect(rows).toHaveCount(1);
  });

  // ============================================
  // INPUT-SPECIFIC: EDITABLE CELLS
  // ============================================

  test('cell can be edited when editable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_editable');
    const nameCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();

    // Double-click to enter edit mode
    await nameCell.dblclick();

    // Find the cell editor input
    const cellEditor = block.locator('.ag-cell-editor input');
    await expect(cellEditor).toBeVisible();
    await cellEditor.fill('Updated Alice');
    await cellEditor.press('Enter');

    // Verify onCellValueChanged event fired
    const display = getBlock(page, 'cell_value_changed_display');
    await expect(display).toHaveText('New: Updated Alice');
  });

  // ============================================
  // INPUT-SPECIFIC: ROW DRAGGING
  // ============================================

  test('row drag handle is visible when rowDrag is true', async ({ page }) => {
    const block = getBlock(page, 'aggridinputalpinedark_rowdrag');
    const dragHandle = block.locator('.ag-row[row-index="0"] .ag-drag-handle');
    await expect(dragHandle).toBeVisible();
  });
});
