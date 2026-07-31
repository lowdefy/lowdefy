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

// AgGridLowdefyInput renders a div with id={blockId} carrying the shared antd helper class and the
// avatar size custom properties, containing the AgGridReact input component with editable cells and
// row dragging. It carries no file-theme wrapper class — the grid is themed by the Theming API
// object passed as the theme grid option.
const getGrid = (page, blockId) => getBlock(page, blockId).locator('.ag-root-wrapper');
const getHeaderCells = (page, blockId) => getBlock(page, blockId).locator('.ag-header-cell-text');
const getRows = (page, blockId) => getBlock(page, blockId).locator('.ag-row');

test.describe('AgGridLowdefyInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'aggridlowdefyinput');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic grid', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_basic');
    await expect(block).toBeVisible();
    const grid = getGrid(page, 'aggridlowdefyinput_basic');
    await expect(grid).toBeVisible();
  });

  test('renders column headers', async ({ page }) => {
    const headers = getHeaderCells(page, 'aggridlowdefyinput_basic');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Age');
  });

  test('renders row data from value', async ({ page }) => {
    const rows = getRows(page, 'aggridlowdefyinput_basic');
    await expect(rows).toHaveCount(3);
  });

  test('renders cell values', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_basic');
    const firstRowCells = block.locator('.ag-row[row-index="0"] .ag-cell');
    await expect(firstRowCells.nth(0)).toHaveText('Alice');
    await expect(firstRowCells.nth(1)).toHaveText('25');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom height', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_height');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.height).toBeCloseTo(300, -1);
  });

  test('renders with default column definitions', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_default_col_def');
    await expect(block).toBeVisible();
    const headers = getHeaderCells(page, 'aggridlowdefyinput_default_col_def');
    await expect(headers).toHaveCount(2);
  });

  test('renders empty grid with no rows', async ({ page }) => {
    const grid = getGrid(page, 'aggridlowdefyinput_empty');
    await expect(grid).toBeVisible();
    const overlay = getBlock(page, 'aggridlowdefyinput_empty').locator(
      '.ag-overlay-no-rows-center'
    );
    await expect(overlay).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onRowClick event fires when row is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_onrowclick');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'aggridlowdefyinput_row_click_display');
    await expect(display).toHaveText('Row: Alice');
  });

  test('onCellClick event fires when cell is clicked', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_oncellclick');
    const nameCell = block.locator('.ag-row[row-index="1"] .ag-cell').first();
    await nameCell.click();
    const display = getBlock(page, 'aggridlowdefyinput_cell_click_display');
    await expect(display).toHaveText('Cell: Bob');
  });

  test('onRowSelected event fires when row is selected', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_onrowselected');
    const firstRow = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await firstRow.click();
    const display = getBlock(page, 'aggridlowdefyinput_row_selected_display');
    await expect(display).toHaveText('Selected: Alice');
  });

  // ============================================
  // SORTING & FILTERING
  // ============================================

  test('columns can be sorted when sortable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_sortable');
    const nameHeader = block.locator('.ag-header-cell-text').nth(0);
    await nameHeader.click();

    const display = getBlock(page, 'aggridlowdefyinput_sort_changed_display');
    await expect(display).toHaveText('Sort changed');

    const firstRowName = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstRowName).toHaveText('Alice');
  });

  test('columns can be filtered when filter is true', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_filterable');
    const nameHeader = block.locator('.ag-header-cell').nth(0);
    await nameHeader.hover();
    const menuButton = nameHeader.locator('.ag-header-cell-menu-button');
    await menuButton.click();

    const filterPopup = page.locator('.ag-popup .ag-filter');
    await expect(filterPopup).toBeVisible();

    const filterInput = filterPopup.locator('input').first();
    await filterInput.fill('Alice');

    const display = getBlock(page, 'aggridlowdefyinput_filter_changed_display');
    await expect(display).toHaveText('Filter changed');

    const rows = getRows(page, 'aggridlowdefyinput_filterable');
    await expect(rows).toHaveCount(1);
  });

  // ============================================
  // INPUT-SPECIFIC: EDITABLE CELLS
  // ============================================

  test('cell can be edited when editable is true', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_editable');
    const nameCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();

    // Double-click to enter edit mode
    await nameCell.dblclick();

    const cellEditor = block.locator('.ag-cell-editor input');
    await expect(cellEditor).toBeVisible();
    await cellEditor.fill('Updated Alice');
    await cellEditor.press('Enter');

    // Verify onCellValueChanged event fired
    const display = getBlock(page, 'aggridlowdefyinput_cell_value_changed_display');
    await expect(display).toHaveText('New: Updated Alice');
  });

  test('onCellValueChanged captures old value', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_editable');
    const nameCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await nameCell.dblclick();

    const cellEditor = block.locator('.ag-cell-editor input');
    await cellEditor.fill('Updated Alice');
    await cellEditor.press('Enter');

    const display = getBlock(page, 'aggridlowdefyinput_old_value_display');
    await expect(display).toHaveText('Old: Alice');
  });

  test('editing a cell writes the new value back to the block value', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_editable');
    const display = getBlock(page, 'aggridlowdefyinput_value_display');
    await expect(display).toHaveText('Value: Alice');

    await block.locator('.ag-row[row-index="0"] .ag-cell').first().dblclick();
    const cellEditor = block.locator('.ag-cell-editor input');
    await cellEditor.fill('Updated Alice');
    await cellEditor.press('Enter');

    // The display reads the grid's own state key, so this only passes if methods.setValue ran.
    await expect(display).toHaveText('Value: Updated Alice');
  });

  test('edited value survives a re-render', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_editable');
    await block.locator('.ag-row[row-index="0"] .ag-cell').first().dblclick();
    const cellEditor = block.locator('.ag-cell-editor input');
    await cellEditor.fill('Updated Alice');
    await cellEditor.press('Enter');

    // Toggling an unrelated block re-renders the page from state.
    await getBlock(page, 'aggridlowdefyinput_rerender_toggle').locator('button').first().click();

    await expect(block.locator('.ag-row[row-index="0"] .ag-cell').first()).toHaveText(
      'Updated Alice'
    );
    await expect(getBlock(page, 'aggridlowdefyinput_value_display')).toHaveText(
      'Value: Updated Alice'
    );
  });

  // ============================================
  // INPUT-SPECIFIC: ROW DRAGGING
  // ============================================

  test('row drag handle is visible when rowDrag is true', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_rowdrag');
    const dragHandle = block.locator('.ag-row[row-index="0"] .ag-drag-handle');
    await expect(dragHandle).toBeVisible();
  });

  test('onRowDragEnd event fires when row is dragged', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_rowdrag');
    const sourceHandle = block.locator('.ag-row[row-index="0"] .ag-drag-handle');
    const targetRow = block.locator('.ag-row[row-index="2"]');
    await sourceHandle.dragTo(targetRow);

    const display = getBlock(page, 'aggridlowdefyinput_row_drag_display');
    await expect(display).toHaveText('Drag ended');
  });

  // ============================================
  // BUILT-IN CELL RENDERERS — cell.type
  // ============================================

  test('cell.type: tag renders value in a styled span with colorMap colour', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_tag');
    const firstCellSpan = block.locator('.ag-row[row-index="0"] .ag-cell span').first();
    await expect(firstCellSpan).toHaveText('Active');
    // Uses inline style with color-mix pattern — assert the style contains the pattern.
    const style = await firstCellSpan.getAttribute('style');
    expect(style).toContain('color-mix');
    expect(style).toContain('12%');
    expect(style).toContain('30%');
  });

  test('cell.type: tag renders em-dash for null values', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_tag');
    const nullCell = block.locator('.ag-row[row-index="2"] .ag-cell').first();
    await expect(nullCell).toContainText('—');
  });

  test('cell.type: date formats with default YYYY-MM-DD HH:mm', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_date');
    const firstCell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    await expect(firstCell).toContainText(/^2025-01-15 \d{2}:\d{2}$/);
  });

  test('cell.type: date accepts custom format string', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_date');
    const secondCell = block.locator('.ag-row[row-index="0"] .ag-cell').nth(1);
    await expect(secondCell).toHaveText('2025/01/15');
  });

  test('cell.type: boolean renders default and custom labels', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_boolean');
    await expect(block.locator('.ag-row[row-index="0"] .ag-cell').nth(0)).toHaveText('Yes');
    await expect(block.locator('.ag-row[row-index="0"] .ag-cell').nth(1)).toHaveText('Yes!');
    await expect(block.locator('.ag-row[row-index="1"] .ag-cell').nth(0)).toHaveText('No');
    await expect(block.locator('.ag-row[row-index="1"] .ag-cell').nth(1)).toHaveText('Nope');
  });

  test('cell.type: number with format currency renders with symbol and right-aligns', async ({
    page,
  }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_number');
    const cell = block.locator('.ag-row[row-index="0"] .ag-cell').first();
    const text = await cell.innerText();
    expect(text).toMatch(/\$1,245,000/);
    const style = await cell.getAttribute('style');
    expect(style).toContain('justify-content: flex-end');
  });

  // ============================================
  // BUILT-IN CELL RENDERERS — input cells
  // ============================================

  test('cell.type: textInput commits on Enter, firing its event', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_inputs');
    const input = block.locator('.ag-row[row-index="0"] .ag-cell input.ant-input').first();
    await input.fill('Alicia');
    await input.press('Enter');

    await expect(getBlock(page, 'aggridlowdefyinput_name_input_display')).toHaveText(
      'Name: Alicia'
    );
  });

  test('cell.type: textInput writes through to the block value', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_inputs');
    const display = getBlock(page, 'aggridlowdefyinput_inputs_value_display');
    await expect(display).toHaveText('Row name: Alice');

    const input = block.locator('.ag-row[row-index="0"] .ag-cell input.ant-input').first();
    await input.fill('Alicia');
    await input.press('Enter');

    // node.setDataValue reaches the core's onCellValueChanged, which is what calls methods.setValue.
    await expect(display).toHaveText('Row name: Alicia');
  });

  test('cell.type: switch fires its event on toggle', async ({ page }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_inputs');
    await block.locator('.ag-row[row-index="0"] .ag-cell .ant-switch').first().click();
    await expect(getBlock(page, 'aggridlowdefyinput_active_toggle_display')).toHaveText(
      'Active: true'
    );
  });

  test('cell.type: paragraphInput opens an inline editor with the antd offset neutralised', async ({
    page,
  }) => {
    const block = getBlock(page, 'aggridlowdefyinput_cell_inputs');
    const notesCell = block.locator('.ag-row[row-index="0"] .ag-cell').nth(2);
    await notesCell.locator('.ant-typography-edit').click();

    const editContent = notesCell.locator('.ant-typography-edit-content');
    await expect(editContent).toBeVisible();
    // The shared structural module cancels antd's negative offsets so the editor stays centred in
    // the flex cell. This block has no file-theme class, so it is the .antdTheme rule that applies.
    await expect(editContent).toHaveCSS('margin-top', '0px');
    await expect(editContent).toHaveCSS('inset-inline-start', '0px');
  });

  // ============================================
  // SIZE — avatar CSS custom properties
  // ============================================

  // The block carries no file-theme wrapper class, so the shared module's per-legacy-theme avatar
  // rules never match it. These assertions are what prove the inline --lf-avatar-size /
  // --lf-avatar-font-size reach AvatarCell.
  test('size: small sizes avatars from the inline avatar custom properties', async ({ page }) => {
    const avatar = getBlock(page, 'aggridlowdefyinput_avatar_small').locator('.ant-avatar').first();
    await expect(avatar).toHaveCSS('width', '20px');
    await expect(avatar).toHaveCSS('height', '20px');
    await expect(avatar).toHaveCSS('font-size', '10px');
  });

  test('size: large sizes avatars from the inline avatar custom properties', async ({ page }) => {
    const avatar = getBlock(page, 'aggridlowdefyinput_avatar_large').locator('.ant-avatar').first();
    await expect(avatar).toHaveCSS('width', '28px');
    await expect(avatar).toHaveCSS('height', '28px');
    await expect(avatar).toHaveCSS('font-size', '14px');
  });
});
