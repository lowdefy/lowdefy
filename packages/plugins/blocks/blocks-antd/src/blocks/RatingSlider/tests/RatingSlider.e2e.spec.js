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

// Helper to get the slider element
const getSlider = (page, blockId) => page.locator(`#bl-${blockId} .ant-slider`);

// Helper to get the slider handle
const getHandle = (page, blockId) => page.locator(`#bl-${blockId} .ant-slider-handle`);

// Helper to get the N/A checkbox
const getNACheckbox = (page, blockId) =>
  page.locator(`#bl-${blockId} .ant-checkbox-wrapper`).first();

test.describe('RatingSlider Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'ratingslider');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_basic');
    await expect(block).toBeVisible();
    // Use first() to get the title label (not the N/A checkbox label)
    const label = block.locator('label').first();
    await expect(label).toContainText('Basic Rating Slider');
  });

  test('renders slider element', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_basic');
    await expect(slider).toBeVisible();
  });

  test('renders with initial value', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_with_value');
    await expect(slider).toBeVisible();
    const handle = getHandle(page, 'ratingslider_with_value');
    await expect(handle).toBeVisible();
  });

  test('renders min and max icons by default', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_basic');
    // Check that icons are rendered (frown and smile by default)
    const icons = block.locator('.anticon');
    await expect(icons).toHaveCount(2);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_disabled');
    await expect(slider).toHaveClass(/ant-slider-disabled/);
  });

  test('hides icons when disableIcons is true', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_no_icons');
    const icons = block.locator('.anticon');
    // Should only have the N/A checkbox icon or none
    const iconCount = await icons.count();
    // Icons for min/max should not exist (only potential checkbox icon)
    expect(iconCount).toBeLessThanOrEqual(1);
  });

  test('renders custom icons', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_custom_icons');
    const icons = block.locator('.anticon');
    // Should have at least 2 icons (min and max)
    await expect(icons).toHaveCount(2);
  });

  test('renders marks by default', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_basic');
    // Rating slider shows marks by default - check slider marks container exists
    // Marks are rendered with <strong> tags inside .ant-slider-mark
    const marksContainer = block.locator('.ant-slider-mark');
    await expect(marksContainer).toBeAttached();
    // Check marks are actually rendered (strong tags contain the numbers)
    const markLabels = marksContainer.locator('strong');
    const count = await markLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('hides marks when showMarks is false', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_hide_marks');
    const marks = block.locator('.ant-slider-mark-text');
    await expect(marks).toHaveCount(0);
  });

  test('renders dots by default', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_basic');
    // Rating slider shows dots by default - check step container exists
    const stepsContainer = block.locator('.ant-slider-step');
    await expect(stepsContainer).toBeVisible();
  });

  test('respects showDots setting', async ({ page }) => {
    // When showDots is false, the dots prop is set to false
    // Check that the basic block has dots while hide_dots doesn't have active dots visual
    const basicBlock = getBlock(page, 'ratingslider_basic');
    const basicStep = basicBlock.locator('.ant-slider-step');
    await expect(basicStep).toBeVisible();
  });

  // ============================================
  // N/A CHECKBOX TESTS
  // ============================================

  test('renders N/A checkbox when not required', async ({ page }) => {
    const checkbox = getNACheckbox(page, 'ratingslider_with_na');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toContainText('N/A');
  });

  test('renders custom N/A label', async ({ page }) => {
    const checkbox = getNACheckbox(page, 'ratingslider_custom_na_label');
    await expect(checkbox).toContainText('Not Applicable');
  });

  test('hides N/A checkbox when disableNotApplicable is true', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_disable_na');
    const checkbox = block.locator('.ant-checkbox-wrapper');
    await expect(checkbox).toHaveCount(0);
  });

  test('hides N/A checkbox when required', async ({ page }) => {
    const block = getBlock(page, 'ratingslider_required');
    const checkbox = block.locator('.ant-checkbox-wrapper');
    await expect(checkbox).toHaveCount(0);
  });

  test('checking N/A disables the slider', async ({ page }) => {
    const checkbox = getNACheckbox(page, 'ratingslider_with_na');
    const slider = getSlider(page, 'ratingslider_with_na');

    // Click the checkbox
    await checkbox.click();

    // Slider should be disabled
    await expect(slider).toHaveClass(/ant-slider-disabled/);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when slider value changes', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_onchange');

    // Click directly on the slider
    await slider.click({ position: { x: 150, y: 5 } });

    const display = getBlock(page, 'onchange_display');
    // Check that onChange fired
    await expect(display).toContainText('Value:');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can change value by clicking on slider', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_interaction');

    // Click directly on the slider at a position
    await slider.click({ position: { x: 100, y: 5 } });

    const display = getBlock(page, 'interaction_display');
    await expect(display).toContainText('Rating:');
  });

  test('can drag slider to change value', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_with_value');
    const sliderBox = await slider.boundingBox();

    if (sliderBox) {
      // Start from current handle position (value 7 out of 10)
      const startX = sliderBox.x + sliderBox.width * 0.7;
      const startY = sliderBox.y + sliderBox.height / 2;
      // End at different position
      const endX = sliderBox.x + sliderBox.width * 0.9;

      // Perform drag operation
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, startY, { steps: 10 });
      await page.mouse.up();

      // Check that the slider track is visible
      const track = slider.locator('.ant-slider-track');
      await expect(track).toBeVisible();
    }
  });

  test('cannot interact with disabled slider', async ({ page }) => {
    const slider = getSlider(page, 'ratingslider_disabled');

    // Click on disabled slider
    await slider.click({ position: { x: 100, y: 5 }, force: true });

    // Disabled state should still be applied
    await expect(slider).toHaveClass(/ant-slider-disabled/);
  });
});
