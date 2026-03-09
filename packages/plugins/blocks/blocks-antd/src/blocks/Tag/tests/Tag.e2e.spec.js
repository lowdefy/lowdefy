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

// Tag uses id={blockId} directly on the tag element
const getTag = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Tag Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tag');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with title', async ({ page }) => {
    const tag = getTag(page, 'tag_basic');
    await expect(tag).toBeVisible();
    await expect(tag).toHaveText('Basic Tag');
  });

  test('renders block ID when no title', async ({ page }) => {
    const tag = getTag(page, 'tag_no_title');
    await expect(tag).toBeVisible();
    await expect(tag).toHaveText('tag_no_title');
  });

  test('renders as ant-tag element', async ({ page }) => {
    const tag = getTag(page, 'tag_basic');
    await expect(tag).toHaveClass(/ant-tag/);
  });

  // ============================================
  // PROPERTY TESTS - COLORS
  // ============================================

  test('renders success color', async ({ page }) => {
    const tag = getTag(page, 'tag_color_preset');
    await expect(tag).toHaveClass(/ant-tag-success/);
  });

  test('renders warning color', async ({ page }) => {
    const tag = getTag(page, 'tag_color_warning');
    await expect(tag).toHaveClass(/ant-tag-warning/);
  });

  test('renders error color', async ({ page }) => {
    const tag = getTag(page, 'tag_color_error');
    await expect(tag).toHaveClass(/ant-tag-error/);
  });

  test('renders processing color', async ({ page }) => {
    const tag = getTag(page, 'tag_color_processing');
    await expect(tag).toHaveClass(/ant-tag-processing/);
  });

  test('renders custom color', async ({ page }) => {
    const tag = getTag(page, 'tag_color_custom');
    // Custom colors are applied via style, not class
    await expect(tag).toBeVisible();
    await expect(tag).toHaveText('Custom Color');
  });

  // ============================================
  // PROPERTY TESTS - OTHER
  // ============================================

  test('renders closable tag with close icon', async ({ page }) => {
    const tag = getTag(page, 'tag_closable');
    const closeIcon = tag.locator('.ant-tag-close-icon');
    await expect(closeIcon).toBeVisible();
  });

  test('renders with icon', async ({ page }) => {
    const tag = getTag(page, 'tag_with_icon');
    const icon = tag.locator('.anticon');
    await expect(icon).toBeVisible();
  });

  test('renders HTML in title', async ({ page }) => {
    const tag = getTag(page, 'tag_html_title');
    const bold = tag.locator('strong');
    await expect(bold).toHaveText('Bold');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires when tag is clicked', async ({ page }) => {
    const tag = getTag(page, 'tag_onclick');
    await tag.click();

    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Tag clicked');
  });

  test('onClose event fires when close icon is clicked', async ({ page }) => {
    const tag = getTag(page, 'tag_onclose');
    const closeIcon = tag.locator('.ant-tag-close-icon');
    await closeIcon.click();

    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Tag closed');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('tag is clickable when onClick event is defined', async ({ page }) => {
    const tag = getTag(page, 'tag_onclick');
    // Should have cursor pointer style (clickable)
    await expect(tag).toBeVisible();
    // Click should work without error
    await tag.click();
  });

  test('closable tag hides after close icon clicked', async ({ page }) => {
    const tag = getTag(page, 'tag_onclose');
    await expect(tag).toBeVisible();

    const closeIcon = tag.locator('.ant-tag-close-icon');
    await closeIcon.click();

    // Ant Design hides the tag after close is clicked
    await expect(tag).toBeHidden();
  });
});
