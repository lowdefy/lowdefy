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

// Message renders at the top of the page using message API
const getMessage = (page) => page.locator('.ant-message-notice').first();

test.describe('Message Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'message');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic message when triggered', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Basic message content');
  });

  // ============================================
  // STATUS TYPE TESTS
  // ============================================

  test('renders success message', async ({ page }) => {
    const openBtn = getBlock(page, 'open_success').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Operation successful!');
    // Check for success icon class
    const icon = message.locator('.anticon-check-circle');
    await expect(icon).toBeAttached();
  });

  test('renders error message', async ({ page }) => {
    const openBtn = getBlock(page, 'open_error').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('An error occurred!');
    // Check for error icon class
    const icon = message.locator('.anticon-close-circle');
    await expect(icon).toBeAttached();
  });

  test('renders warning message', async ({ page }) => {
    const openBtn = getBlock(page, 'open_warning').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Warning message!');
    // Check for warning icon class
    const icon = message.locator('.anticon-exclamation-circle');
    await expect(icon).toBeAttached();
  });

  test('renders loading message', async ({ page }) => {
    const openBtn = getBlock(page, 'open_loading').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Loading...');
    // Check for loading icon class
    const icon = message.locator('.anticon-loading');
    await expect(icon).toBeAttached();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders message with custom icon', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_icon').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Message with custom icon');
    // Check for SVG icon (custom icons render as SVGs)
    const svg = message.locator('svg');
    await expect(svg).toBeAttached();
  });

  // ============================================
  // RUNTIME OVERRIDE TESTS
  // ============================================

  test('can override status at runtime to success', async ({ page }) => {
    const openBtn = getBlock(page, 'open_runtime_success').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Runtime success message');
    const icon = message.locator('.anticon-check-circle');
    await expect(icon).toBeAttached();
  });

  test('can override status at runtime to error', async ({ page }) => {
    const openBtn = getBlock(page, 'open_runtime_error').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();
    await expect(message).toContainText('Runtime error message');
    const icon = message.locator('.anticon-close-circle');
    await expect(icon).toBeAttached();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClose event fires when message closes', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onclose').locator('.ant-btn');
    await openBtn.click();

    const message = getMessage(page);
    await expect(message).toBeVisible();

    // Wait for the message to close (duration is 1 second)
    await expect(message).not.toBeVisible({ timeout: 5000 });

    // onClose event should have fired
    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Close fired');
  });
});
