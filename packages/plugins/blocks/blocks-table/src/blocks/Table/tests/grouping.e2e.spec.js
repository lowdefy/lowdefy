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

// Grouped tables render one flat list: group header rows carry data-group-key (JSON of the value
// path), data-group-label and aria-expanded; data rows carry data-row-key. The sticky group
// header is a copy of a header row inside [data-lf-group-sticky].
const scroller = (page, blockId) => getBlock(page, blockId).locator('.lf-table-scroller');
const bodyRows = (page, blockId) => getBlock(page, blockId).locator('.lf-table-body [role="row"]');
const groupRow = (page, blockId, key) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-group-key='${key}']`);
const dataRow = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const aggregate = (page, blockId, key, colKey) =>
  groupRow(page, blockId, key).locator(
    `[data-col-key="${colKey}"] .lf-table-group-aggregate-value`
  );
const groupCount = (page, blockId, key) =>
  groupRow(page, blockId, key).locator('.lf-table-group-count');
const groupCheckbox = (page, blockId, key) =>
  groupRow(page, blockId, key).locator('[data-lf-group-select] input');
const sticky = (page, blockId) =>
  getBlock(page, blockId).locator('[data-lf-group-sticky] [data-group-key]');

// The display list as `g<depth>:<label>` for group headers and `r:<rowKey>` for rows.
function listOrder(page, blockId) {
  return bodyRows(page, blockId).evaluateAll((rows) =>
    rows.map((row) =>
      row.dataset.groupKey
        ? `g${row.dataset.groupDepth}:${row.dataset.groupLabel}`
        : `r:${row.dataset.rowKey}`
    )
  );
}

async function scrollTo(page, blockId, top) {
  await scroller(page, blockId).evaluate((element, value) => {
    element.scrollTop = value;
  }, top);
}

test.describe('Table grouping', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'grouping');
    await expect(groupRow(page, 'group_single', '["EMEA"]')).toBeVisible();
  });

  // ============================================
  // ONE LEVEL
  // ============================================

  test('groups rows by one column in first-appearance order with the empty group last', async ({
    page,
  }) => {
    await expect
      .poll(() => listOrder(page, 'group_single'))
      .toEqual([
        'g0:EMEA',
        'r:1',
        'r:3',
        'r:5',
        'g0:APAC',
        'r:2',
        'r:6',
        'g0:AMER',
        'r:4',
        'g0:(Empty)',
        'r:7',
        'r:8',
      ]);
    // 12 list rows, the header row and the summary footer (amount declares `aggregate: sum`).
    await expect(getBlock(page, 'group_single').locator('[role="grid"]')).toHaveAttribute(
      'aria-rowcount',
      '14'
    );
    await expect(groupRow(page, 'group_single', '[null]')).toHaveAttribute(
      'data-group-label',
      '(Empty)'
    );
    await expect(
      groupRow(page, 'group_single', '[null]').locator('.lf-table-group-value')
    ).toHaveText('(Empty)');
  });

  test('group headers show counts and aggregates under their columns', async ({ page }) => {
    await expect(groupCount(page, 'group_single', '["EMEA"]')).toHaveText('3');
    await expect(groupCount(page, 'group_single', '["APAC"]')).toHaveText('2');
    await expect(groupCount(page, 'group_single', '["AMER"]')).toHaveText('1');
    await expect(groupCount(page, 'group_single', '[null]')).toHaveText('2');
    // amount: the column's own aggregate (sum).
    await expect(aggregate(page, 'group_single', '["EMEA"]', 'amount')).toHaveText('900');
    await expect(aggregate(page, 'group_single', '[null]', 'amount')).toHaveText('1,500');
    // margin: the view's aggregate (avg); row 8 has no margin.
    await expect(aggregate(page, 'group_single', '["EMEA"]', 'margin')).toHaveText('30');
    await expect(aggregate(page, 'group_single', '["APAC"]', 'margin')).toHaveText('40');
    await expect(aggregate(page, 'group_single', '[null]', 'margin')).toHaveText('70');
    await expect(
      groupRow(page, 'group_single', '["EMEA"]').locator(
        '[data-col-key="amount"] .lf-table-group-aggregate-fn'
      )
    ).toHaveText('Sum');
    const amountHeader = await getBlock(page, 'group_single')
      .locator('[data-lf-header][data-col-key="amount"]')
      .boundingBox();
    const amountCell = await groupRow(page, 'group_single', '["EMEA"]')
      .locator('[data-col-key="amount"]')
      .boundingBox();
    expect(amountCell.x).toBe(amountHeader.x);
    expect(amountCell.width).toBe(amountHeader.width);
  });

  test('clicking a group header collapses and expands it and writes the value', async ({
    page,
  }) => {
    const emea = groupRow(page, 'group_single', '["EMEA"]');
    await emea.click();
    await expect(emea).toHaveAttribute('aria-expanded', 'false');
    await expect(dataRow(page, 'group_single', 1)).toHaveCount(0);
    await expect(dataRow(page, 'group_single', 5)).toHaveCount(0);
    await expect(getBlock(page, 'group_single_value')).toHaveText(
      'group=[{"key":"region"}] collapsed=["[\\"EMEA\\"]"] cause=expand'
    );
    await emea.click();
    await expect(emea).toHaveAttribute('aria-expanded', 'true');
    await expect(dataRow(page, 'group_single', 1)).toBeVisible();
    await expect(getBlock(page, 'group_single_value')).toHaveText(
      'group=[{"key":"region"}] collapsed=[] cause=expand'
    );
  });

  test('collapsed groups set from outside apply to the table', async ({ page }) => {
    await page.locator('#group_single_collapse_apac').click();
    await expect(groupRow(page, 'group_single', '["APAC"]')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(dataRow(page, 'group_single', 2)).toHaveCount(0);
    await expect(dataRow(page, 'group_single', 1)).toBeVisible();
  });

  test('group header keys work with keyboard: false', async ({ page }) => {
    const emea = groupRow(page, 'group_nokeys', '["EMEA"]');
    await emea.locator('[data-col-key="margin"]').focus();
    await page.keyboard.press('Enter');
    await expect(emea).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(emea).toHaveAttribute('aria-expanded', 'true');
  });

  test('keyboard: Enter toggles, Right expands and Left collapses a focused group', async ({
    page,
  }) => {
    const emea = groupRow(page, 'group_single', '["EMEA"]');
    await emea.locator('[data-col-key="margin"]').focus();
    await page.keyboard.press('Enter');
    await expect(emea).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(emea).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(emea).toHaveAttribute('aria-expanded', 'false');
    // Left on a collapsed group moves between cells as usual.
    await page.keyboard.press('ArrowLeft');
    await expect(emea).toHaveAttribute('aria-expanded', 'false');
    await expect
      .poll(() => page.evaluate(() => document.activeElement.dataset.colKey))
      .toBe('amount');
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement.closest('[data-group-key]')?.dataset.groupKey)
      )
      .toBe('["APAC"]');
  });

  // ============================================
  // TWO LEVELS
  // ============================================

  test('groups by two columns with nested counts, aggregates and collapsed groups', async ({
    page,
  }) => {
    await expect
      .poll(() => listOrder(page, 'group_two'))
      .toEqual([
        'g0:EMEA',
        'g1:Ada',
        'r:1',
        'r:5',
        'g1:Grace',
        'r:3',
        'g0:APAC',
        'g0:AMER',
        'g1:Alan',
        'r:4',
        'g0:(Empty)',
        'g1:Alan',
        'r:7',
        'g1:Grace',
        'r:8',
      ]);
    await expect(groupCount(page, 'group_two', '["EMEA"]')).toHaveText('3');
    await expect(groupCount(page, 'group_two', '["EMEA","Ada"]')).toHaveText('2');
    await expect(aggregate(page, 'group_two', '["EMEA","Ada"]', 'amount')).toHaveText('600');
    await expect(aggregate(page, 'group_two', '[null,"Grace"]', 'amount')).toHaveText('800');
    await expect(groupRow(page, 'group_two', '["APAC"]')).toHaveAttribute('aria-expanded', 'false');
    await groupRow(page, 'group_two', '["APAC"]').click();
    await expect(groupRow(page, 'group_two', '["APAC","Ken"]')).toBeVisible();
    await expect(groupCount(page, 'group_two', '["APAC","Ken"]')).toHaveText('2');
  });

  // ============================================
  // ORDER
  // ============================================

  test('enum columns group in option order with option labels', async ({ page }) => {
    await expect
      .poll(() => listOrder(page, 'group_enum'))
      .toEqual([
        'g0:Lead',
        'r:2',
        'r:4',
        'r:5',
        'g0:Qualified',
        'r:3',
        'r:7',
        'g0:Won',
        'r:1',
        'r:6',
        'r:8',
      ]);
    await expect(groupRow(page, 'group_enum', '["qualified"]')).toHaveAttribute(
      'data-group-label',
      'Qualified'
    );
  });

  test('groups follow the sort on their column and rows keep the sort within groups', async ({
    page,
  }) => {
    await expect
      .poll(() => listOrder(page, 'group_sorted'))
      .toEqual([
        'g0:AMER',
        'r:4',
        'g0:APAC',
        'r:6',
        'r:2',
        'g0:EMEA',
        'r:5',
        'r:3',
        'r:1',
        'g0:(Empty)',
        'r:8',
        'r:7',
      ]);
    await getBlock(page, 'group_sorted').locator('[data-lf-header][data-col-key="region"]').click();
    await expect
      .poll(async () => (await listOrder(page, 'group_sorted')).filter((e) => e.startsWith('g')))
      .toEqual(['g0:EMEA', 'g0:APAC', 'g0:AMER', 'g0:(Empty)']);
  });

  // ============================================
  // SELECTION
  // ============================================

  test('a group checkbox selects and clears the rows of its group', async ({ page }) => {
    await groupCheckbox(page, 'group_select', '["EMEA"]').click();
    await expect(getBlock(page, 'group_select_value')).toHaveText('selected=[1,3,5]');
    await expect(groupCheckbox(page, 'group_select', '["EMEA"]')).toBeChecked();
    await expect(dataRow(page, 'group_select', 3)).toHaveAttribute('aria-selected', 'true');
    await expect(groupRow(page, 'group_select', '["EMEA"]')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await dataRow(page, 'group_select', 2).locator('[data-lf-select-cell] input').click();
    await expect(getBlock(page, 'group_select_value')).toHaveText('selected=[1,2,3,5]');
    await expect
      .poll(() =>
        groupCheckbox(page, 'group_select', '["APAC"]').evaluate((input) => input.indeterminate)
      )
      .toBe(true);
    await groupCheckbox(page, 'group_select', '["EMEA"]').click();
    await expect(getBlock(page, 'group_select_value')).toHaveText('selected=[2]');
    await expect(groupCheckbox(page, 'group_select', '["EMEA"]')).not.toBeChecked();
  });

  // ============================================
  // METHODS
  // ============================================

  test('setGroup, collapseAllGroups and expandAllGroups drive the grouping', async ({ page }) => {
    await expect(bodyRows(page, 'group_methods')).toHaveCount(8);
    await page.locator('#group_by_region_rep').click();
    await expect(getBlock(page, 'group_methods_value')).toHaveText(
      'group=[{"key":"region"},{"key":"rep"}] collapsed=[] cause=group'
    );
    await expect(bodyRows(page, 'group_methods')).toHaveCount(18);
    await page.locator('#group_collapse_all').click();
    await expect(bodyRows(page, 'group_methods')).toHaveCount(4);
    await expect(getBlock(page, 'group_methods_value')).toContainText('"[\\"EMEA\\",\\"Ada\\"]"');
    await page.locator('#group_expand_all').click();
    await expect(bodyRows(page, 'group_methods')).toHaveCount(18);
    await expect(getBlock(page, 'group_methods_value')).toContainText('collapsed=[]');
    await page.locator('#group_remove').click();
    await expect(bodyRows(page, 'group_methods')).toHaveCount(8);
    await expect(getBlock(page, 'group_methods_value')).toContainText('group=[] collapsed=[]');
  });

  // ============================================
  // STICKY GROUP HEADER
  // ============================================

  test('one sticky header shows the current group and is pushed up by the next', async ({
    page,
  }) => {
    const block = getBlock(page, 'group_sticky');
    await block.scrollIntoViewIfNeeded();
    await expect(sticky(page, 'group_sticky')).toHaveCount(0);
    // 40px rows: B00 is list index 0, B01 index 31, B02 index 62.
    await scrollTo(page, 'group_sticky', 210);
    await expect(sticky(page, 'group_sticky')).toHaveAttribute('data-group-key', '["B00"]');
    await expect(block.locator('[data-lf-group-sticky]')).toHaveCount(1);
    const headerBox = await block.locator('.lf-table-header').boundingBox();
    const stickyBox = await sticky(page, 'group_sticky').boundingBox();
    expect(Math.round(stickyBox.y)).toBe(Math.round(headerBox.y + headerBox.height));

    await scrollTo(page, 'group_sticky', 31 * 40 - 20);
    await expect(block.locator('.lf-table-group-sticky-shift')).toHaveAttribute(
      'style',
      /translateY\(-20px\)/
    );
    await expect(sticky(page, 'group_sticky')).toHaveAttribute('data-group-key', '["B00"]');

    await scrollTo(page, 'group_sticky', 31 * 40 + 5);
    await expect(sticky(page, 'group_sticky')).toHaveAttribute('data-group-key', '["B01"]');
    await expect(block.locator('.lf-table-group-sticky-shift')).toHaveAttribute(
      'style',
      /translateY\(0px\)/
    );

    // Clicking the sticky header collapses its group and brings the group's own header back.
    await sticky(page, 'group_sticky').click();
    await expect(groupRow(page, 'group_sticky', '["B01"]')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(groupRow(page, 'group_sticky', '["B01"]')).toBeInViewport();
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement.closest('[data-group-key]')?.dataset.groupKey)
      )
      .toBe('["B01"]');

    await scrollTo(page, 'group_sticky', 0);
    await expect(sticky(page, 'group_sticky')).toHaveCount(0);
  });
});
