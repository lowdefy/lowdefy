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

// Progress: use framework wrapper
const getProgress = (page, blockId) => getBlock(page, blockId);

test.describe('Progress Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'progress');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic progress', async ({ page }) => {
    const block = getProgress(page, 'progress_basic');
    await expect(block).toBeVisible();
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress/);
  });

  test('renders with percent value', async ({ page }) => {
    const block = getProgress(page, 'progress_basic');
    const text = block.locator('.ant-progress-text');
    await expect(text).toContainText('50%');
  });

  test('renders zero percent', async ({ page }) => {
    const block = getProgress(page, 'progress_zero');
    const text = block.locator('.ant-progress-text');
    await expect(text).toContainText('0%');
  });

  test('renders complete progress', async ({ page }) => {
    const block = getProgress(page, 'progress_complete');
    const progress = block.locator('.ant-progress');
    // At 100%, Progress auto-shows success status with checkmark icon
    await expect(progress).toHaveClass(/ant-progress-status-success/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders line type', async ({ page }) => {
    const block = getProgress(page, 'progress_line');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-line/);
  });

  test('renders circle type', async ({ page }) => {
    const block = getProgress(page, 'progress_circle');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-circle/);
  });

  test('renders dashboard type', async ({ page }) => {
    const block = getProgress(page, 'progress_dashboard');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-circle/);
    // Dashboard is a variant of circle with gap
  });

  // ============================================
  // STATUS TESTS
  // ============================================

  test('renders success status', async ({ page }) => {
    const block = getProgress(page, 'progress_success');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-status-success/);
  });

  test('renders exception status', async ({ page }) => {
    const block = getProgress(page, 'progress_exception');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-status-exception/);
  });

  test('renders active status', async ({ page }) => {
    const block = getProgress(page, 'progress_active');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-status-active/);
  });

  test('renders normal status', async ({ page }) => {
    const block = getProgress(page, 'progress_normal');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-status-normal/);
  });

  // ============================================
  // SHOW INFO TESTS
  // ============================================

  test('shows info text by default', async ({ page }) => {
    const block = getProgress(page, 'progress_show_info');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-show-info/);
    const text = block.locator('.ant-progress-text');
    await expect(text).toBeVisible();
  });

  test('hides info text when showInfo is false', async ({ page }) => {
    const block = getProgress(page, 'progress_hide_info');
    const progress = block.locator('.ant-progress');
    await expect(progress).not.toHaveClass(/ant-progress-show-info/);
  });

  // ============================================
  // STROKE TESTS
  // ============================================

  test('renders with round stroke linecap', async ({ page }) => {
    const block = getProgress(page, 'progress_stroke_linecap_round');
    // Circle uses SVG - check the path element
    const circle = block.locator('svg');
    await expect(circle).toBeVisible();
  });

  test('renders with square stroke linecap', async ({ page }) => {
    const block = getProgress(page, 'progress_stroke_linecap_square');
    const circle = block.locator('svg');
    await expect(circle).toBeVisible();
  });

  // ============================================
  // CIRCLE/DASHBOARD OPTIONS
  // ============================================

  test('renders circle with custom width', async ({ page }) => {
    const block = getProgress(page, 'progress_circle_width');
    const wrapper = block.locator('.ant-progress-inner');
    // Custom width should be applied
    await expect(wrapper).toBeVisible();
  });

  test('renders dashboard with gap settings', async ({ page }) => {
    const block = getProgress(page, 'progress_dashboard_gap');
    await expect(block).toBeVisible();
    // Dashboard should have SVG with gap
    const svg = block.locator('svg');
    await expect(svg).toBeVisible();
  });

  // ============================================
  // STEPS TESTS
  // ============================================

  test('renders with steps', async ({ page }) => {
    const block = getProgress(page, 'progress_steps');
    const progress = block.locator('.ant-progress');
    await expect(progress).toHaveClass(/ant-progress-steps/);
    const steps = block.locator('.ant-progress-steps-item');
    await expect(steps).toHaveCount(5);
  });
});
