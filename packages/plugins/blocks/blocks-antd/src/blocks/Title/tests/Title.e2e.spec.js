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

// Title uses id={blockId} directly on the h1/h2/etc element
const getTitle = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Title Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'title');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with content', async ({ page }) => {
    const title = getTitle(page, 'title_basic');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Basic Title');
  });

  test('renders as h1 by default', async ({ page }) => {
    const title = getTitle(page, 'title_basic');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
  });

  test('renders HTML content', async ({ page }) => {
    const title = getTitle(page, 'title_html');
    const bold = title.locator('strong');
    const italic = title.locator('em');
    await expect(bold).toHaveText('Bold');
    await expect(italic).toHaveText('italic');
  });

  // ============================================
  // LEVEL TESTS
  // ============================================

  test('renders level 1 as h1', async ({ page }) => {
    const title = getTitle(page, 'title_level1');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
  });

  test('renders level 2 as h2', async ({ page }) => {
    const title = getTitle(page, 'title_level2');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h2');
  });

  test('renders level 3 as h3', async ({ page }) => {
    const title = getTitle(page, 'title_level3');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h3');
  });

  test('renders level 4 as h4', async ({ page }) => {
    const title = getTitle(page, 'title_level4');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h4');
  });

  test('renders level 5 as h5', async ({ page }) => {
    const title = getTitle(page, 'title_level5');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h5');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with code style', async ({ page }) => {
    const title = getTitle(page, 'title_code');
    const code = title.locator('code');
    await expect(code).toBeVisible();
  });

  test('renders with italic style', async ({ page }) => {
    const title = getTitle(page, 'title_italic');
    const italic = title.locator('i');
    await expect(italic).toBeVisible();
  });

  test('renders with underline style', async ({ page }) => {
    const title = getTitle(page, 'title_underline');
    const underline = title.locator('u');
    await expect(underline).toBeVisible();
  });

  test('renders with delete (strikethrough) style', async ({ page }) => {
    const title = getTitle(page, 'title_delete');
    const del = title.locator('del');
    await expect(del).toBeVisible();
  });

  test('renders with mark (highlight) style', async ({ page }) => {
    const title = getTitle(page, 'title_mark');
    const mark = title.locator('mark');
    await expect(mark).toBeVisible();
  });

  test('renders disabled state', async ({ page }) => {
    const title = getTitle(page, 'title_disabled');
    await expect(title).toHaveClass(/ant-typography-disabled/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders secondary type', async ({ page }) => {
    const title = getTitle(page, 'title_secondary');
    await expect(title).toHaveClass(/ant-typography-secondary/);
  });

  test('renders success type', async ({ page }) => {
    const title = getTitle(page, 'title_success');
    await expect(title).toHaveClass(/ant-typography-success/);
  });

  test('renders warning type', async ({ page }) => {
    const title = getTitle(page, 'title_warning');
    await expect(title).toHaveClass(/ant-typography-warning/);
  });

  test('renders danger type', async ({ page }) => {
    const title = getTitle(page, 'title_danger');
    await expect(title).toHaveClass(/ant-typography-danger/);
  });

  // ============================================
  // COPYABLE TESTS
  // ============================================

  test('renders copy button when copyable', async ({ page }) => {
    const block = getBlock(page, 'title_copyable');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await expect(copyBtn).toBeVisible();
  });

  test('onCopy event fires when copy button clicked', async ({ page }) => {
    const block = getBlock(page, 'title_copyable_event');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await copyBtn.click();

    const display = getBlock(page, 'oncopy_display');
    await expect(display).toHaveText('Copy fired');
  });

  // ============================================
  // ELLIPSIS TESTS
  // ============================================

  test('renders with ellipsis when content overflows', async ({ page }) => {
    const title = getTitle(page, 'title_ellipsis');
    await expect(title).toBeVisible();
    // The ellipsis class is applied
    await expect(title).toHaveClass(/ant-typography-ellipsis/);
  });
});
