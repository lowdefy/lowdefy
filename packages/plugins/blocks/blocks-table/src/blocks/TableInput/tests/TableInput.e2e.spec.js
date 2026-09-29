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

// TableInput renders the Table DOM over its `data`; its value (the changes) is mirrored into
// spans as JSON.
const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const cell = (page, blockId, rowKey, key) =>
  row(page, blockId, rowKey).locator(`[data-lf-cell][data-col-key="${key}"]`);
const editor = (page, blockId) => getBlock(page, blockId).locator('[data-lf-editor]');
const editorInput = (page, blockId) => editor(page, blockId).locator('input').first();
const displayKeys = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.lf-table-body [role="row"]')
    .evaluateAll((rows) => rows.map((element) => element.dataset.rowKey));

async function readJson(page, blockId, prefix) {
  const text = await getBlock(page, blockId).innerText();
  return JSON.parse(text.slice(prefix.length));
}

const value = (page) => readJson(page, 'lines_value', 'value=');
const change = (page) => readJson(page, 'lines_change_value', 'change=');
const noChanges = { updated: {}, added: [], removed: [] };

async function dragRow(page, blockId, rowKey, targetRowKey, { below = true } = {}) {
  await getBlock(page, blockId).scrollIntoViewIfNeeded();
  const handle = row(page, blockId, rowKey).locator('[data-lf-drag-handle]');
  const from = await handle.boundingBox();
  const target = await row(page, blockId, targetRowKey).boundingBox();
  const x = from.x + from.width / 2;
  const y = target.y + (below ? target.height - 4 : 4);
  await page.mouse.move(x, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(x, from.y + ((y - from.y) * i) / 8);
  }
  await page.mouse.up();
}

test.describe('TableInput', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table-input');
    await expect(cell(page, 'lines', 'a', 'item')).toHaveText('Apples');
  });

  test('the value starts as no changes', async ({ page }) => {
    expect(await value(page)).toEqual(noChanges);
  });

  // ============================================
  // EDIT
  // ============================================

  test('an edit records only the changed field under the row key', async ({ page }) => {
    await cell(page, 'lines', 'b', 'item').dblclick();
    await editorInput(page, 'lines').fill('Butter');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'lines', 'b', 'item')).toHaveText('Butter');
    expect(await value(page)).toEqual({ ...noChanges, updated: { b: { item: 'Butter' } } });
    expect(await change(page)).toEqual({ cause: 'edit', rowKey: 'b', skipped: null });
  });

  test('an edit back to the original value leaves no change', async ({ page }) => {
    await cell(page, 'lines', 'b', 'item').dblclick();
    await editorInput(page, 'lines').fill('Butter');
    await page.keyboard.press('Enter');
    await cell(page, 'lines', 'b', 'item').dblclick();
    await editorInput(page, 'lines').fill('Bread');
    await page.keyboard.press('Enter');
    await expect.poll(() => value(page)).toEqual(noChanges);
  });

  test('a nested field edit is recorded under its dot path', async ({ page }) => {
    await cell(page, 'lines', 'a', 'note').dblclick();
    await expect(editorInput(page, 'lines')).toHaveValue('fresh');
    await editorInput(page, 'lines').fill('ripe');
    await page.keyboard.press('Enter');
    await expect(cell(page, 'lines', 'a', 'note')).toHaveText('ripe');
    expect(await value(page)).toEqual({ ...noChanges, updated: { a: { 'details.note': 'ripe' } } });
  });

  test('Tab through cells builds each edit on the last', async ({ page }) => {
    await cell(page, 'lines', 'a', 'item').dblclick();
    await editorInput(page, 'lines').fill('Apricots');
    await page.keyboard.press('Tab');
    await editorInput(page, 'lines').fill('7');
    await page.keyboard.press('Tab');
    await editorInput(page, 'lines').fill('dried');
    await page.keyboard.press('Enter');
    expect((await value(page)).updated).toEqual({
      a: { item: 'Apricots', qty: 7, 'details.note': 'dried' },
    });
  });

  test('editing a sorted TableInput records the edit by key', async ({ page }) => {
    const firstRow = getBlock(page, 'lines_sorted').locator('.lf-table-body [data-row-index="0"]');
    await expect(firstRow).toHaveAttribute('data-row-key', 'b');
    await firstRow.locator('[data-col-key="item"]').dblclick();
    await editorInput(page, 'lines_sorted').fill('Bagels');
    await page.keyboard.press('Enter');
    expect(await readJson(page, 'lines_sorted_value', 'sorted=')).toEqual({
      ...noChanges,
      updated: { b: { item: 'Bagels' } },
    });
  });

  test('a failing validate keeps the editor open and the value unchanged', async ({ page }) => {
    await cell(page, 'lines', 'a', 'qty').dblclick();
    await editorInput(page, 'lines').fill('-1');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'lines')).toHaveAttribute(
      'data-lf-editor-error',
      'Quantity cannot be negative'
    );
    expect(await value(page)).toEqual(noChanges);
  });

  // ============================================
  // ADD AND DELETE
  // ============================================

  test('+ Add row adds a row with defaults and a temporary key and opens its first cell', async ({
    page,
  }) => {
    await getBlock(page, 'lines').locator('[data-lf-add-row]').click();
    await expect(getBlock(page, 'lines').locator('.lf-table-body [role="row"]')).toHaveCount(4);
    const [added] = (await value(page)).added;
    expect(added).toEqual({ rowKey: added.rowKey, qty: 1 });
    expect(added.rowKey.length).toBeGreaterThan(0);
    expect(await change(page)).toEqual({ cause: 'add', rowKey: added.rowKey, skipped: null });
    await expect(cell(page, 'lines', added.rowKey, 'id')).toHaveText(added.rowKey);
    await expect(cell(page, 'lines', added.rowKey, 'item').locator('[data-lf-editor]')).toHaveCount(
      1
    );
    await page.keyboard.type('Dates');
    await page.keyboard.press('Enter');
    expect(await value(page)).toEqual({
      ...noChanges,
      added: [{ rowKey: added.rowKey, qty: 1, item: 'Dates' }],
    });
  });

  test('an added row with an empty required cell is marked invalid inline', async ({ page }) => {
    await getBlock(page, 'lines').locator('[data-lf-add-row]').click();
    await expect(editorInput(page, 'lines')).toBeFocused();
    await page.keyboard.press('Escape');
    const [added] = (await value(page)).added;
    const flag = cell(page, 'lines', added.rowKey, 'item').locator('[data-lf-edit-status]');
    await expect(flag).toHaveAttribute('data-lf-edit-status', 'invalid');
    await expect(flag).toHaveAttribute('data-lf-edit-message', 'Item is required');
    await expect(cell(page, 'lines', 'a', 'item').locator('[data-lf-edit-status]')).toHaveCount(0);
  });

  test('the delete button records a data row as removed', async ({ page }) => {
    await row(page, 'lines', 'b').locator('[data-lf-row-delete]').click();
    await expect(row(page, 'lines', 'b')).toHaveCount(0);
    expect(await value(page)).toEqual({ ...noChanges, removed: ['b'] });
    expect(await change(page)).toEqual({ cause: 'delete', rowKey: 'b', skipped: null });
  });

  test('onRowClick reports the index in data, and null for an added row', async ({ page }) => {
    await row(page, 'lines', 'a').locator('[data-lf-row-delete]').click();
    await cell(page, 'lines', 'c', 'id').click();
    await expect(getBlock(page, 'lines_click_value')).toHaveText('click={"rowKey":"c","index":2}');
    await getBlock(page, 'lines').locator('[data-lf-add-row]').click();
    await page.keyboard.press('Escape');
    const [added] = (await value(page)).added;
    await cell(page, 'lines', added.rowKey, 'id').click();
    await expect(getBlock(page, 'lines_click_value')).toHaveText(
      `click={"rowKey":"${added.rowKey}","index":null}`
    );
  });

  test('deleting an added row just drops it from added', async ({ page }) => {
    await getBlock(page, 'lines').locator('[data-lf-add-row]').click();
    await page.keyboard.press('Escape');
    const [added] = (await value(page)).added;
    await row(page, 'lines', added.rowKey).locator('[data-lf-row-delete]').click();
    await expect.poll(() => value(page)).toEqual(noChanges);
  });

  test('Delete on a focused row removes it and keeps focus in the table', async ({ page }) => {
    await cell(page, 'lines', 'a', 'id').click();
    await page.keyboard.press('Delete');
    await expect(row(page, 'lines', 'a')).toHaveCount(0);
    expect(await value(page)).toEqual({ ...noChanges, removed: ['a'] });
    await expect(cell(page, 'lines', 'b', 'id')).toBeFocused();
  });

  // ============================================
  // ORDER
  // ============================================

  test('dragging a row handle records the key order on drop', async ({ page }) => {
    await dragRow(page, 'lines', 'a', 'c');
    await expect.poll(() => displayKeys(page, 'lines')).toEqual(['b', 'c', 'a']);
    expect(await value(page)).toEqual({ ...noChanges, order: ['b', 'c', 'a'] });
    expect(await change(page)).toEqual({ cause: 'move', rowKey: 'a', skipped: null });
  });

  test('Alt+Shift+ArrowUp moves the focused row up', async ({ page }) => {
    await cell(page, 'lines', 'c', 'id').click();
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect.poll(() => displayKeys(page, 'lines')).toEqual(['a', 'c', 'b']);
    await expect(cell(page, 'lines', 'c', 'id')).toBeFocused();
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect.poll(() => displayKeys(page, 'lines')).toEqual(['c', 'a', 'b']);
    expect((await value(page)).order).toEqual(['c', 'a', 'b']);
  });

  test('with a position field a move records one new position', async ({ page }) => {
    await dragRow(page, 'steps', 's3', 's1');
    await expect.poll(() => displayKeys(page, 'steps')).toEqual(['s1', 's3', 's2']);
    await expect(cell(page, 'steps', 's3', 'position')).toHaveText(/^1,?536$/);
    expect(await readJson(page, 'steps_value', 'steps=')).toEqual({
      ...noChanges,
      moved: { s3: 1536 },
    });
  });

  test('a move on a later page records the order of every row', async ({ page }) => {
    await getBlock(page, 'lines_paged').locator('.ant-pagination-item-2').click();
    await expect.poll(() => displayKeys(page, 'lines_paged')).toEqual(['c', 'd']);
    await dragRow(page, 'lines_paged', 'd', 'c', { below: false });
    await expect.poll(() => displayKeys(page, 'lines_paged')).toEqual(['d', 'c']);
    expect(await readJson(page, 'lines_paged_value', 'paged=')).toEqual({
      ...noChanges,
      order: ['a', 'b', 'd', 'c', 'e'],
    });
  });

  test('a move on a later page records a position between its neighbours in the whole list', async ({
    page,
  }) => {
    await getBlock(page, 'steps_paged').locator('.ant-pagination-item-2').click();
    await expect.poll(() => displayKeys(page, 'steps_paged')).toEqual(['s3', 's4']);
    await dragRow(page, 'steps_paged', 's4', 's3', { below: false });
    await expect.poll(() => displayKeys(page, 'steps_paged')).toEqual(['s4', 's3']);
    expect(await readJson(page, 'steps_paged_value', 'steps=')).toEqual({
      ...noChanges,
      moved: { s4: 2560 },
    });
  });

  test('with pagination an added row goes after the last row of every page', async ({ page }) => {
    await getBlock(page, 'steps_paged').locator('[data-lf-add-row]').click();
    await page.keyboard.press('Escape');
    const [added] = (await readJson(page, 'steps_paged_value', 'steps=')).added;
    expect(added).toEqual({ rowKey: added.rowKey, position: 6144 });
  });

  test('with a position field an added row goes after the last row', async ({ page }) => {
    await getBlock(page, 'steps').locator('[data-lf-add-row]').click();
    await page.keyboard.press('Escape');
    const [added] = (await readJson(page, 'steps_value', 'steps=')).added;
    expect(added).toEqual({ rowKey: added.rowKey, position: 4096 });
  });

  test('row drag is disabled with a tooltip while the table is sorted', async ({ page }) => {
    const handle = row(page, 'lines_sorted', 'a').locator('[data-lf-drag-handle]');
    await expect(handle).toHaveAttribute('aria-disabled', 'true');
    await expect(handle).toHaveAttribute('title', 'Clear the sort to reorder rows.');
    await dragRow(page, 'lines_sorted', 'a', 'b', { below: false });
    expect(await readJson(page, 'lines_sorted_value', 'sorted=')).toEqual(noChanges);
  });

  // ============================================
  // CLIPBOARD, HISTORY, RESET
  // ============================================

  test('Ctrl/Cmd+V pastes TSV from the focused cell as one write and skips invalid cells', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => navigator.clipboard.writeText('Avocado\t9\nBanana\tlots\n'));
    await cell(page, 'lines', 'a', 'item').click();
    await page.keyboard.press('ControlOrMeta+v');
    await expect(cell(page, 'lines', 'b', 'item')).toHaveText('Banana');
    expect(await value(page)).toEqual({
      ...noChanges,
      updated: { a: { item: 'Avocado', qty: 9 }, b: { item: 'Banana' } },
    });
    const pasted = await change(page);
    expect(pasted.cause).toBe('paste');
    expect(pasted.skipped).toEqual([
      { rowKey: 'b', column: 'qty', text: 'lots', reason: '"lots" is not a number.' },
    ]);
    await expect(getBlock(page, 'lines').locator('.lf-table-edit-notice')).toHaveText(
      '1 pasted cell was skipped.'
    );
  });

  test('Ctrl/Cmd+C copies the focused cell', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await cell(page, 'lines', 'c', 'note').click();
    await page.keyboard.press('ControlOrMeta+c');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('aged');
  });

  test('undo and redo step through edits, deletes and moves', async ({ page }) => {
    await cell(page, 'lines', 'a', 'item').dblclick();
    await editorInput(page, 'lines').fill('Apricots');
    await page.keyboard.press('Enter');
    await row(page, 'lines', 'b').locator('[data-lf-row-delete]').click();
    await expect(row(page, 'lines', 'b')).toHaveCount(0);
    await cell(page, 'lines', 'c', 'id').click();
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect.poll(() => displayKeys(page, 'lines')).toEqual(['c', 'a']);

    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => displayKeys(page, 'lines')).toEqual(['a', 'c']);
    await cell(page, 'lines', 'a', 'id').click();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(row(page, 'lines', 'b')).toHaveCount(1);
    await cell(page, 'lines', 'a', 'id').click();
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => value(page)).toEqual(noChanges);
    expect((await change(page)).cause).toBe('undo');

    await cell(page, 'lines', 'a', 'id').click();
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(cell(page, 'lines', 'a', 'item')).toHaveText('Apricots');
    expect((await change(page)).cause).toBe('redo');
  });

  test('undo restores a paste in one step', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => navigator.clipboard.writeText('x\ny\nz'));
    await cell(page, 'lines', 'a', 'note').click();
    await page.keyboard.press('ControlOrMeta+v');
    await expect(cell(page, 'lines', 'c', 'note')).toHaveText('z');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => value(page)).toEqual(noChanges);
    await expect(cell(page, 'lines', 'c', 'note')).toHaveText('aged');
  });

  test('resetChanges drops every change and shows the data again', async ({ page }) => {
    await cell(page, 'lines', 'a', 'item').dblclick();
    await editorInput(page, 'lines').fill('Apricots');
    await page.keyboard.press('Enter');
    await row(page, 'lines', 'b').locator('[data-lf-row-delete]').click();
    await getBlock(page, 'lines_reset').locator('button').click();
    await expect.poll(() => value(page)).toEqual(noChanges);
    await expect(cell(page, 'lines', 'a', 'item')).toHaveText('Apples');
    await expect(row(page, 'lines', 'b')).toHaveCount(1);
  });
});
