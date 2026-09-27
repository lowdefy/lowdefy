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
import { escapeId } from '@lowdefy/e2e-utils';

const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${escapeId(blockId)}_input)`);

const getPopup = (page) => page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');

const getTreeNode = (page, label) =>
  getPopup(page).locator('.ant-select-tree-treenode').filter({ hasText: label });

test.describe('TreeMultipleSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'treemultipleselector');
  });

  test('selects several nodes and passes the values in onChange', async ({ page }) => {
    await getSelector(page, 'tms_basic').click();
    await getTreeNode(page, 'Apple').locator('.ant-select-tree-node-content-wrapper').click();
    await getTreeNode(page, 'Banana').locator('.ant-select-tree-node-content-wrapper').click();
    await expect(getBlock(page, 'tms_basic_display')).toHaveText(
      /Value: \[\s*"apple",\s*"banana"\s*\]/
    );
  });

  test('disables the remaining nodes once maxCount is reached', async ({ page }) => {
    await getSelector(page, 'tms_max_count').click();
    await getTreeNode(page, 'Apple').locator('.ant-select-tree-node-content-wrapper').click();
    await expect(getTreeNode(page, 'Banana')).toHaveClass(/ant-select-tree-treenode-disabled/);
  });

  test('collapses overflowing tags with maxTagCount responsive', async ({ page }) => {
    const rest = getSelector(page, 'tms_responsive').locator('.ant-select-content-item-rest');
    await expect(rest).toBeVisible();
    await expect(rest).toContainText('+');
  });

  test('checks a parent without its children with checkStrictly', async ({ page }) => {
    await getSelector(page, 'tms_check_strictly').click();
    await getTreeNode(page, 'Fruit').locator('.ant-select-tree-checkbox').first().click();
    await expect(getBlock(page, 'tms_strict_display')).toHaveText(/Strict: \[\s*"fruit"\s*\]/);
    await expect(
      getTreeNode(page, 'Apple').locator('.ant-select-tree-checkbox').first()
    ).not.toHaveClass(/ant-select-tree-checkbox-checked/);
  });

  test('renders a checkStrictly value and adds to it', async ({ page }) => {
    const selector = getSelector(page, 'tms_strict_value');
    await expect(selector.locator('.ant-select-selection-item')).toHaveText(['Fruit']);
    await selector.click();
    await expect(
      getTreeNode(page, 'Fruit').locator('.ant-select-tree-checkbox').first()
    ).toHaveClass(/ant-select-tree-checkbox-checked/);
    await expect(
      getTreeNode(page, 'Apple').locator('.ant-select-tree-checkbox').first()
    ).not.toHaveClass(/ant-select-tree-checkbox-checked/);
    await getTreeNode(page, 'Apple').locator('.ant-select-tree-checkbox').first().click();
    await expect(getBlock(page, 'tms_strict_value_display')).toHaveText(
      /Strict value: \[\s*"fruit",\s*"apple"\s*\]/
    );
  });

  test('renders a custom removeIcon on each tag', async ({ page }) => {
    const selector = getSelector(page, 'tms_remove_icon');
    const remove = selector.locator('.ant-select-selection-item-remove');
    await expect(remove.locator('svg')).toBeVisible();
    await remove.click();
    await expect(selector.locator('.ant-select-selection-item')).toHaveCount(0);
  });
});
