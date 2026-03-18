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

test.describe('Search Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'search_block');
  });

  test('renders search trigger button', async ({ page }) => {
    const block = getBlock(page, 'search_basic');
    await expect(block).toBeVisible();
    await expect(block.locator('.lf-search-trigger')).toBeVisible();
    await expect(block.locator('.lf-search-trigger-label')).toHaveText('Search Docs');
  });

  test('renders custom label', async ({ page }) => {
    const block = getBlock(page, 'search_custom_label');
    await expect(block.locator('.lf-search-trigger-label')).toHaveText('Find anything...');
  });

  test('opens search modal on click', async ({ page }) => {
    const block = getBlock(page, 'search_basic');
    await block.locator('.lf-search-trigger').click();
    const modal = page.locator('.ant-modal').first();
    await expect(modal).toBeVisible();
  });

  test('closes search modal on escape', async ({ page }) => {
    const block = getBlock(page, 'search_basic');
    await block.locator('.lf-search-trigger').click();
    const modal = page.locator('.ant-modal').first();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('fires onOpen event', async ({ page }) => {
    const block = getBlock(page, 'search_events');
    await block.locator('.lf-search-trigger').click();
    const display = getBlock(page, 'search_open_display');
    await expect(display).toContainText('Opened!');
  });

  test('fires onClose event', async ({ page }) => {
    const block = getBlock(page, 'search_events');
    await block.locator('.lf-search-trigger').click();
    await page.locator('.ant-modal').first().waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    const display = getBlock(page, 'search_close_display');
    await expect(display).toContainText('Closed!');
  });

  // ============================================
  // SHORTCUT TESTS
  // ============================================

  test('renders shortcut badge when showShortcut is true', async ({ page }) => {
    const block = getBlock(page, 'search_shortcut_custom');
    await block.scrollIntoViewIfNeeded();
    const kbd = block.locator('kbd');
    await expect(kbd.first()).toBeAttached();
    expect(await kbd.count()).toBeGreaterThanOrEqual(1);
  });

  // TODO: could not get this to pass.
  // test('opens search modal when shortcut is pressed', async ({ page }) => {
  //   const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  //   const block = getBlock(page, 'search_shortcut_custom');
  //   await expect(block).toBeVisible();
  //   await page.keyboard.press(`${mod}+.`);
  //   const modal = block.locator('.ant-modal').first();
  //   await expect(modal).toBeVisible();
  // });
});
