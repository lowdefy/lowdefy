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

// Badge: use framework wrapper
const getBadge = (page, blockId) => getBlock(page, blockId);

test.describe('Badge Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'badge');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic badge', async ({ page }) => {
    const block = getBadge(page, 'badge_basic');
    await expect(block).toBeVisible();
    const badge = block.locator('.ant-badge');
    await expect(badge).toHaveClass(/ant-badge/);
  });

  test('renders with count', async ({ page }) => {
    const block = getBadge(page, 'badge_basic');
    const count = block.locator('.ant-badge-count');
    await expect(count).toContainText('5');
  });

  test('renders with content', async ({ page }) => {
    const block = getBadge(page, 'badge_with_content');
    const avatar = block.locator('.ant-avatar');
    await expect(avatar).toBeVisible();
  });

  // ============================================
  // COUNT TESTS
  // ============================================

  test('hides count when zero by default', async ({ page }) => {
    const block = getBadge(page, 'badge_count_zero');
    const count = block.locator('.ant-badge-count');
    await expect(count).toBeHidden();
  });

  test('shows zero count when showZero is true', async ({ page }) => {
    const block = getBadge(page, 'badge_show_zero');
    const count = block.locator('.ant-badge-count');
    await expect(count).toBeVisible();
    await expect(count).toContainText('0');
  });

  test('shows overflow count with plus sign', async ({ page }) => {
    const block = getBadge(page, 'badge_overflow');
    const count = block.locator('.ant-badge-count');
    await expect(count).toContainText('99+');
  });

  test('respects custom overflow count', async ({ page }) => {
    const block = getBadge(page, 'badge_custom_overflow');
    const count = block.locator('.ant-badge-count');
    await expect(count).toContainText('999+');
  });

  // ============================================
  // DOT TESTS
  // ============================================

  test('renders as dot', async ({ page }) => {
    const block = getBadge(page, 'badge_dot');
    const dot = block.locator('.ant-badge-dot');
    await expect(dot).toBeVisible();
  });

  // ============================================
  // SIZE TESTS
  // ============================================

  test('renders small size', async ({ page }) => {
    const block = getBadge(page, 'badge_small');
    const count = block.locator('.ant-badge-count');
    await expect(count).toHaveClass(/ant-badge-count-sm/);
  });

  // ============================================
  // STATUS TESTS
  // ============================================

  test('renders success status', async ({ page }) => {
    const block = getBadge(page, 'badge_status_success');
    const badge = block.locator('.ant-badge');
    await expect(badge).toHaveClass(/ant-badge-status/);
    const statusDot = block.locator('.ant-badge-status-dot');
    await expect(statusDot).toHaveClass(/ant-badge-status-success/);
  });

  test('renders processing status', async ({ page }) => {
    const block = getBadge(page, 'badge_status_processing');
    const statusDot = block.locator('.ant-badge-status-dot');
    await expect(statusDot).toHaveClass(/ant-badge-status-processing/);
  });

  test('renders error status', async ({ page }) => {
    const block = getBadge(page, 'badge_status_error');
    const statusDot = block.locator('.ant-badge-status-dot');
    await expect(statusDot).toHaveClass(/ant-badge-status-error/);
  });

  test('renders warning status', async ({ page }) => {
    const block = getBadge(page, 'badge_status_warning');
    const statusDot = block.locator('.ant-badge-status-dot');
    await expect(statusDot).toHaveClass(/ant-badge-status-warning/);
  });

  test('renders with status text', async ({ page }) => {
    const block = getBadge(page, 'badge_status_success');
    const text = block.locator('.ant-badge-status-text');
    await expect(text).toHaveText('Success');
  });

  // ============================================
  // ICON TESTS
  // ============================================

  test('renders with icon in count', async ({ page }) => {
    const block = getBadge(page, 'badge_with_icon');
    // Badge renders with content (Avatar) inside
    const avatar = block.locator('.ant-avatar');
    await expect(avatar).toBeVisible();
  });

  // ============================================
  // TITLE TESTS
  // ============================================

  test('renders with custom title attribute', async ({ page }) => {
    const block = getBadge(page, 'badge_with_title');
    const count = block.locator('.ant-badge-count');
    await expect(count).toHaveAttribute('title', 'Custom tooltip title');
  });
});
