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

// Paragraph uses id={blockId} directly on the div element
const getParagraph = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Paragraph Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'paragraph');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with content', async ({ page }) => {
    const para = getParagraph(page, 'para_basic');
    await expect(para).toBeVisible();
    await expect(para).toHaveText('This is a basic paragraph.');
  });

  test('renders as typography paragraph', async ({ page }) => {
    const para = getParagraph(page, 'para_basic');
    await expect(para).toHaveClass(/ant-typography/);
  });

  test('renders HTML content', async ({ page }) => {
    const para = getParagraph(page, 'para_html');
    const bold = para.locator('strong');
    const italic = para.locator('em');
    await expect(bold).toHaveText('Bold');
    await expect(italic).toHaveText('italic');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with code style', async ({ page }) => {
    const para = getParagraph(page, 'para_code');
    const code = para.locator('code');
    await expect(code).toBeVisible();
  });

  test('renders with italic style', async ({ page }) => {
    const para = getParagraph(page, 'para_italic');
    const italic = para.locator('i');
    await expect(italic).toBeVisible();
  });

  test('renders with strong style', async ({ page }) => {
    const para = getParagraph(page, 'para_strong');
    const strong = para.locator('strong');
    await expect(strong).toBeVisible();
  });

  test('renders with underline style', async ({ page }) => {
    const para = getParagraph(page, 'para_underline');
    const underline = para.locator('u');
    await expect(underline).toBeVisible();
  });

  test('renders with delete (strikethrough) style', async ({ page }) => {
    const para = getParagraph(page, 'para_delete');
    const del = para.locator('del');
    await expect(del).toBeVisible();
  });

  test('renders with mark (highlight) style', async ({ page }) => {
    const para = getParagraph(page, 'para_mark');
    const mark = para.locator('mark');
    await expect(mark).toBeVisible();
  });

  test('renders disabled state', async ({ page }) => {
    const para = getParagraph(page, 'para_disabled');
    await expect(para).toHaveClass(/ant-typography-disabled/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders secondary type', async ({ page }) => {
    const para = getParagraph(page, 'para_secondary');
    await expect(para).toHaveClass(/ant-typography-secondary/);
  });

  test('renders success type', async ({ page }) => {
    const para = getParagraph(page, 'para_success');
    await expect(para).toHaveClass(/ant-typography-success/);
  });

  test('renders warning type', async ({ page }) => {
    const para = getParagraph(page, 'para_warning');
    await expect(para).toHaveClass(/ant-typography-warning/);
  });

  test('renders danger type', async ({ page }) => {
    const para = getParagraph(page, 'para_danger');
    await expect(para).toHaveClass(/ant-typography-danger/);
  });

  // ============================================
  // COPYABLE TESTS
  // ============================================

  test('renders copy button when copyable', async ({ page }) => {
    const block = getBlock(page, 'para_copyable');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await expect(copyBtn).toBeVisible();
  });

  test('onCopy event fires when copy button clicked', async ({ page }) => {
    const block = getBlock(page, 'para_copyable_event');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await copyBtn.click();

    const display = getBlock(page, 'oncopy_display');
    await expect(display).toHaveText('Copy fired');
  });

  // ============================================
  // ELLIPSIS TESTS
  // ============================================

  test('renders with ellipsis when content overflows', async ({ page }) => {
    const para = getParagraph(page, 'para_ellipsis');
    await expect(para).toBeVisible();
    await expect(para).toHaveClass(/ant-typography-ellipsis/);
  });
});
