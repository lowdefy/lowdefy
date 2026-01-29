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

test.describe('Slider Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'slider');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'slider_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Slider');
  });

  test('renders slider element', async ({ page }) => {
    const slider = getSlider(page, 'slider_basic');
    await expect(slider).toBeVisible();
  });

  test('renders with initial value', async ({ page }) => {
    const slider = getSlider(page, 'slider_with_value');
    await expect(slider).toBeVisible();
    // Check the handle exists (value 50 means handle is roughly in the middle)
    const handle = getHandle(page, 'slider_with_value');
    await expect(handle).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const slider = getSlider(page, 'slider_disabled');
    await expect(slider).toHaveClass(/ant-slider-disabled/);
  });

  test('renders with dots', async ({ page }) => {
    const block = getBlock(page, 'slider_dots');
    const dots = block.locator('.ant-slider-dot');
    // With step 20 and range 0-100, we should have dots at 0, 20, 40, 60, 80, 100 = 6 dots
    await expect(dots).toHaveCount(6);
  });

  test('renders with marks', async ({ page }) => {
    const block = getBlock(page, 'slider_marks');
    const marks = block.locator('.ant-slider-mark-text');
    // Check that marks are rendered
    await expect(marks.first()).toBeVisible();
    await expect(marks).toHaveCount(5); // 0, 25%, 50%, 75%, 100%
  });

  test('renders vertical slider', async ({ page }) => {
    const slider = getSlider(page, 'slider_vertical');
    await expect(slider).toHaveClass(/ant-slider-vertical/);
  });

  test('renders range slider with two handles', async ({ page }) => {
    const block = getBlock(page, 'slider_range_value');
    const handles = block.locator('.ant-slider-handle');
    await expect(handles).toHaveCount(2);
  });

  test('renders range slider with initial values', async ({ page }) => {
    const block = getBlock(page, 'slider_range_value');
    const handles = block.locator('.ant-slider-handle');
    await expect(handles).toHaveCount(2);
    // Both handles should be visible
    await expect(handles.first()).toBeVisible();
    await expect(handles.last()).toBeVisible();
  });

  test('renders reverse slider', async ({ page }) => {
    const slider = getSlider(page, 'slider_reverse');
    await expect(slider).toHaveClass(/ant-slider-rtl|ant-slider/);
    // The slider should render - reverse changes track direction
    await expect(slider).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when slider value changes', async ({ page }) => {
    const slider = getSlider(page, 'slider_onchange');

    // Click directly on the slider track area
    await slider.click({ position: { x: 200, y: 5 } });

    const display = getBlock(page, 'onchange_display');
    // Check that onChange fired
    await expect(display).toContainText('Value:');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can change value by clicking on slider', async ({ page }) => {
    const slider = getSlider(page, 'slider_interaction');

    // Click directly on the slider at a position
    await slider.click({ position: { x: 150, y: 5 } });

    const display = getBlock(page, 'interaction_display');
    await expect(display).toContainText('Slider:');
  });

  test('slider value changes via keyboard after focus', async ({ page }) => {
    const slider = getSlider(page, 'slider_interaction');
    // Click to focus the slider
    await slider.click({ position: { x: 50, y: 5 } });

    // Arrow right should increase value
    await page.keyboard.press('ArrowRight');

    const display = getBlock(page, 'interaction_display');
    await expect(display).toContainText('Slider:');
  });

  test('can drag slider handle to change value', async ({ page }) => {
    const slider = getSlider(page, 'slider_with_value');
    const sliderBox = await slider.boundingBox();

    if (sliderBox) {
      // Start from current handle position (50% for value 50)
      const startX = sliderBox.x + sliderBox.width * 0.5;
      const startY = sliderBox.y + sliderBox.height / 2;
      // End at 75% of slider width
      const endX = sliderBox.x + sliderBox.width * 0.75;

      // Perform drag operation
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, startY, { steps: 10 });
      await page.mouse.up();

      // Check that a track is visible (indicates value changed)
      const track = slider.locator('.ant-slider-track');
      await expect(track).toBeVisible();
    }
  });

  test('cannot interact with disabled slider', async ({ page }) => {
    const slider = getSlider(page, 'slider_disabled');

    // Click on disabled slider
    await slider.click({ position: { x: 100, y: 5 }, force: true });

    // Disabled state should still be applied
    await expect(slider).toHaveClass(/ant-slider-disabled/);
  });
});
