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

// Editors are portalled into the cell being edited ([data-lf-editor]); status markers into
// cells with a save running or failed ([data-lf-edit-status]). Cells are addressed by row key.
const cell = (page, blockId, rowKey, key) =>
  getBlock(page, blockId).locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-lf-cell][data-col-key="${key}"]`
  );
const editor = (page, blockId) => getBlock(page, blockId).locator('[data-lf-editor]');
const editorInput = (page, blockId) => editor(page, blockId).locator('input').first();
const marker = (page, blockId, rowKey, key) =>
  cell(page, blockId, rowKey, key).locator('[data-lf-edit-status]');
const popup = (page) => page.locator('.lf-table-editor-popup:visible');
const handle = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-lf-drag-handle]`
  );
const displayKeys = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.lf-table-body [role="row"]')
    .evaluateAll((rows) => rows.map((element) => element.dataset.rowKey));

async function dragRow(page, blockId, rowKey, targetRowKey, { below = true } = {}) {
  await getBlock(page, blockId).scrollIntoViewIfNeeded();
  const from = await handle(page, blockId, rowKey).boundingBox();
  const target = await getBlock(page, blockId)
    .locator(`.lf-table-body [data-row-key="${targetRowKey}"]`)
    .boundingBox();
  const x = from.x + from.width / 2;
  const y = target.y + (below ? target.height - 4 : 4);
  await page.mouse.move(x, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(x, from.y + ((y - from.y) * i) / 8);
  }
  await page.mouse.up();
}

function editText(page) {
  return getBlock(page, 'edit_types_value');
}

async function expectEdit(page, edit) {
  await expect(editText(page)).toContainText(`edit=${JSON.stringify(edit)}`);
}

function focusedCell(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      rowKey: element.closest('[data-row-key]')?.dataset.rowKey ?? null,
      colKey: element.dataset.colKey ?? null,
    };
  });
}

test.describe('Table editing', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'table-editing');
    await expect(cell(page, 'edit_types', 1, 'name')).toHaveText('Ann');
  });

  // ============================================
  // OPEN, COMMIT, CANCEL
  // ============================================

  test('double-click opens a text editor and Enter commits through onCellEdit', async ({
    page,
  }) => {
    await cell(page, 'edit_types', 1, 'name').dblclick();
    await expect(editorInput(page, 'edit_types')).toBeFocused();
    await expect(editorInput(page, 'edit_types')).toHaveValue('Ann');
    await editorInput(page, 'edit_types').fill('Anna');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'edit_types')).toHaveCount(0);
    await expect(cell(page, 'edit_types', 1, 'name')).toHaveText('Anna');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'name', field: 'name' },
      value: 'Anna',
      previous: 'Ann',
    });
    expect(await focusedCell(page)).toEqual({ rowKey: '1', colKey: 'name' });
  });

  test('Enter opens the editor on the focused cell and Esc cancels without an event', async ({
    page,
  }) => {
    await cell(page, 'edit_types', 2, 'name').click();
    await page.keyboard.press('Enter');
    await expect(editorInput(page, 'edit_types')).toBeFocused();
    await page.keyboard.type('XYZ');
    await page.keyboard.press('Escape');
    await expect(editor(page, 'edit_types')).toHaveCount(0);
    await expect(cell(page, 'edit_types', 2, 'name')).toHaveText('Ben');
    await expect(editText(page)).toContainText('"value":null');
    expect(await focusedCell(page)).toEqual({ rowKey: '2', colKey: 'name' });
  });

  test('typing a character into a focused cell opens the editor seeded with it', async ({
    page,
  }) => {
    await cell(page, 'edit_types', 1, 'age').click();
    await page.keyboard.press('7');
    await expect(editorInput(page, 'edit_types')).toHaveValue('7');
    await page.keyboard.type('5');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_types', 1, 'age')).toHaveText('75');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'age', field: 'age' },
      value: 75,
      previous: 30,
    });
  });

  test('F2 opens the editor with the current value', async ({ page }) => {
    await cell(page, 'edit_types', 2, 'city').click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('F2');
    await expect(editorInput(page, 'edit_types')).toHaveValue('Berlin');
  });

  test('Tab commits and opens the next editable cell, Shift+Tab goes back', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'name').dblclick();
    await editorInput(page, 'edit_types').fill('Anne');
    await page.keyboard.press('Tab');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'name', field: 'name' },
      value: 'Anne',
      previous: 'Ann',
    });
    await expect(cell(page, 'edit_types', 1, 'age').locator('[data-lf-editor]')).toHaveCount(1);
    await expect(editorInput(page, 'edit_types')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(cell(page, 'edit_types', 1, 'name').locator('[data-lf-editor]')).toHaveCount(1);
    await expect(editorInput(page, 'edit_types')).toHaveValue('Anne');
    await page.keyboard.press('Escape');
  });

  test('clicking elsewhere commits the open editor', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'name').dblclick();
    await editorInput(page, 'edit_types').fill('Annie');
    await cell(page, 'edit_types', 2, 'note').click();
    await expect(editor(page, 'edit_types')).toHaveCount(0);
    await expect(cell(page, 'edit_types', 1, 'name')).toHaveText('Annie');
  });

  test('only one editor is mounted at a time', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'name').dblclick();
    await cell(page, 'edit_types', 2, 'name').dblclick();
    await expect(getBlock(page, 'edit_types').locator('[data-lf-editor]')).toHaveCount(1);
    await expect(cell(page, 'edit_types', 2, 'name').locator('[data-lf-editor]')).toHaveCount(1);
  });

  // ============================================
  // VALIDATION AND EDITABLE CONDITIONS
  // ============================================

  test('a failing validate keeps the editor open with its message', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'name').dblclick();
    await editorInput(page, 'edit_types').fill('');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'edit_types')).toHaveAttribute(
      'data-lf-editor-error',
      'Name is required'
    );
    await expect(page.getByRole('tooltip')).toContainText('Name is required');
    await expect(editText(page)).toContainText('"value":null');
    await editorInput(page, 'edit_types').fill('Ada');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_types', 1, 'name')).toHaveText('Ada');
  });

  test('a number validate message shows for a negative age', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'age').dblclick();
    await editorInput(page, 'edit_types').fill('-5');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'edit_types')).toHaveAttribute(
      'data-lf-editor-error',
      'Age must be positive'
    );
  });

  test('editable.when is tested per row', async ({ page }) => {
    await cell(page, 'edit_types', 2, 'city').dblclick();
    await expect(editor(page, 'edit_types')).toHaveCount(0);
    await cell(page, 'edit_types', 1, 'city').dblclick();
    await expect(editorInput(page, 'edit_types')).toHaveValue('Berlin');
  });

  test('Enter on a read-only cell activates the row instead of editing', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'note').click();
    await expect(editText(page)).toContainText('click=1');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'edit_types')).toHaveCount(0);
    await expect(editText(page)).toContainText('click=2');
  });

  // ============================================
  // EDITOR TYPES
  // ============================================

  test('date cells edit with a date picker', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'joined').dblclick();
    await expect(popup(page)).toBeVisible();
    await editorInput(page, 'edit_types').fill('2026-03-15');
    await page.keyboard.press('Enter');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'joined', field: 'joined' },
      value: '2026-03-15',
      previous: '2026-03-01',
    });
  });

  test('boolean cells edit with a switch that commits on toggle', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'active').dblclick();
    const toggle = editor(page, 'edit_types').getByRole('switch');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'active', field: 'active' },
      value: true,
      previous: false,
    });
  });

  test('status cells select from options, seeded by typing', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'stage').click();
    await page.keyboard.press('l');
    await expect(popup(page)).toBeVisible();
    await page.keyboard.type('o');
    await page.keyboard.press('Enter');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'stage', field: 'stage' },
      value: 'lost',
      previous: 'lead',
    });
  });

  test('tags cells select several options and commit on Tab', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'labels').dblclick();
    await popup(page).getByTitle('green').click();
    await page.keyboard.press('Tab');
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'labels', field: 'labels' },
      value: ['red', 'green'],
      previous: ['red'],
    });
  });

  test('rating cells edit with stars', async ({ page }) => {
    await cell(page, 'edit_types', 1, 'score').dblclick();
    await editor(page, 'edit_types').locator('.ant-rate-star').nth(4).click();
    await expectEdit(page, {
      rowKey: 1,
      column: { key: 'score', field: 'score' },
      value: 5,
      previous: 2,
    });
  });

  // ============================================
  // OPTIMISTIC SAVE
  // ============================================

  test('a save shows the new value while saving and keeps it after success', async ({ page }) => {
    await cell(page, 'edit_save', 1, 'name').dblclick();
    await editorInput(page, 'edit_save').fill('Anna');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_save', 1, 'name')).toHaveText('Anna');
    await expect(marker(page, 'edit_save', 1, 'name')).toHaveAttribute(
      'data-lf-edit-status',
      'saving'
    );
    await expect(getBlock(page, 'edit_save_value')).toHaveText('saved=Anna');
    await expect(marker(page, 'edit_save', 1, 'name')).toHaveCount(0);
    await expect(cell(page, 'edit_save', 1, 'name')).toHaveText('Anna');
  });

  test('a failed save reverts the cell and shows the error message', async ({ page }) => {
    await cell(page, 'edit_fail', 2, 'name').dblclick();
    await editorInput(page, 'edit_fail').fill('Benny');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_fail', 2, 'name')).toHaveText('Benny');
    await expect(marker(page, 'edit_fail', 2, 'name')).toHaveAttribute(
      'data-lf-edit-status',
      'saving'
    );
    await expect(marker(page, 'edit_fail', 2, 'name')).toHaveAttribute(
      'data-lf-edit-status',
      'error'
    );
    await expect(cell(page, 'edit_fail', 2, 'name')).toHaveText('Ben');
    await expect(marker(page, 'edit_fail', 2, 'name')).toHaveAttribute(
      'data-lf-edit-message',
      'Deal is locked'
    );
    await marker(page, 'edit_fail', 2, 'name').hover();
    await expect(page.getByRole('tooltip')).toContainText('Deal is locked');
  });

  test('a save keeps its value when other rows of data change while it runs', async ({ page }) => {
    await cell(page, 'edit_unrelated', 1, 'name').dblclick();
    await editorInput(page, 'edit_unrelated').fill('Anna');
    await page.keyboard.press('Enter');
    await expect(marker(page, 'edit_unrelated', 1, 'name')).toHaveAttribute(
      'data-lf-edit-status',
      'saving'
    );
    await page.locator('#edit_unrelated_touch').click();
    await expect(cell(page, 'edit_unrelated', 2, 'name')).toHaveText('Ben changed');
    await expect(cell(page, 'edit_unrelated', 1, 'name')).toHaveText('Anna');
    await expect(marker(page, 'edit_unrelated', 1, 'name')).toHaveCount(0);
    await expect(cell(page, 'edit_unrelated', 1, 'name')).toHaveText('Anna');
  });

  test('the overlay gives way when the app writes the saved row into data', async ({ page }) => {
    await cell(page, 'edit_data', 1, 'name').dblclick();
    await editorInput(page, 'edit_data').fill('Typed');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_data', 1, 'name')).toHaveText('Written by the app');
    await expect(marker(page, 'edit_data', 1, 'name')).toHaveCount(0);
  });

  // The missing-save warning is development only; the e2e server runs a production build.
  test('without onCellEdit an edit shows in the table only', async ({ page }) => {
    await cell(page, 'edit_local', 1, 'name').dblclick();
    await editorInput(page, 'edit_local').fill('Local');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'edit_local', 1, 'name')).toHaveText('Local');
    await expect(marker(page, 'edit_local', 1, 'name')).toHaveCount(0);
  });

  // ============================================
  // SORTED TABLE
  // ============================================

  test('editing a sorted table edits the row by key, not by position', async ({ page }) => {
    const firstRow = getBlock(page, 'edit_sorted').locator('.lf-table-body [data-row-index="0"]');
    await expect(firstRow).toHaveAttribute('data-row-key', 'c');
    await firstRow.locator('[data-col-key="age"]').dblclick();
    await editorInput(page, 'edit_sorted').fill('51');
    await page.keyboard.press('Enter');
    await expect(getBlock(page, 'edit_sorted_value')).toHaveText(
      'sorted={"rowKey":"c","value":51,"row":"Cat"}'
    );
    await expect(cell(page, 'edit_sorted', 'c', 'age')).toHaveText('51');
    await expect(cell(page, 'edit_sorted', 'a', 'age')).toHaveText('30');
  });

  test('an edit that changes the sorted column keeps the edit on its row', async ({ page }) => {
    await cell(page, 'edit_sorted', 'a', 'name').dblclick();
    await editorInput(page, 'edit_sorted').fill('Zed');
    await page.keyboard.press('Enter');
    await expect(getBlock(page, 'edit_sorted_value')).toHaveText(
      'sorted={"rowKey":"a","value":"Zed","row":"Ann"}'
    );
    await expect(cell(page, 'edit_sorted', 'a', 'name')).toHaveText('Zed');
    await expect(cell(page, 'edit_sorted', 'a', 'age')).toHaveText('30');
  });

  // ============================================
  // ROW MOVES
  // ============================================

  test('a row move reorders at once, saves one position through onRowMove and keeps it', async ({
    page,
  }) => {
    await dragRow(page, 'move_positions', 's3', 's1');
    await expect.poll(() => displayKeys(page, 'move_positions')).toEqual(['s1', 's3', 's2']);
    await expect(cell(page, 'move_positions', 's3', 'position')).toHaveText(/^1,?536$/);
    await expect(marker(page, 'move_positions', 's3', '__row')).toHaveAttribute(
      'data-lf-edit-status',
      'saving'
    );
    await expect(getBlock(page, 'move_positions_value')).toHaveText(
      'move={"rowKey":"s3","fromIndex":2,"toIndex":1,"beforeKey":"s1","afterKey":"s2","position":1536,"positions":{"s3":1536}}'
    );
    await expect(marker(page, 'move_positions', 's3', '__row')).toHaveCount(0);
    expect(await displayKeys(page, 'move_positions')).toEqual(['s1', 's3', 's2']);
  });

  test('a row move on a later page reports indices and neighbours in the whole list', async ({
    page,
  }) => {
    await getBlock(page, 'move_paged').locator('.ant-pagination-item-2').click();
    await expect.poll(() => displayKeys(page, 'move_paged')).toEqual(['s3', 's4']);
    await dragRow(page, 'move_paged', 's4', 's3', { below: false });
    await expect.poll(() => displayKeys(page, 'move_paged')).toEqual(['s4', 's3']);
    await expect(getBlock(page, 'move_paged_value')).toHaveText(
      'move={"rowKey":"s4","fromIndex":3,"toIndex":2,"beforeKey":"s2","afterKey":"s3","position":2560,"positions":{"s4":2560}}'
    );
  });

  test('Alt+Shift+ArrowUp on the first row of a page does not move it', async ({ page }) => {
    await getBlock(page, 'move_paged').locator('.ant-pagination-item-2').click();
    await cell(page, 'move_paged', 's3', 'title').click();
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expect.poll(() => displayKeys(page, 'move_paged')).toEqual(['s4', 's3']);
    await expect(cell(page, 'move_paged', 's3', 'title')).toBeFocused();
    await expect(getBlock(page, 'move_paged_value')).toContainText(
      '"rowKey":"s3","fromIndex":2,"toIndex":3,"beforeKey":"s4","afterKey":"s5","position":4608'
    );
  });

  test('Alt+Shift+ArrowDown moves the focused row and keeps focus on it', async ({ page }) => {
    await cell(page, 'move_positions', 's1', 'title').click();
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expect.poll(() => displayKeys(page, 'move_positions')).toEqual(['s2', 's1', 's3']);
    expect(await focusedCell(page)).toEqual({ rowKey: 's1', colKey: 'title' });
    await expect(getBlock(page, 'move_positions_value')).toContainText('"position":2560');
  });

  test('a failed row move reverts the order and shows the error on the handle', async ({
    page,
  }) => {
    await dragRow(page, 'move_fail', 's1', 's3');
    await expect.poll(() => displayKeys(page, 'move_fail')).toEqual(['s2', 's3', 's1']);
    await expect(marker(page, 'move_fail', 's1', '__row')).toHaveAttribute(
      'data-lf-edit-status',
      'error'
    );
    await expect.poll(() => displayKeys(page, 'move_fail')).toEqual(['s1', 's2', 's3']);
    await expect(marker(page, 'move_fail', 's1', '__row')).toHaveAttribute(
      'data-lf-edit-message',
      'Order is locked'
    );
  });

  test('row drag is off while sorted by another column, with the reason', async ({ page }) => {
    await expect(handle(page, 'move_sorted', 's1')).toHaveAttribute('aria-disabled', 'true');
    await expect(handle(page, 'move_sorted', 's1')).toHaveAttribute(
      'title',
      'Clear the sort to reorder rows.'
    );
  });

  test('row drag is on while sorted ascending by the position field', async ({ page }) => {
    await getBlock(page, 'move_sorted')
      .locator('[data-lf-header][data-col-key="position"]')
      .click();
    await expect(handle(page, 'move_sorted', 's1')).not.toHaveAttribute('aria-disabled', 'true');
  });

  // ============================================
  // COPY
  // ============================================

  test('Ctrl/Cmd+C copies the focused cell with keyboard: false', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => navigator.clipboard.writeText('before'));
    await cell(page, 'copy_nokeys', 1, 'name').click();
    await page.keyboard.press('ControlOrMeta+c');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Ann');
  });

  test('Ctrl/Cmd+C copies the selected rows as TSV', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await cell(page, 'edit_copy', 1, '__select').locator('input').click();
    await cell(page, 'edit_copy', 3, '__select').locator('input').click();
    await cell(page, 'edit_copy', 2, 'name').click();
    await page.keyboard.press('ControlOrMeta+c');
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('Ann\t30\nCat\t50');
  });
});
