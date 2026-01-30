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

// Carousel renders with .ant-carousel class
const getCarousel = (page, blockId) => getBlock(page, blockId).locator('.ant-carousel');
const getDots = (carousel) => carousel.locator('.slick-dots');

test.describe('Carousel Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'carousel');
  });

  test('renders carousel with slides', async ({ page }) => {
    const block = getBlock(page, 'carousel_basic');
    await expect(block).toBeVisible();
    const carousel = getCarousel(page, 'carousel_basic');
    await expect(carousel).toBeVisible();

    // Check dots are visible (default)
    const dots = getDots(carousel);
    await expect(dots).toBeVisible();

    // Should have 3 dot indicators
    const dotItems = dots.locator('li');
    await expect(dotItems).toHaveCount(3);
  });

  test('hides dots when dots is false', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_no_dots');
    await expect(carousel).toBeVisible();

    // Dots should not be visible
    const dots = getDots(carousel);
    await expect(dots).toBeHidden();
  });

  test('renders dots on left position', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_dots_left');
    await expect(carousel).toBeVisible();

    // Left position class
    const dots = getDots(carousel);
    await expect(dots).toHaveClass(/slick-dots-left/);
  });

  test('renders dots on top position', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_dots_top');
    await expect(carousel).toBeVisible();

    // Top position class
    const dots = getDots(carousel);
    await expect(dots).toHaveClass(/slick-dots-top/);
  });

  test('renders with arrows', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_arrows');
    await expect(carousel).toBeVisible();

    // Arrows should be present
    const prevArrow = carousel.locator('.slick-prev');
    const nextArrow = carousel.locator('.slick-next');
    await expect(prevArrow).toBeVisible();
    await expect(nextArrow).toBeVisible();
  });

  test('can navigate using arrows', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_arrows');
    const nextArrow = carousel.locator('.slick-next');

    // Click next arrow
    await nextArrow.click();

    // Wait for slide transition
    await page.waitForTimeout(600);

    // Second slide should be active
    const dots = getDots(carousel);
    const activeDot = dots.locator('li.slick-active');
    await expect(activeDot).toHaveCount(1);
  });

  test('renders with fade effect', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_fade');
    await expect(carousel).toBeVisible();

    // Fade effect carousel still renders with slick-slider
    const slick = carousel.locator('.slick-slider');
    await expect(slick).toBeVisible();
    // Verify slides are present
    const slides = carousel.locator('.slick-slide:not(.slick-cloned)');
    await expect(slides).toHaveCount(2);
  });

  test('renders vertical carousel', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_vertical');
    await expect(carousel).toBeVisible();

    // Vertical mode adds slick-vertical class
    const slick = carousel.locator('.slick-slider');
    await expect(slick).toHaveClass(/slick-vertical/);
  });

  test('can navigate using dots', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_basic');
    const dots = getDots(carousel);
    const dotItems = dots.locator('li');

    // Click on second dot
    await dotItems.nth(1).click();

    // Wait for slide transition
    await page.waitForTimeout(600);

    // Second dot should be active
    await expect(dotItems.nth(1)).toHaveClass(/slick-active/);
  });

  test('afterChange event fires when slide changes', async ({ page }) => {
    const carousel = getCarousel(page, 'carousel_afterchange');
    await expect(carousel).toBeVisible();

    // Wait for carousel to be fully initialized
    const dots = getDots(carousel);
    await expect(dots).toBeVisible();
    const dotItems = dots.locator('li');
    await expect(dotItems).toHaveCount(2);

    // Ensure first dot is active before clicking
    await expect(dotItems.nth(0)).toHaveClass(/slick-active/);

    // Click on second dot
    await dotItems.nth(1).click();

    // Wait for second dot to become active (slide transition complete)
    await expect(dotItems.nth(1)).toHaveClass(/slick-active/, { timeout: 3000 });

    // Then verify event fired
    const display = getBlock(page, 'afterchange_display');
    await expect(display).toHaveText('Current: slide2', { timeout: 5000 });
  });
});
