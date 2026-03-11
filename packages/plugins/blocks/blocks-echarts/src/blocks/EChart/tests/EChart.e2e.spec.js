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

// EChart renders a wrapper div containing echarts-for-react.
// Default renderer is canvas; SVG renderer renders an svg element.
const getCanvas = (page, blockId) => getBlock(page, blockId).locator('canvas');
const getSvg = (page, blockId) => getBlock(page, blockId).locator('svg');

test.describe('EChart Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'echart');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic chart with canvas', async ({ page }) => {
    const block = getBlock(page, 'echart_basic');
    await expect(block).toBeVisible();
    const canvas = getCanvas(page, 'echart_basic');
    await expect(canvas).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom height', async ({ page }) => {
    const block = getBlock(page, 'echart_height');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.height).toBeCloseTo(200, -1);
  });

  test('renders with custom width', async ({ page }) => {
    const block = getBlock(page, 'echart_width');
    await expect(block).toBeVisible();
    const box = await block.boundingBox();
    expect(box.width).toBeCloseTo(400, -1);
  });

  test('renders with SVG renderer', async ({ page }) => {
    const block = getBlock(page, 'echart_svg_renderer');
    await expect(block).toBeVisible();
    const svg = getSvg(page, 'echart_svg_renderer');
    await expect(svg).toBeVisible();
  });

  test('renders pie chart', async ({ page }) => {
    const block = getBlock(page, 'echart_pie');
    await expect(block).toBeVisible();
    const canvas = getCanvas(page, 'echart_pie');
    await expect(canvas).toBeVisible();
  });

  test('renders chart with title', async ({ page }) => {
    const block = getBlock(page, 'echart_with_title');
    await expect(block).toBeVisible();
    const canvas = getCanvas(page, 'echart_with_title');
    await expect(canvas).toBeVisible();
  });

  test('renders with null dataset source', async ({ page }) => {
    const block = getBlock(page, 'echart_empty_dataset');
    await expect(block).toBeVisible();
    const canvas = getCanvas(page, 'echart_empty_dataset');
    await expect(canvas).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('click event fires when chart is clicked', async ({ page }) => {
    const block = getBlock(page, 'echart_onclick');
    const canvas = getCanvas(page, 'echart_onclick');
    await expect(canvas).toBeVisible();
    // Click on the canvas area where a bar should be rendered
    await canvas.click();
    const display = getBlock(page, 'click_display');
    await expect(display).toHaveText('Chart clicked');
  });
});
