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

// Tour renders as a portal overlay, not inside the block element
const getTour = (page) => page.locator('.ant-tour');

test.describe('Tour Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tour_block');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('tour not visible initially', async ({ page }) => {
    const tour = getTour(page);
    await expect(tour).toBeHidden();
  });

  test('opens tour on trigger click', async ({ page }) => {
    const triggerBtn = getBlock(page, 'tour_trigger').locator('.ant-btn');
    await triggerBtn.click();

    const tour = getTour(page);
    await expect(tour).toBeVisible();

    // Verify first step title is shown
    const title = tour.locator('.ant-tour-title');
    await expect(title).toHaveText('First Step');
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================

  test('navigates to next step', async ({ page }) => {
    // Open the tour
    const triggerBtn = getBlock(page, 'tour_trigger').locator('.ant-btn');
    await triggerBtn.click();

    const tour = getTour(page);
    await expect(tour).toBeVisible();

    // Click next button
    const nextBtn = tour.locator('.ant-tour-footer .ant-tour-next-btn');
    await nextBtn.click();

    // Verify second step title
    const title = tour.locator('.ant-tour-title');
    await expect(title).toHaveText('Second Step');
  });

  // ============================================
  // CLOSE TESTS
  // ============================================

  test('closes tour', async ({ page }) => {
    // Open the tour
    const triggerBtn = getBlock(page, 'tour_trigger').locator('.ant-btn');
    await triggerBtn.click();

    const tour = getTour(page);
    await expect(tour).toBeVisible();

    // Click close button
    const closeBtn = tour.locator('.ant-tour-close');
    await closeBtn.click();

    // Tour should be hidden
    await expect(tour).toBeHidden();
  });
});
