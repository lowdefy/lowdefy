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
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText(
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
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText('Success!');
    // Check for success icon
    const icon = notification.locator('.ant-notification-notice-icon-success svg');
    await expect(icon).toBeAttached();
    // antd colours status icons through a class on the icon wrapper, not on the svg.
    await expect(notification.locator('.ant-notification-notice-icon')).toHaveCSS(
      'color',
      'rgb(82, 196, 26)'
    );
  });

  test('renders error notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_error').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText('Error');
    // Check for error icon
    const icon = notification.locator('.ant-notification-notice-icon-error svg');
    await expect(icon).toBeAttached();
  });

  test('renders warning notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_warning').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText('Warning');
    // Check for warning icon
    const icon = notification.locator('.ant-notification-notice-icon-warning svg');
    await expect(icon).toBeAttached();
  });

  test('renders info notification', async ({ page }) => {
    const openBtn = getBlock(page, 'open_info').locator('.ant-btn');
    await openBtn.click();

    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText('Information');
    // Check for info icon
    const icon = notification.locator('.ant-notification-notice-icon-info svg');
    await expect(icon).toBeAttached();
  });

  // ============================================
  // PLACEMENT TESTS
  // ============================================

  test('renders notification at top right', async ({ page }) => {
    const openBtn = getBlock(page, 'open_top_right').locator('.ant-btn');
    await openBtn.click();

    // In antd v6, the placement container div is not considered "visible" by Playwright
    // (zero intrinsic size), so check for a visible notice inside the placement container.
    const notice = page.locator('.ant-notification-topRight .ant-notification-notice');
    await expect(notice).toBeVisible();
  });

  test('renders notification at top left', async ({ page }) => {
    const openBtn = getBlock(page, 'open_top_left').locator('.ant-btn');
    await openBtn.click();

    const notice = page.locator('.ant-notification-topLeft .ant-notification-notice');
    await expect(notice).toBeVisible();
  });

  test('renders notification at bottom right', async ({ page }) => {
    const openBtn = getBlock(page, 'open_bottom_right').locator('.ant-btn');
    await openBtn.click();

    const notice = page.locator('.ant-notification-bottomRight .ant-notification-notice');
    await expect(notice).toBeVisible();
  });

  test('renders notification at bottom left', async ({ page }) => {
    const openBtn = getBlock(page, 'open_bottom_left').locator('.ant-btn');
    await openBtn.click();

    const notice = page.locator('.ant-notification-bottomLeft .ant-notification-notice');
    await expect(notice).toBeVisible();
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
    const actionBtn = notification.locator('.ant-notification-notice-actions .ant-btn');
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
    await expect(notification.locator('.ant-notification-notice-title')).toHaveText(
      'Runtime Success'
    );
    await expect(notification.locator('.ant-notification-notice-description')).toContainText(
      'Success message at runtime'
    );
    const icon = notification.locator('.ant-notification-notice-icon-success svg');
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

    await notification.locator('.ant-notification-notice-title').click();

    // onClick event should have fired
    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Click fired');
  });

  // ============================================
  // ANTD 6 FEATURES
  // ============================================

  test('closable false hides the close button', async ({ page }) => {
    await getBlock(page, 'open_notif_not_closable').locator('.ant-btn').click();
    const notification = getNotification(page);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-close')).toHaveCount(0);
  });

  test('showProgress renders the auto-close progress bar', async ({ page }) => {
    await getBlock(page, 'open_notif_progress').locator('.ant-btn').click();
    const notification = getNotification(page);
    await expect(notification.locator('.ant-notification-notice-progress')).toBeVisible();
  });

  test('placement top renders the notification at the top centre', async ({ page }) => {
    await getBlock(page, 'open_notif_top').locator('.ant-btn').click();
    await expect(page.locator('.ant-notification-top .ant-notification-notice')).toBeVisible();
  });

  test('role status is set on the notification', async ({ page }) => {
    await getBlock(page, 'open_notif_status_role').locator('.ant-btn').click();
    await expect(getNotification(page)).toHaveAttribute('role', 'status');
  });

  test('title, description and actions cssKeys reach the antd semantic elements', async ({
    page,
  }) => {
    await getBlock(page, 'open_notif_styled').locator('.ant-btn').click();
    const notification = getNotification(page);
    await expect(notification.locator('.ant-notification-notice-title')).toHaveClass(
      /notif-styled-title/
    );
    await expect(notification.locator('.ant-notification-notice-description')).toHaveCSS(
      'color',
      'rgb(255, 0, 0)'
    );
    await expect(notification.locator('.ant-notification-notice-actions')).toHaveCSS(
      'margin-top',
      '20px'
    );
  });

  test('button iconPlacement end places the icon after the button title', async ({ page }) => {
    await getBlock(page, 'open_notif_button_icon_end').locator('.ant-btn').click();
    const button = getNotification(page).locator('.ant-notification-notice-actions .ant-btn');
    await expect(button).toHaveClass(/ant-btn-icon-end/);
    const iconBox = await button.locator('.ant-btn-icon').boundingBox();
    const titleBox = await button.locator(':scope > span:not(.ant-btn-icon)').first().boundingBox();
    expect(iconBox.x).toBeGreaterThan(titleBox.x);
  });

  test('clicking the notification button closes the notification', async ({ page }) => {
    await getBlock(page, 'open_notif_styled').locator('.ant-btn').click();
    const notification = getNotification(page);
    await notification.locator('.ant-notification-notice-actions .ant-btn').click();
    await expect(notification).toBeHidden();
  });
});
