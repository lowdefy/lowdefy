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

// Alert: use framework wrapper since Alert may not render id directly
const getAlert = (page, blockId) => getBlock(page, blockId);

test.describe('Alert Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'alert');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic alert', async ({ page }) => {
    const block = getAlert(page, 'alert_basic');
    await expect(block).toBeVisible();
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert/);
  });

  test('renders with message', async ({ page }) => {
    const block = getAlert(page, 'alert_basic');
    const message = block.locator('.ant-alert-message');
    await expect(message).toHaveText('Basic Alert Message');
  });

  test('renders with description', async ({ page }) => {
    const block = getAlert(page, 'alert_with_description');
    const description = block.locator('.ant-alert-description');
    await expect(description).toContainText('detailed description');
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders success type', async ({ page }) => {
    const block = getAlert(page, 'alert_success');
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert-success/);
  });

  test('renders info type', async ({ page }) => {
    const block = getAlert(page, 'alert_info');
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert-info/);
  });

  test('renders warning type', async ({ page }) => {
    const block = getAlert(page, 'alert_warning');
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert-warning/);
  });

  test('renders error type', async ({ page }) => {
    const block = getAlert(page, 'alert_error');
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert-error/);
  });

  // ============================================
  // ICON TESTS
  // ============================================

  test('renders with icon by default', async ({ page }) => {
    const block = getAlert(page, 'alert_with_icon');
    // Check that icon is visible (showIcon defaults to true)
    const icon = block.locator('.ant-alert-icon');
    await expect(icon).toBeVisible();
  });

  test('renders without icon when showIcon is false', async ({ page }) => {
    const block = getAlert(page, 'alert_no_icon');
    // When showIcon is false, there should be no icon element
    const icon = block.locator('.ant-alert-icon');
    await expect(icon).toBeHidden();
  });

  test('renders with custom icon', async ({ page }) => {
    const block = getAlert(page, 'alert_custom_icon');
    // Custom icon renders in the icon slot
    const icon = block.locator('.anticon');
    await expect(icon).toBeVisible();
  });

  // ============================================
  // CLOSABLE TESTS
  // ============================================

  test('renders close button when closable', async ({ page }) => {
    const block = getAlert(page, 'alert_closable');
    const closeBtn = block.locator('.ant-alert-close-icon');
    await expect(closeBtn).toBeVisible();
  });

  test('renders custom close text', async ({ page }) => {
    const block = getAlert(page, 'alert_close_text');
    const closeBtn = block.locator('.ant-alert-close-icon');
    await expect(closeBtn).toHaveText('Dismiss');
  });

  test('closes alert when close button clicked', async ({ page }) => {
    const block = getAlert(page, 'alert_closable');
    const alert = block.locator('.ant-alert');
    await expect(alert).toBeVisible();

    const closeBtn = block.locator('.ant-alert-close-icon');
    await closeBtn.click();

    // Alert should be hidden after closing
    await expect(alert).toBeHidden();
  });

  // ============================================
  // BANNER TESTS
  // ============================================

  test('renders as banner', async ({ page }) => {
    const block = getAlert(page, 'alert_banner');
    const alert = block.locator('.ant-alert');
    await expect(alert).toHaveClass(/ant-alert-banner/);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClose event fires when close button clicked', async ({ page }) => {
    const block = getAlert(page, 'alert_onclose');
    const closeBtn = block.locator('.ant-alert-close-icon');
    await closeBtn.click();

    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Close fired');
  });

  test('afterClose event fires after alert closes', async ({ page }) => {
    const block = getAlert(page, 'alert_afterclose');
    const closeBtn = block.locator('.ant-alert-close-icon');
    await closeBtn.click();

    // afterClose fires after animation completes
    const display = getBlock(page, 'afterclose_display');
    await expect(display).toHaveText('After close fired', { timeout: 5000 });
  });
});
