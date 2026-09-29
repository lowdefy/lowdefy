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

// The toolbar renders in the table's top region as [data-lf-toolbar]; buttons carry
// data-lf-toolbar-button, quick filter chips data-lf-quick-filter. Popovers render in the body.
const toolbar = (page, blockId) => getBlock(page, blockId).locator('[data-lf-toolbar]');
const button = (page, blockId, name) =>
  toolbar(page, blockId).locator(`[data-lf-toolbar-button="${name}"]`);
const value = (page) => getBlock(page, 'tb_value');
const cell = (page, blockId, rowKey, colKey) =>
  getBlock(page, blockId).locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-col-key="${colKey}"]`
  );

async function addFromList(page, name, label) {
  await page.locator(`[data-lf-toolbar-add="${name}"]`).click();
  await page.locator('.ant-select-item-option', { hasText: label }).click();
}

test.describe('Table toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'toolbar');
    await expect(toolbar(page, 'tb')).toBeVisible();
  });

  // ============================================
  // RENDERING
  // ============================================

  test('the toolbar is off by default', async ({ page }) => {
    await expect(getBlock(page, 'tb_off').locator('.lf-table-body')).toBeVisible();
    await expect(toolbar(page, 'tb_off')).toHaveCount(0);
  });

  test('toolbar true turns on every item and shows the record count', async ({ page }) => {
    const bar = toolbar(page, 'tb_true');
    await expect(bar.locator('[data-lf-toolbar-search]')).toBeVisible();
    for (const name of ['filter', 'sort', 'columns', 'export']) {
      await expect(bar.locator(`[data-lf-toolbar-button="${name}"]`)).toBeVisible();
    }
    await expect(bar.locator('[data-lf-toolbar-density]')).toBeVisible();
    // No groupable columns: no Group button. No saved views: no tabs.
    await expect(bar.locator('[data-lf-toolbar-button="group"]')).toHaveCount(0);
    await expect(bar.locator('.lf-table-views')).toHaveCount(0);
    await expect(bar.locator('[data-lf-record-count]')).toHaveText('5 rows');
  });

  test('toolbarStart and toolbarEnd slots render their blocks in the toolbar', async ({ page }) => {
    await expect(toolbar(page, 'tb').locator('.lf-table-toolbar-start #tb_new')).toBeVisible();
    await expect(toolbar(page, 'tb').locator('.lf-table-toolbar-end #tb_end')).toHaveText(
      'end slot'
    );
  });

  test('a slot alone shows the toolbar without the record count', async ({ page }) => {
    await expect(toolbar(page, 'tb_slots').locator('#tb_slots_button')).toBeVisible();
    await expect(toolbar(page, 'tb_slots').locator('[data-lf-record-count]')).toHaveCount(0);
  });

  test('the empty slot replaces the empty state', async ({ page }) => {
    await expect(getBlock(page, 'tb_empty').locator('[data-lf-empty]')).toContainText(
      'No people yet. Add the first one.'
    );
    await expect(getBlock(page, 'tb_empty').locator('.ant-empty')).toHaveCount(0);
  });

  test('the record count shows the rows the view matches', async ({ page }) => {
    await expect(toolbar(page, 'tb').locator('[data-lf-record-count]')).toHaveText('5 rows');
  });

  // ============================================
  // SEARCH
  // ============================================

  test('search writes view.search after typing stops, and clearing removes it', async ({
    page,
  }) => {
    const input = toolbar(page, 'tb').locator('[data-lf-toolbar-search] input');
    await input.pressSequentially('ali');
    await expect(value(page)).toContainText('"search":"ali"');
    await expect(value(page)).toContainText('cause=search');
    await input.fill('');
    await expect(value(page)).toContainText('"search":null');
  });

  test('Cmd/Ctrl+F in the table focuses the search box', async ({ page }) => {
    await cell(page, 'tb', 1, 'name').click();
    await page.keyboard.press('ControlOrMeta+f');
    await expect(toolbar(page, 'tb').locator('[data-lf-toolbar-search] input')).toBeFocused();
  });

  // ============================================
  // QUICK FILTERS AND FILTER
  // ============================================

  test('an enum quick filter writes an in condition ANDed with the filter', async ({ page }) => {
    await toolbar(page, 'tb').locator('[data-lf-quick-filter="team"]').click();
    const options = page.locator('[data-lf-quick-filter-options="team"]');
    await options.getByLabel('Red').check();
    await expect(value(page)).toContainText(
      '"filter":{"and":[{"key":"age","op":"gte","value":20},{"key":"team","op":"in","value":["Red"]}]}'
    );
    await expect(value(page)).toContainText('cause=filter');
    await expect(toolbar(page, 'tb').locator('[data-lf-quick-filter="team"]')).toHaveAttribute(
      'data-active',
      ''
    );
    await expect(button(page, 'tb', 'filter').locator('xpath=..')).toContainText('2');
    await options.getByLabel('Red').uncheck();
    await expect(value(page)).toContainText(
      '"filter":{"and":[{"key":"age","op":"gte","value":20}]}'
    );
  });

  test('a quick filter on a column without options opens its column filter', async ({ page }) => {
    await toolbar(page, 'tb').locator('[data-lf-quick-filter="city"]').click();
    await expect(page.locator('[data-lf-column-filter][data-col-key="city"]')).toBeVisible();
  });

  test('the Filter button counts conditions and opens the filter builder', async ({ page }) => {
    await expect(button(page, 'tb', 'filter').locator('xpath=..')).toContainText('1');
    await button(page, 'tb', 'filter').click();
    await expect(page.locator('[data-lf-toolbar-filter] [data-lf-filter-builder]')).toBeVisible();
  });

  // ============================================
  // SORT AND GROUP
  // ============================================

  test('the Sort popover adds, flips, reorders and removes sort levels', async ({ page }) => {
    await button(page, 'tb', 'sort').click();
    const list = page.locator('[data-lf-toolbar-list="sort"]');
    await expect(list).toContainText('No sort');
    await addFromList(page, 'sort', 'Age');
    await expect(value(page)).toContainText('"sort":[{"key":"age"}]');
    await expect(value(page)).toContainText('cause=sort');
    await addFromList(page, 'sort', 'Name');
    await expect(value(page)).toContainText('"sort":[{"key":"age"},{"key":"name"}]');
    await list.locator('[data-key="age"] [data-lf-sort-direction]').getByText('Desc').click();
    await expect(value(page)).toContainText('"sort":[{"key":"age","desc":true},{"key":"name"}]');
    await expect(
      getBlock(page, 'tb').locator('[data-lf-header][data-col-key="age"]')
    ).toHaveAttribute('aria-sort', 'descending');
    await list.locator('[data-key="name"] [data-lf-action="up"]').click();
    await expect(value(page)).toContainText('"sort":[{"key":"name"},{"key":"age","desc":true}]');
    await list.locator('[data-key="name"] [data-lf-action="remove"]').click();
    await expect(value(page)).toContainText('"sort":[{"key":"age","desc":true}]');
  });

  test('the Group popover groups by groupable columns', async ({ page }) => {
    await button(page, 'tb', 'group').click();
    await addFromList(page, 'group', 'Team');
    await expect(value(page)).toContainText('"group":[{"key":"team"}]');
    await expect(value(page)).toContainText('cause=group');
    await expect(getBlock(page, 'tb').locator('.lf-table-body [data-group-key]')).toHaveCount(2);
    // Only groupable columns are offered.
    await expect(page.locator('[data-lf-toolbar-add="group"]')).toHaveCount(0);
    await page.locator('[data-lf-toolbar-list="group"] [data-lf-action="remove"]').click();
    await expect(value(page)).toContainText('"group":[]');
    await expect(getBlock(page, 'tb').locator('.lf-table-body [data-group-key]')).toHaveCount(0);
  });

  // ============================================
  // COLUMNS, DENSITY, EXPORT
  // ============================================

  test('the Columns button opens the column manager', async ({ page }) => {
    await button(page, 'tb', 'columns').click();
    await expect(page.locator('[data-lf-column-manager]')).toBeVisible();
  });

  test('the density toggle writes view.density and sets the row height', async ({ page }) => {
    await toolbar(page, 'tb').locator('[data-lf-toolbar-density]').getByText('Compact').click();
    await expect(value(page)).toContainText('"density":"compact"');
    await expect(value(page)).toContainText('cause=density');
    await expect(cell(page, 'tb', 1, 'name')).toHaveCSS('height', '32px');
    await toolbar(page, 'tb').locator('[data-lf-toolbar-density]').getByText('Comfortable').click();
    await expect(value(page)).toContainText('"density":"comfortable"');
    await expect(cell(page, 'tb', 1, 'name')).toHaveCSS('height', '52px');
  });

  test('the Export button downloads the view as CSV', async ({ page }) => {
    const download = page.waitForEvent('download');
    await button(page, 'tb', 'export').click();
    expect((await download).suggestedFilename()).toBe('tb.csv');
  });
});
