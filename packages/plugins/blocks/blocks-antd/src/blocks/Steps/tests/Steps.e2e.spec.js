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

const getSteps = (page, blockId) => getBlock(page, blockId).locator('.ant-steps');

test.describe('Steps Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'steps');
  });

  test('renders the steps with the current step in process', async ({ page }) => {
    const steps = getSteps(page, 'steps_basic');
    await expect(steps.locator('.ant-steps-item')).toHaveCount(3);
    await expect(steps.locator('.ant-steps-item-process')).toContainText('Payment');
    await expect(steps).not.toHaveClass(/ant-steps-small/);
  });

  test('renders step descriptions and subtitles', async ({ page }) => {
    const steps = getSteps(page, 'steps_basic');
    await expect(steps.locator('.steps-custom-content').first()).toHaveText('Review items');
    await expect(steps).toContainText('Card or EFT');
  });

  test('limits the description width with the descriptionMaxWidth token', async ({ page }) => {
    const steps = getSteps(page, 'steps_description_width');
    await expect(steps.locator('.ant-steps-item-content').first()).toHaveCSS('max-width', '80px');
  });

  test('applies item, title and content classes', async ({ page }) => {
    const steps = getSteps(page, 'steps_basic');
    await expect(steps.locator('.ant-steps-item.steps-custom-item')).toHaveCount(3);
    await expect(steps.locator('.steps-custom-title').first()).toHaveText('Cart');
    await expect(steps.locator('.steps-custom-content')).toHaveCount(3);
  });

  test('renders dot style with progressDot', async ({ page }) => {
    const steps = getSteps(page, 'steps_progress_dot');
    await expect(steps).toHaveClass(/ant-steps-dot/);
  });

  test('collapses hidden steps with maxCount', async ({ page }) => {
    const steps = getSteps(page, 'steps_max_count');
    await expect(steps).toHaveClass(/ant-steps-max-count/);
    // Steps 1, 4, 5, 6 and 9 stay, with an ellipsis step in each hidden range.
    await expect(steps.locator('.ant-steps-item')).toHaveCount(7);
    await expect(steps).not.toContainText('Step 2');
    await expect(steps).not.toContainText('Step 8');
    await expect(steps.locator('.ant-steps-item-process')).toContainText('Step 5');
  });

  test('fires onChange with the clicked step', async ({ page }) => {
    const steps = getSteps(page, 'steps_clickable');
    await steps.locator('.ant-steps-item').filter({ hasText: 'Third' }).click();
    await expect(getBlock(page, 'steps_clickable_display')).toHaveText('current:2');
    await expect(steps.locator('.ant-steps-item-process')).toContainText('Third');
  });
});
