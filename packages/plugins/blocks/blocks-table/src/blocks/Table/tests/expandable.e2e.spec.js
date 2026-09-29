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

// Expandable rows: a chevron ([data-lf-expand-toggle]) in the first data column opens a detail
// row ([data-detail-for="<rowKey>"]) with the `expandable.template` HTML, as high as its content.

const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const toggle = (page, blockId, rowKey) =>
  row(page, blockId, rowKey).locator('[data-lf-expand-toggle]');
const detail = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-detail-for="${rowKey}"]`);
const scroller = (page, blockId) => getBlock(page, blockId).locator('.lf-table-scroller');

test.describe('Table expandable rows', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table-expandable');
    await expect(row(page, 'table_expandable', '1')).toBeVisible();
  });

  test('only rows that rowExpandable allows get a chevron', async ({ page }) => {
    await expect(toggle(page, 'table_expandable', '1')).toBeVisible();
    await expect(toggle(page, 'table_expandable', '2')).toBeVisible();
    await expect(toggle(page, 'table_expandable', '3')).toHaveCount(0);
    await expect(row(page, 'table_expandable', '3')).not.toHaveAttribute('aria-expanded', /.*/);
    await expect(row(page, 'table_expandable', '1')).toHaveAttribute('aria-expanded', 'false');
  });

  test('expanding a row renders its template below it and writes expanded', async ({ page }) => {
    await toggle(page, 'table_expandable', '1').click();
    await expect(detail(page, 'table_expandable', '1')).toContainText(
      'Ada Wrote the first program.'
    );
    await expect(row(page, 'table_expandable', '1')).toHaveAttribute('aria-expanded', 'true');
    await expect(getBlock(page, 'expandable_value')).toHaveText('expanded=[1] event=[1,true]');
    const order = await getBlock(page, 'table_expandable')
      .locator('.lf-table-body [role="row"]')
      .evaluateAll((rows) => rows.map((element) => element.dataset.rowKey ?? 'detail'));
    expect(order).toEqual(['1', 'detail', '2', '3']);
    // The row below the detail row sits below the detail content.
    const detailBox = await detail(page, 'table_expandable', '1').boundingBox();
    const nextBox = await row(page, 'table_expandable', '2').boundingBox();
    expect(Math.round(nextBox.y)).toBe(Math.round(detailBox.y + detailBox.height));
    await toggle(page, 'table_expandable', '1').click();
    await expect(detail(page, 'table_expandable', '1')).toHaveCount(0);
    await expect(getBlock(page, 'expandable_value')).toHaveText('expanded=[] event=[1,false]');
  });

  test('the template escapes row values', async ({ page }) => {
    await toggle(page, 'table_expandable', '2').click();
    await expect(detail(page, 'table_expandable', '2').locator('.notes')).toHaveText(
      '<b>Not bold</b>'
    );
    await expect(detail(page, 'table_expandable', '2').locator('b')).toHaveCount(0);
  });

  test('a measured detail row keeps the virtual window in place', async ({ page }) => {
    await toggle(page, 'table_expandable_virtual', '0').click();
    await expect(detail(page, 'table_expandable_virtual', '0')).toContainText('Details of Row 0');
    const height = await getBlock(page, 'table_expandable_virtual')
      .locator('.lf-table-body')
      .evaluate((element) => element.getBoundingClientRect().height);
    const detailHeight = await detail(page, 'table_expandable_virtual', '0').evaluate(
      (element) => element.getBoundingClientRect().height
    );
    expect(detailHeight).toBeGreaterThan(300);
    expect(height).toBeCloseTo(1000 * 40 + detailHeight, 0);
    await scroller(page, 'table_expandable_virtual').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(row(page, 'table_expandable_virtual', '999')).toBeInViewport();
    await scroller(page, 'table_expandable_virtual').evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect(row(page, 'table_expandable_virtual', '1')).toBeVisible();
    const detailBox = await detail(page, 'table_expandable_virtual', '0').boundingBox();
    const nextBox = await row(page, 'table_expandable_virtual', '1').boundingBox();
    expect(Math.round(nextBox.y)).toBe(Math.round(detailBox.y + detailBox.height));
  });
});
