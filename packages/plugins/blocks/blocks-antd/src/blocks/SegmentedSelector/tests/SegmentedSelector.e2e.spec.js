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
import { escapeId } from '@lowdefy/e2e-utils';

// SegmentedSelector renders input with _input suffix
const getSegmented = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

test.describe('SegmentedSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'segmented_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders segmented control with options', async ({ page }) => {
    const segmented = getSegmented(page, 'seg_basic');
    await expect(segmented).toBeVisible();
    await expect(segmented).toHaveClass(/ant-segmented/);

    // Verify option text is displayed
    await expect(segmented).toContainText('Daily');
    await expect(segmented).toContainText('Weekly');
    await expect(segmented).toContainText('Monthly');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('fires onChange and updates state', async ({ page }) => {
    const segmented = getSegmented(page, 'seg_change');
    await expect(segmented).toBeVisible();

    // Click "Option B"
    const optionB = segmented.locator('.ant-segmented-item').filter({ hasText: 'Option B' });
    await optionB.click();

    const display = getBlock(page, 'seg_change_display');
    await expect(display).toHaveText('Option B');
  });

  // ============================================
  // DISABLED TEST
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const segmented = getSegmented(page, 'seg_disabled');
    await expect(segmented).toBeVisible();
    await expect(segmented).toHaveClass(/ant-segmented-disabled/);
  });

  // ============================================
  // SIZE TESTS
  // ============================================

  test('renders different sizes', async ({ page }) => {
    const small = getSegmented(page, 'seg_small');
    await expect(small).toBeVisible();
    await expect(small).toHaveClass(/ant-segmented-sm/);

    const large = getSegmented(page, 'seg_large');
    await expect(large).toBeVisible();
    await expect(large).toHaveClass(/ant-segmented-lg/);
  });
});
