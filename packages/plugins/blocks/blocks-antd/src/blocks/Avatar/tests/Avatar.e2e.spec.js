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

// Avatar uses id={blockId} directly
const getAvatar = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Avatar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'avatar');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic avatar', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_basic');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveClass(/ant-avatar/);
  });

  test('renders with text content', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_with_text');
    await expect(avatar).toContainText('JD');
  });

  test('renders with image', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_with_image');
    const img = avatar.locator('img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Test Avatar');
  });

  // ============================================
  // SHAPE TESTS
  // ============================================

  test('renders circle shape by default', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_circle');
    await expect(avatar).toHaveClass(/ant-avatar-circle/);
  });

  test('renders square shape', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_square');
    await expect(avatar).toHaveClass(/ant-avatar-square/);
  });

  // ============================================
  // SIZE TESTS
  // ============================================

  test('renders small size', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_small');
    await expect(avatar).toHaveClass(/ant-avatar-sm/);
  });

  test('renders default size', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_default');
    await expect(avatar).toBeVisible();
    // Default size doesn't have a specific class
  });

  test('renders large size', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_large');
    await expect(avatar).toHaveClass(/ant-avatar-lg/);
  });

  test('renders with custom numeric size', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_number_size');
    await expect(avatar).toBeVisible();
    // Custom size is applied via inline style
    const style = await avatar.getAttribute('style');
    expect(style).toContain('64px');
  });

  // ============================================
  // ICON TESTS
  // ============================================

  test('renders with icon', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_with_icon');
    await expect(avatar).toHaveClass(/ant-avatar-icon/);
    const icon = avatar.locator('.anticon');
    await expect(icon).toBeVisible();
  });

  // ============================================
  // COLOR TESTS
  // ============================================

  test('renders with custom background color', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_with_color');
    await expect(avatar).toBeVisible();
    // Color is applied via class (CSS-in-JS)
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires when avatar is clicked', async ({ page }) => {
    const avatar = getAvatar(page, 'avatar_onclick');
    await avatar.click();

    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Avatar clicked');
  });
});
