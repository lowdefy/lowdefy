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

// Notification renders in a corner of the page using notification API
const getNotification = (page) => page.locator('.ant-notification-notice').first();

test.describe('Notification Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'notification');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic notification when triggered', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText(
      'Basic Notification'
    );
    await expect(notification.locator('.ant-notification-notice-description')).toContainText(
      'This is a basic notification description.'
    );
  });

  // ============================================
  // STATUS TYPE TESTS
  // ============================================

  test('renders success notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_success').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText('Success!');
    // Check for success icon
    const icon = notification.locator('.anticon-check-circle');
    await expect(icon).toBeAttached();
  });

  test('renders error notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_error').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText('Error');
    // Check for error icon
    const icon = notification.locator('.anticon-close-circle');
    await expect(icon).toBeAttached();
  });

  test('renders warning notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_warning').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText('Warning');
    // Check for warning icon
    const icon = notification.locator('.anticon-exclamation-circle');
    await expect(icon).toBeAttached();
  });

  test('renders info notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_info').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText(
      'Information'
    );
    // Check for info icon
    const icon = notification.locator('.anticon-info-circle');
    await expect(icon).toBeAttached();
  });

  // ============================================
  // PLACEMENT TESTS
  // ============================================

  test('renders notification at top right', async ({ page }) => {
    const openBtn = getBlock(page, 'open_top_right').locator('.ant-btn');
    await openBtn.click();

    // Check notification appears at top right
    const container = page.locator('.ant-notification-topRight');
    await expect(container).toBeVisible();
  });

  test('renders notification at top left', async ({ page }) => {
    const openBtn = getBlock(page, 'open_top_left').locator('.ant-btn');
    await openBtn.click();

    // Check notification appears at top left
    const container = page.locator('.ant-notification-topLeft');
    await expect(container).toBeVisible();
  });

  test('renders notification at bottom right', async ({ page }) => {
    const openBtn = getBlock(page, 'open_bottom_right').locator('.ant-btn');
    await openBtn.click();

    // Check notification appears at bottom right
    const container = page.locator('.ant-notification-bottomRight');
    await expect(container).toBeVisible();
  });

  test('renders notification at bottom left', async ({ page }) => {
    const openBtn = getBlock(page, 'open_bottom_left').locator('.ant-btn');
    await openBtn.click();

    // Check notification appears at bottom left
    const container = page.locator('.ant-notification-bottomLeft');
    await expect(container).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders notification with custom icon', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_icon').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    // Check for SVG icon (custom icons render as SVGs)
    const svg = notification.locator('.ant-notification-notice-icon svg');
    await expect(svg).toBeAttached();
  });

  test('renders notification with action button', async ({ page }) => {
    const openBtn = getBlock(page, 'open_with_button').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    // Check for action button
    const actionBtn = notification.locator('.ant-btn');
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toHaveText('Action');
  });

  // ============================================
  // RUNTIME OVERRIDE TESTS
  // ============================================

  test('can override status at runtime', async ({ page }) => {
    const openBtn = getBlock(page, 'open_runtime_success').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toHaveText(
      'Runtime Success'
    );
    await expect(notification.locator('.ant-notification-notice-description')).toContainText(
      'Success message at runtime'
    );
    const icon = notification.locator('.anticon-check-circle');
    await expect(icon).toBeAttached();
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can close notification manually', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();

    // Click close button
    const closeBtn = notification.locator('.ant-notification-notice-close');
    await closeBtn.click();

    await expect(notification).toBeHidden();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClose event fires when notification closes', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onclose').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();

    // Wait for the notification to close (duration is 1 second)
    await expect(notification).not.toBeVisible({ timeout: 5000 });

    // onClose event should have fired
    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Close fired');
  });

  test('onClick event fires when notification is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onclick').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();

    // Click on the notification content
    await notification.locator('.ant-notification-notice-content').click();

    // onClick event should have fired
    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Click fired');
  });
});
