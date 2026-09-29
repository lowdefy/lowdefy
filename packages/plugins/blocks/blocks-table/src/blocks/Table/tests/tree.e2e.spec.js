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

// Tree rows: `tree.parentField` / `tree.childrenField` produce one flat list of rows with a depth
// (aria-level), an expand chevron ([data-lf-tree-toggle]) in the first data column, and the
// expanded row keys in the value's `expanded`.

const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const toggle = (page, blockId, rowKey) =>
  row(page, blockId, rowKey).locator('[data-lf-tree-toggle]');
const nameCell = (page, blockId, rowKey) =>
  row(page, blockId, rowKey).locator('[data-col-key="name"]');
const value = (page) => getBlock(page, 'tree_value');

function rowKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('.lf-table-body [data-row-key]')
    .evaluateAll((rows) => rows.map((element) => element.dataset.rowKey));
}

test.describe('Table tree', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table-tree');
    await expect(row(page, 'table_tree', 'docs')).toBeVisible();
  });

  test('shows root rows collapsed, with a chevron on rows that have children', async ({ page }) => {
    expect(await rowKeys(page, 'table_tree')).toEqual(['docs', 'blog']);
    await expect(getBlock(page, 'table_tree').locator('[role="treegrid"]')).toBeVisible();
    await expect(row(page, 'table_tree', 'docs')).toHaveAttribute('aria-level', '1');
    await expect(row(page, 'table_tree', 'docs')).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle(page, 'table_tree', 'docs')).toBeVisible();
    await expect(toggle(page, 'table_tree', 'blog')).toHaveCount(0);
    await expect(row(page, 'table_tree', 'blog')).not.toHaveAttribute('aria-expanded', /.*/);
  });

  test('expanding a row shows its children indented and writes expanded', async ({ page }) => {
    await toggle(page, 'table_tree', 'docs').click();
    expect(await rowKeys(page, 'table_tree')).toEqual(['docs', 'guides', 'api', 'blog']);
    await expect(row(page, 'table_tree', 'guides')).toHaveAttribute('aria-level', '2');
    await expect(value(page)).toHaveText('expanded=["docs"] selected=[] event=docs:open');
    const indent = await nameCell(page, 'table_tree', 'guides')
      .locator('.lf-table-tree-indent')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(indent).toBe(20);
    await toggle(page, 'table_tree', 'guides').click();
    expect(await rowKeys(page, 'table_tree')).toEqual([
      'docs',
      'guides',
      'intro',
      'setup',
      'api',
      'blog',
    ]);
    await expect(row(page, 'table_tree', 'intro')).toHaveAttribute('aria-level', '3');
    await toggle(page, 'table_tree', 'docs').click();
    expect(await rowKeys(page, 'table_tree')).toEqual(['docs', 'blog']);
    await expect(value(page)).toHaveText('expanded=["guides"] selected=[] event=docs:closed');
  });

  test('a toggle click does not fire a row click or select the row', async ({ page }) => {
    await toggle(page, 'table_tree', 'docs').click();
    await expect(row(page, 'table_tree', 'docs')).toHaveAttribute('aria-selected', 'false');
  });

  test('Right expands and Left collapses or moves to the parent row', async ({ page }) => {
    await nameCell(page, 'table_tree', 'docs').click();
    await page.keyboard.press('ArrowRight');
    await expect(row(page, 'table_tree', 'guides')).toBeVisible();
    await expect(nameCell(page, 'table_tree', 'docs')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(nameCell(page, 'table_tree', 'guides')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(nameCell(page, 'table_tree', 'docs')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(row(page, 'table_tree', 'guides')).toHaveCount(0);
    await expect(value(page)).toContainText('event=docs:closed');
    // A collapsed root row moves left as usual, onto the selection cell.
    await page.keyboard.press('ArrowLeft');
    await expect(row(page, 'table_tree', 'docs').locator('[data-lf-select-cell]')).toBeFocused();
  });

  test('cascade selects and clears a row with all its descendants', async ({ page }) => {
    await toggle(page, 'table_tree', 'docs').click();
    await toggle(page, 'table_tree', 'guides').click();
    await row(page, 'table_tree', 'docs').locator('[data-lf-select-cell] input').click();
    for (const key of ['docs', 'guides', 'intro', 'setup', 'api']) {
      await expect(row(page, 'table_tree', key)).toHaveAttribute('aria-selected', 'true');
    }
    await expect(row(page, 'table_tree', 'blog')).toHaveAttribute('aria-selected', 'false');
    await row(page, 'table_tree', 'guides').locator('[data-lf-select-cell] input').click();
    for (const key of ['guides', 'intro', 'setup']) {
      await expect(row(page, 'table_tree', key)).toHaveAttribute('aria-selected', 'false');
    }
    await expect(row(page, 'table_tree', 'api')).toHaveAttribute('aria-selected', 'true');
    await expect(value(page)).toContainText('selected=["docs","api"]');
  });

  test('sorting sorts the rows within each level', async ({ page }) => {
    await toggle(page, 'table_tree', 'docs').click();
    await toggle(page, 'table_tree', 'guides').click();
    await getBlock(page, 'table_tree').locator('[data-lf-header][data-col-key="name"]').click();
    await expect
      .poll(() => rowKeys(page, 'table_tree'))
      .toEqual(['blog', 'docs', 'api', 'guides', 'intro', 'setup']);
    await getBlock(page, 'table_tree').locator('[data-lf-header][data-col-key="size"]').click();
    await expect
      .poll(() => rowKeys(page, 'table_tree'))
      .toEqual(['blog', 'docs', 'api', 'guides', 'intro', 'setup']);
    await getBlock(page, 'table_tree').locator('[data-lf-header][data-col-key="size"]').click();
    await expect
      .poll(() => rowKeys(page, 'table_tree'))
      .toEqual(['docs', 'guides', 'setup', 'intro', 'api', 'blog']);
  });

  test('nested children rows, expanded from the value and sorted within levels', async ({
    page,
  }) => {
    await expect.poll(() => rowKeys(page, 'table_tree_nested')).toEqual(['2', '1', '12', '11']);
    await expect(row(page, 'table_tree_nested', '12')).toHaveAttribute('aria-level', '2');
    await toggle(page, 'table_tree_nested', '2').click();
    expect(await rowKeys(page, 'table_tree_nested')).toEqual(['2', '21', '1', '12', '11']);
  });

  test('lazy rows show a chevron before their children load and load them on expand', async ({
    page,
  }) => {
    await expect(toggle(page, 'table_tree_lazy', 'region-a')).toBeVisible();
    await expect(toggle(page, 'table_tree_lazy', 'region-b')).toHaveCount(0);
    await toggle(page, 'table_tree_lazy', 'region-a').click();
    await expect(row(page, 'table_tree_lazy', 'region-a-1')).toHaveAttribute('aria-level', '2');
    await expect(nameCell(page, 'table_tree_lazy', 'region-a-1')).toHaveText('Region A child');
    expect(await rowKeys(page, 'table_tree_lazy')).toEqual(['region-a', 'region-a-1', 'region-b']);
  });

  test('onRowExpand says when a lazy row needs its children, once', async ({ page }) => {
    await toggle(page, 'table_tree_lazy', 'region-a').click();
    await expect(nameCell(page, 'table_tree_lazy', 'region-a-1')).toHaveText('Region A child');
    await toggle(page, 'table_tree_lazy', 'region-a').click();
    await expect(row(page, 'table_tree_lazy', 'region-a-1')).toHaveCount(0);
    await toggle(page, 'table_tree_lazy', 'region-a').click();
    await expect(getBlock(page, 'table_tree_lazy_value')).toHaveText(
      'expands=["region-a:open:load","region-a:close:loaded","region-a:open:loaded"]'
    );
    expect(await rowKeys(page, 'table_tree_lazy')).toEqual(['region-a', 'region-a-1', 'region-b']);
  });

  test('a filter keeps the ancestors of the rows it matches', async ({ page }) => {
    await expect(row(page, 'table_tree_filtered', 'docs')).toBeVisible();
    await toggle(page, 'table_tree_filtered', 'docs').click();
    await toggle(page, 'table_tree_filtered', 'guides').click();
    expect(await rowKeys(page, 'table_tree_filtered')).toEqual(['docs', 'guides', 'setup']);
  });
});
