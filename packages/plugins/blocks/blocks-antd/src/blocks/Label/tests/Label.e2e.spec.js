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

// Label block has id={blockId} on the Row wrapper
// Note: When nesting TextInput inside Label, there are two label elements
// (one from Label block, one from TextInput's internal Label wrapper)
// Use .first() to target the outer Label's elements
const getLabel = (page, blockId) => page.locator(`#${blockId}`);
const getLabelTitle = (page, blockId) => getLabel(page, blockId).locator('label').first();

test.describe('Label Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'label');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders label with title', async ({ page }) => {
    const block = getBlock(page, 'label_basic');
    await expect(block).toBeVisible();

    const label = getLabelTitle(page, 'label_basic');
    await expect(label).toContainText('Basic Label');
  });

  test('uses blockId as label when no title provided', async ({ page }) => {
    const block = getBlock(page, 'label_no_title');
    await expect(block).toBeVisible();

    // When no title is provided, Label uses blockId as the label text
    const label = getLabelTitle(page, 'label_no_title');
    await expect(label).toContainText('label_no_title');
  });

  // ============================================
  // COLON TESTS
  // ============================================

  test('renders colon after label by default', async ({ page }) => {
    const label = getLabelTitle(page, 'label_with_colon');
    await expect(label).toBeVisible();

    // Colon is rendered by default - check label does NOT have no-colon class
    await expect(label).not.toHaveClass(/ant-form-item-no-colon/);
  });

  test('renders without colon when colon is false', async ({ page }) => {
    const label = getLabelTitle(page, 'label_no_colon');
    await expect(label).toBeVisible();

    // No-colon class is on the label element itself
    await expect(label).toHaveClass(/ant-form-item-no-colon/);
  });

  // ============================================
  // DISABLED TEST
  // ============================================

  test('does not render label when disabled', async ({ page }) => {
    const block = getBlock(page, 'label_disabled');
    await expect(block).toBeVisible();

    // When disabled, Label doesn't render the outer label element
    // Only the nested content's label (from TextInput) should be present
    // Check the outer Label's element count is 0 by checking for title attribute
    const outerLabel = getLabel(page, 'label_disabled').locator(
      'label[title="This Should Not Appear"]'
    );
    await expect(outerLabel).toHaveCount(0);
  });

  // ============================================
  // EXTRA TEXT TESTS
  // ============================================

  test('renders extra text below content', async ({ page }) => {
    const block = getBlock(page, 'label_with_extra');
    await expect(block).toBeVisible();

    // Extra text should be visible
    const extra = getLabel(page, 'label_with_extra').locator('.ant-form-item-extra').first();
    await expect(extra).toContainText('This is helpful extra text');
  });

  test('renders extra text with HTML', async ({ page }) => {
    const extra = getLabel(page, 'label_extra_html').locator('.ant-form-item-extra').first();
    await expect(extra).toBeVisible();

    // Check for bold element
    const bold = extra.locator('strong');
    await expect(bold).toHaveText('Bold');
  });

  // ============================================
  // INLINE LAYOUT TESTS
  // ============================================

  test('renders inline layout', async ({ page }) => {
    const label = getLabel(page, 'label_inline');
    await expect(label).toBeVisible();

    // Inline layout uses ant-row with horizontal arrangement
    await expect(label).toHaveClass(/ant-row/);

    // Label and input should be in columns
    const labelCol = label.locator('.ant-col').first();
    await expect(labelCol).toBeVisible();
  });

  // ============================================
  // ALIGN TESTS
  // ============================================

  test('renders left aligned label', async ({ page }) => {
    const labelCol = getLabel(page, 'label_align_left').locator('.ant-form-item-label').first();
    await expect(labelCol).toBeVisible();
    await expect(labelCol).toHaveClass(/ant-form-item-label-left/);
  });

  test('renders right aligned label', async ({ page }) => {
    const labelCol = getLabel(page, 'label_align_right').locator('.ant-form-item-label').first();
    await expect(labelCol).toBeVisible();

    // Right alignment is specified, so left class should NOT be present
    await expect(labelCol).not.toHaveClass(/ant-form-item-label-left/);
  });

  // ============================================
  // SIZE TESTS
  // ============================================

  test('renders small size', async ({ page }) => {
    const label = getLabel(page, 'label_size_small');
    await expect(label).toBeVisible();

    // The nested input should be small
    const input = label.locator('.ant-input');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  test('renders default size', async ({ page }) => {
    const label = getLabel(page, 'label_size_default');
    await expect(label).toBeVisible();

    // Default size input has no size modifier class
    const input = label.locator('.ant-input');
    await expect(input).not.toHaveClass(/ant-input-sm/);
    await expect(input).not.toHaveClass(/ant-input-lg/);
  });

  test('renders large size', async ({ page }) => {
    const label = getLabel(page, 'label_size_large');
    await expect(label).toBeVisible();

    // The nested input should be large
    const input = label.locator('.ant-input');
    await expect(input).toHaveClass(/ant-input-lg/);
  });

  // ============================================
  // TITLE WITH HTML
  // ============================================

  test('renders title with HTML', async ({ page }) => {
    const label = getLabelTitle(page, 'label_html_title');
    await expect(label).toBeVisible();

    // Check for italic element
    const italic = label.locator('em');
    await expect(italic).toHaveText('Italic');
  });

  // ============================================
  // REQUIRED INDICATOR
  // ============================================

  test('renders required indicator', async ({ page }) => {
    const label = getLabel(page, 'label_required');
    await expect(label).toBeVisible();

    // Required class is on the label element itself, not the wrapper
    const labelElement = getLabelTitle(page, 'label_required');
    await expect(labelElement).toHaveClass(/ant-form-item-required/);
  });

  // ============================================
  // CONTENT AREA TEST
  // ============================================

  test('renders nested content blocks', async ({ page }) => {
    const label = getLabel(page, 'label_with_content');
    await expect(label).toBeVisible();

    // Check nested span content is rendered
    const content = getBlock(page, 'nested_content');
    await expect(content).toContainText('Nested content block');
  });

  test('label htmlFor points to correct input', async ({ page }) => {
    const label = getLabelTitle(page, 'label_basic');
    // The outer Label's label element points to the nested input
    await expect(label).toHaveAttribute('for', 'label_basic_input');
  });
});
