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

const getNode = (page, label) =>
  getPopup(page).locator('.ant-select-tree-node-content-wrapper').filter({ hasText: label });

test.describe('TreeSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'treeselector');
  });

  test('selects a node and passes its value in onChange', async ({ page }) => {
    await getSelector(page, 'tsel_basic').click();
    await getNode(page, 'Banana').click();
    await expect(getSelector(page, 'tsel_basic').locator('.ant-select-content')).toHaveText(
      'Banana'
    );
    await expect(getBlock(page, 'tsel_basic_display')).toHaveText('Value: "banana"');
  });

  test('renders a pre-populated value', async ({ page }) => {
    await expect(getSelector(page, 'tsel_with_value').locator('.ant-select-content')).toHaveText(
      'Apple'
    );
  });

  test('filters nodes by title and fires onSearch', async ({ page }) => {
    await getSelector(page, 'tsel_search').click();
    await page.keyboard.type('Ban');
    await expect(getBlock(page, 'tsel_search_display')).toHaveText('Search: Ban');
    await expect(getNode(page, 'Banana')).toBeVisible();
    await expect(getNode(page, 'Apple')).toHaveCount(0);
  });

  test('shows connecting lines with treeLine', async ({ page }) => {
    await getSelector(page, 'tsel_tree_line').click();
    await expect(getPopup(page).locator('.ant-select-tree')).toHaveClass(
      /ant-select-tree-show-line/
    );
  });

  test('expands a node by clicking its title with treeExpandAction', async ({ page }) => {
    await getSelector(page, 'tsel_expand_action').click();
    await expect(getNode(page, 'Apple')).toHaveCount(0);
    await getNode(page, 'Fruit').click();
    await expect(getNode(page, 'Apple')).toBeVisible();
  });

  test('applies placement and class.popup to the dropdown', async ({ page }) => {
    await getSelector(page, 'tsel_placement_popup').click();
    const popup = getPopup(page);
    await expect(popup).toHaveClass(/tsel-popup-tailwind/);
    await expect(popup).toHaveClass(/ant-select-dropdown-placement-topRight/);
  });

  test('renders a prefix icon inside the selector', async ({ page }) => {
    await expect(
      getSelector(page, 'tsel_prefix_icon').locator('.ant-select-prefix svg')
    ).toBeVisible();
  });

  test('shows a loading spinner while loading', async ({ page }) => {
    const selector = getSelector(page, 'tsel_loading');
    await expect(selector).toHaveClass(/ant-select-loading/);
    await expect(selector).toHaveClass(/ant-select-disabled/);
  });

  test('applies selector and tree node tokens from theme', async ({ page }) => {
    const selector = getSelector(page, 'tsel_theme');
    await expect(selector).toHaveCSS('background-color', 'rgb(255, 240, 246)');
    await selector.click();
    await getNode(page, 'Fruit').click();
    await selector.click();
    await expect(getPopup(page).locator('.ant-select-tree-node-selected')).toHaveCSS(
      'background-color',
      'rgb(255, 214, 231)'
    );
  });

  test('onOpenChange fires with the open state', async ({ page }) => {
    const display = getBlock(page, 'tsel_open_change_display');
    await getSelector(page, 'tsel_open_change').click();
    await expect(display).toHaveText('Open: true');
    await page.keyboard.press('Escape');
    await expect(display).toHaveText('Open: false');
  });

  test('style.selector is forwarded to .ant-select-content', async ({ page }) => {
    await expect(getSelector(page, 'tsel_selector_css').locator('.ant-select-content')).toHaveCSS(
      'padding',
      '12px'
    );
  });
});
