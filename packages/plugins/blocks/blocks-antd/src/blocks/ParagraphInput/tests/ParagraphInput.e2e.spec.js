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

test.describe('ParagraphInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'paragraphinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders as div with ant-typography class', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_basic');
    await expect(block).toBeVisible();
    await expect(block).toHaveClass(/ant-typography/);
  });

  test('renders with initial value', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_with_value');
    await expect(block).toContainText('Editable paragraph text');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with code style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_code');
    const code = block.locator('code');
    await expect(code).toBeAttached();
  });

  test('renders with italic style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_italic');
    const italic = block.locator('i');
    await expect(italic).toBeAttached();
  });

  test('renders with strong (bold) style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_strong');
    const strong = block.locator('strong');
    await expect(strong).toBeAttached();
  });

  test('renders with underline style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_underline');
    const underline = block.locator('u');
    await expect(underline).toBeAttached();
  });

  test('renders with delete (strikethrough) style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_delete');
    const del = block.locator('del');
    await expect(del).toBeAttached();
  });

  test('renders with mark (highlight) style', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_mark');
    const mark = block.locator('mark');
    await expect(mark).toBeAttached();
  });

  test('renders disabled state', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_disabled');
    await expect(block).toHaveClass(/ant-typography-disabled/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders secondary type', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_secondary');
    await expect(block).toHaveClass(/ant-typography-secondary/);
  });

  test('renders warning type', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_warning');
    await expect(block).toHaveClass(/ant-typography-warning/);
  });

  test('renders danger type', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_danger');
    await expect(block).toHaveClass(/ant-typography-danger/);
  });

  test('renders success type', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_success');
    await expect(block).toHaveClass(/ant-typography-success/);
  });

  // ============================================
  // COPYABLE TEST
  // ============================================

  test('renders copy button when copyable', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_copyable');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await expect(copyBtn).toBeVisible();
  });

  test('onCopy event fires when copy button is clicked', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_oncopy');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await copyBtn.click();

    // Verify the onCopy event fired
    const display = getBlock(page, 'oncopy_display');
    await expect(display).toHaveText('Copy fired');
  });

  // ============================================
  // EDITABLE TESTS
  // ============================================

  test('renders edit button when editable', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_editable');
    const editBtn = block.getByRole('button', { name: 'Edit' }).first();
    await expect(editBtn).toBeVisible();
  });

  test('hides edit button when editable is false', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_not_editable');
    const editBtn = block.getByRole('button', { name: 'Edit' }).first();
    await expect(editBtn).not.toBeVisible();
  });

  // ============================================
  // EDIT INTERACTION TESTS
  // ============================================

  test('can edit paragraph and onChange fires', async ({ page }) => {
    const block = getBlock(page, 'paragraphinput_onchange');

    // Click the edit button
    const editBtn = block.getByRole('button', { name: 'Edit' }).first();
    await editBtn.click();

    // After clicking, the paragraph is replaced with an editable div containing a textarea
    // The textarea appears inside the .ant-typography-edit-content wrapper
    const textarea = page.locator('.ant-typography-edit-content textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('New Paragraph Value');

    // Press Enter to confirm
    await textarea.press('Enter');

    // Verify the onChange event fired
    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: New Paragraph Value');
  });
});
