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

// Helper to get the textarea element (textarea has id={blockId}_input)
const getTextArea = (page, blockId) => page.locator(`#${blockId}_input`);

test.describe('TextArea Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'textarea');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'textarea_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic TextArea');
  });

  test('renders as textarea element', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_basic');
    await expect(textarea).toBeVisible();
    // Verify it's a textarea tag
    const tagName = await textarea.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('textarea');
  });

  test('renders with initial value', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_with_value');
    await expect(textarea).toHaveValue('Initial multiline text');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with placeholder', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_placeholder');
    await expect(textarea).toHaveAttribute('placeholder', 'Enter your message here');
  });

  test('renders disabled state', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_disabled');
    await expect(textarea).toBeDisabled();
  });

  test('renders borderless style', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_borderless');
    await expect(textarea).toHaveClass(/ant-input-borderless/);
  });

  test('renders with allowClear and clears on click', async ({ page }) => {
    const block = getBlock(page, 'textarea_allowclear');
    const textarea = getTextArea(page, 'textarea_allowclear');

    // Should have initial value
    await expect(textarea).toHaveValue('Clear this text');

    // Hover to reveal clear button
    await block.hover();
    const clearBtn = block.locator('.ant-input-clear-icon');
    await clearBtn.click();

    // Value should be cleared
    await expect(textarea).toHaveValue('');
  });

  test('renders with maxLength configured', async ({ page }) => {
    // maxLength is enforced at component level, not as HTML attribute
    const textarea = getTextArea(page, 'textarea_maxlength');
    await expect(textarea).toBeVisible();
    // Try typing more than maxLength - Ant Design enforces at component level
    await textarea.fill('a'.repeat(150));
    const value = await textarea.inputValue();
    // Value should be truncated to maxLength (100)
    expect(value.length).toBeLessThanOrEqual(100);
  });

  test('shows character count', async ({ page }) => {
    const block = getBlock(page, 'textarea_showcount');
    // TextArea with showCount wraps in a div that has the count
    const countContainer = block.locator('.ant-input-textarea-show-count');
    await expect(countContainer).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_onchange');
    await textarea.fill('Hello World');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: Hello World');
  });

  test('onBlur event fires when textarea loses focus', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_onblur');

    await textarea.focus();
    await textarea.blur();

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when textarea gains focus', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_onfocus');
    await textarea.focus();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onPressEnter event fires when Enter is pressed', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_onpressenter');
    await textarea.focus();
    await page.keyboard.press('Enter');

    const display = getBlock(page, 'onpressenter_display');
    await expect(display).toHaveText('Enter pressed');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can type multiline text into textarea', async ({ page }) => {
    const textarea = getTextArea(page, 'textarea_typing');
    await textarea.fill('Line 1\nLine 2\nLine 3');

    const display = getBlock(page, 'typing_display');
    await expect(display).toContainText('Line 1');
  });
});
