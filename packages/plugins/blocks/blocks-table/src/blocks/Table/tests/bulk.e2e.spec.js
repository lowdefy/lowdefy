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

const bar = (page) => getBlock(page, 'bk').locator('[data-lf-bulk-bar]');
const selectRow = (page, rowKey) =>
  getBlock(page, 'bk')
    .locator(`.lf-table-body [data-row-key="${rowKey}"] [data-lf-select-cell] input`)
    .click();
const cell = (page, blockId, rowKey, colKey) =>
  getBlock(page, blockId).locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-col-key="${colKey}"]`
  );
const focusedRow = (page) =>
  page.evaluate(() => document.activeElement?.closest('[data-row-key]')?.dataset.rowKey ?? null);

test.describe('Table bulk action bar', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'bulk');
    await expect(getBlock(page, 'bk').locator('.lf-table-body')).toBeVisible();
  });

  test('the select-all checkbox lines up with the row checkboxes', async ({ page }) => {
    const all = await getBlock(page, 'bk').locator('[data-lf-select-all]').boundingBox();
    const row = await getBlock(page, 'bk')
      .locator('.lf-table-body [data-lf-select-cell] input')
      .first()
      .boundingBox();
    expect(Math.abs(all.x - row.x)).toBeLessThan(0.5);
    expect(Math.abs(all.width - row.width)).toBeLessThan(0.5);
  });

  test('the bar shows while rows are selected, with the bulkActions slot', async ({ page }) => {
    await expect(bar(page)).toHaveCount(0);
    await selectRow(page, 1);
    await expect(bar(page).locator('[data-lf-bulk-count]')).toHaveText('1 selected');
    await expect(bar(page).locator('[data-lf-bulk-action="select-all"]')).toHaveText(
      'Select all 5 matching'
    );
    await expect(bar(page).locator('#bk_assign')).toBeVisible();
  });

  test('Select all matching sets { all: true, except: [], filter, search }', async ({ page }) => {
    await selectRow(page, 1);
    await bar(page).locator('[data-lf-bulk-action="select-all"]').click();
    await expect(getBlock(page, 'bk_value')).toContainText(
      'selected={"all":true,"except":[],"filter":null,"search":null}'
    );
    await expect(bar(page).locator('[data-lf-bulk-count]')).toHaveText('5 selected');
    await expect(bar(page).locator('[data-lf-bulk-action="select-all"]')).toHaveCount(0);
    await selectRow(page, 2);
    await expect(getBlock(page, 'bk_value')).toContainText(
      'selected={"all":true,"except":[2],"filter":null,"search":null}'
    );
    await expect(bar(page).locator('[data-lf-bulk-count]')).toHaveText('4 selected');
  });

  test('rows that arrive while all matching rows are selected join only if they match', async ({
    page,
  }) => {
    const filteredBar = getBlock(page, 'bk_filtered').locator('[data-lf-bulk-bar]');
    await getBlock(page, 'bk_filtered')
      .locator('.lf-table-body [data-row-key="1"] [data-lf-select-cell] input')
      .click();
    await filteredBar.locator('[data-lf-bulk-action="select-all"]').click();
    await expect(filteredBar.locator('[data-lf-bulk-count]')).toHaveText('3 selected');
    await page.locator('#bk_filtered_add').click();
    await expect(
      getBlock(page, 'bk_filtered').locator('.lf-table-body [data-row-key="6"]')
    ).toHaveAttribute('aria-selected', 'true');
    await expect(filteredBar.locator('[data-lf-bulk-count]')).toHaveText('4 selected');
  });

  test('an all matching selection records the filter and ends when the filter changes', async ({
    page,
  }) => {
    const filteredBar = getBlock(page, 'bk_filtered').locator('[data-lf-bulk-bar]');
    await getBlock(page, 'bk_filtered')
      .locator('.lf-table-body [data-row-key="1"] [data-lf-select-cell] input')
      .click();
    await filteredBar.locator('[data-lf-bulk-action="select-all"]').click();
    await expect(getBlock(page, 'bk_filtered_value')).toHaveText(
      'selected={"all":true,"except":[],"filter":{"key":"team","op":"eq","value":"Blue"},"search":null}'
    );
    await page.locator('#bk_filtered_clear_filters').click();
    await expect(getBlock(page, 'bk_filtered_value')).toHaveText('selected=[]');
    await expect(filteredBar).toHaveCount(0);
  });

  test('Clear empties the selection and hides the bar', async ({ page }) => {
    await selectRow(page, 1);
    await selectRow(page, 3);
    await bar(page).locator('[data-lf-bulk-action="clear"]').click();
    await expect(getBlock(page, 'bk_value')).toContainText('selected=[]');
    await expect(bar(page)).toHaveCount(0);
  });

  test('a bulk action block clearing the selection fires onSelectionChange', async ({ page }) => {
    await selectRow(page, 1);
    await selectRow(page, 3);
    await expect(getBlock(page, 'bk_value')).toContainText('selected=[1,3]');
    await expect(getBlock(page, 'bk_value')).toContainText('rows=2');
    await bar(page).locator('#bk_done').click();
    await expect(getBlock(page, 'bk_value')).toContainText('selected=[]');
    await expect(getBlock(page, 'bk_value')).toContainText('rows=0');
    await expect(bar(page)).toHaveCount(0);
  });

  test('bulk action blocks read the selection from state', async ({ page }) => {
    await selectRow(page, 1);
    await selectRow(page, 3);
    await bar(page).locator('#bk_assign').click();
    await expect(getBlock(page, 'bk_value')).toContainText('assigned=[1,3]');
  });
});

test.describe('Table single-key row actions', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'bulk');
    await expect(getBlock(page, 'queue').locator('.lf-table-body')).toBeVisible();
  });

  test('a key fires the focused row button and keyboard.next moves to the next row', async ({
    page,
  }) => {
    await cell(page, 'queue', 1, 'name').click();
    await page.keyboard.press('a');
    await expect(getBlock(page, 'queue_value')).toHaveText('last=archive:1:Archive:0');
    await expect.poll(() => focusedRow(page)).toBe('2');
    await page.keyboard.press('a');
    await expect(getBlock(page, 'queue_value')).toHaveText('last=archive:2:Archive:0');
    await expect.poll(() => focusedRow(page)).toBe('3');
  });

  test('menu items fire on their key with the item payload', async ({ page }) => {
    await cell(page, 'queue', 3, 'team').click();
    await page.keyboard.press('s');
    await expect(getBlock(page, 'queue_value')).toHaveText('last=snooze:3:Snooze:0');
    // The last row has no next row: focus stays.
    await expect.poll(() => focusedRow(page)).toBe('3');
  });

  test('hidden buttons and modified keys do not fire', async ({ page }) => {
    await cell(page, 'queue', 2, 'name').click();
    await page.keyboard.press('f');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Shift+A');
    await expect(getBlock(page, 'queue_value')).toHaveText('last=none');
    await cell(page, 'queue', 1, 'name').click();
    await page.keyboard.press('f');
    await expect(getBlock(page, 'queue_value')).toHaveText('last=flag:1');
  });

  test('without keyboard.next the focus stays on the row', async ({ page }) => {
    await cell(page, 'queue_stay', 1, 'name').click();
    await page.keyboard.press('a');
    await expect(getBlock(page, 'queue_stay_value')).toHaveText('last=1');
    expect(await focusedRow(page)).toBe('1');
  });
});
