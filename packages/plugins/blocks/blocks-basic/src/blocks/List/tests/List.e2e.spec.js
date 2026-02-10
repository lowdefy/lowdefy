/*
  Copyright 2020-2024 Lowdefy, Inc

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

// List block renders a Box inside the BlockLayout wrapper.
// The Box has the blockId and receives the flex/style properties.
// Structure: #bl-{blockId} (wrapper) > #{blockId} (styled Box)
const getListContainer = (page, blockId) => page.locator(`#${blockId}`);

test.describe('List Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'list');
  });

  test('renders list with items from state', async ({ page }) => {
    const wrapper = getBlock(page, 'list_basic');
    await expect(wrapper).toBeAttached();

    // Check that all 3 items are rendered
    const items = wrapper.locator('[id^="bl-list_basic_item"]');
    await expect(items).toHaveCount(3);

    // Verify item content
    await expect(items.nth(0)).toHaveText('Item 1');
    await expect(items.nth(1)).toHaveText('Item 2');
    await expect(items.nth(2)).toHaveText('Item 3');
  });

  test('renders empty list when state array is undefined', async ({ page }) => {
    const wrapper = getBlock(page, 'list_empty');
    await expect(wrapper).toBeAttached();

    // No items should be rendered
    const items = wrapper.locator('[id^="bl-list_empty_item"]');
    await expect(items).toHaveCount(0);
  });

  test('applies direction row with flexbox', async ({ page }) => {
    // Target the inner Box element which has the flex styles
    const container = getListContainer(page, 'list_direction_row');
    await expect(container).toHaveCSS('display', 'flex');
    await expect(container).toHaveCSS('flex-direction', 'row');
  });

  test('applies direction column with flexbox', async ({ page }) => {
    const container = getListContainer(page, 'list_direction_column');
    await expect(container).toHaveCSS('display', 'flex');
    await expect(container).toHaveCSS('flex-direction', 'column');
  });

  test('applies custom style', async ({ page }) => {
    const container = getListContainer(page, 'list_styled');
    await expect(container).toHaveCSS('background-color', 'rgb(240, 240, 240)');
    await expect(container).toHaveCSS('padding', '10px');
  });

  test('applies wrap nowrap property', async ({ page }) => {
    const container = getListContainer(page, 'list_wrap');
    await expect(container).toHaveCSS('flex-wrap', 'nowrap');
  });

  test('applies scroll property with overflow auto', async ({ page }) => {
    const container = getListContainer(page, 'list_scroll');
    await expect(container).toHaveCSS('overflow', 'auto');
  });

  test('onClick event fires and updates state', async ({ page }) => {
    const wrapper = getBlock(page, 'list_clickable');
    await wrapper.click();

    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('List clicked!');
  });
});
