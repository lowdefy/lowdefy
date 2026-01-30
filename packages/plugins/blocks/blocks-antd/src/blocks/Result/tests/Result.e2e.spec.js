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

// Result: use framework wrapper
const getResult = (page, blockId) => getBlock(page, blockId);

test.describe('Result Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'result');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic result', async ({ page }) => {
    const block = getResult(page, 'result_basic');
    await expect(block).toBeVisible();
    const result = block.locator('.ant-result');
    await expect(result).toHaveClass(/ant-result/);
  });

  test('renders with title', async ({ page }) => {
    const block = getResult(page, 'result_basic');
    const title = block.locator('.ant-result-title');
    await expect(title).toHaveText('Operation Completed');
  });

  test('renders with subtitle', async ({ page }) => {
    const block = getResult(page, 'result_with_subtitle');
    const subtitle = block.locator('.ant-result-subtitle');
    await expect(subtitle).toHaveText('Your request has been processed.');
  });

  // ============================================
  // STATUS TESTS
  // ============================================

  test('renders success status', async ({ page }) => {
    const block = getResult(page, 'result_success');
    const result = block.locator('.ant-result');
    await expect(result).toHaveClass(/ant-result-success/);
    const icon = block.locator('.ant-result-icon .anticon-check-circle');
    await expect(icon).toBeVisible();
  });

  test('renders error status', async ({ page }) => {
    const block = getResult(page, 'result_error');
    const result = block.locator('.ant-result');
    await expect(result).toHaveClass(/ant-result-error/);
    const icon = block.locator('.ant-result-icon .anticon-close-circle');
    await expect(icon).toBeVisible();
  });

  test('renders info status', async ({ page }) => {
    const block = getResult(page, 'result_info');
    const result = block.locator('.ant-result');
    await expect(result).toHaveClass(/ant-result-info/);
    // Info status has an icon
    const icon = block.locator('.ant-result-icon');
    await expect(icon).toBeVisible();
  });

  test('renders warning status', async ({ page }) => {
    const block = getResult(page, 'result_warning');
    const result = block.locator('.ant-result');
    await expect(result).toHaveClass(/ant-result-warning/);
    // Warning status has an icon
    const icon = block.locator('.ant-result-icon');
    await expect(icon).toBeVisible();
  });

  test('renders 404 status', async ({ page }) => {
    const block = getResult(page, 'result_404');
    // 404 uses SVG illustration
    const icon = block.locator('.ant-result-icon');
    await expect(icon).toBeVisible();
    const title = block.locator('.ant-result-title');
    await expect(title).toHaveText('Page Not Found');
  });

  test('renders 403 status', async ({ page }) => {
    const block = getResult(page, 'result_403');
    const icon = block.locator('.ant-result-icon');
    await expect(icon).toBeVisible();
    const title = block.locator('.ant-result-title');
    await expect(title).toHaveText('Access Denied');
  });

  test('renders 500 status', async ({ page }) => {
    const block = getResult(page, 'result_500');
    const icon = block.locator('.ant-result-icon');
    await expect(icon).toBeVisible();
    const title = block.locator('.ant-result-title');
    await expect(title).toHaveText('Server Error');
  });

  // ============================================
  // ICON TESTS
  // ============================================

  test('renders with custom icon', async ({ page }) => {
    const block = getResult(page, 'result_custom_icon');
    const icon = block.locator('.ant-result-icon .anticon');
    await expect(icon).toBeVisible();
  });

  // ============================================
  // CONTENT AREA TESTS
  // ============================================

  test('renders with content area', async ({ page }) => {
    const result = getResult(page, 'result_with_content');
    await expect(result).toBeVisible();
    const paragraph = getBlock(page, 'result_content_paragraph');
    await expect(paragraph).toBeVisible();
    await expect(paragraph).toContainText('Additional content');
  });

  test('renders with extra area', async ({ page }) => {
    const block = getResult(page, 'result_with_extra');
    const extra = block.locator('.ant-result-extra');
    await expect(extra).toBeVisible();
    const button = getBlock(page, 'result_extra_button');
    await expect(button).toBeVisible();
  });
});
