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

// Grid renders a CSS grid with id={blockId}.
// Structure: #bl-{blockId} (layout wrapper) > #{blockId} (grid container)
const getGridElement = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Grid Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'grid');
  });

  test('renders a css grid of 24 columns by default', async ({ page }) => {
    const grid = getGridElement(page, 'grid_basic');
    await expect(grid).toBeVisible();
    await expect(grid).toHaveCSS('display', 'grid');
    const tracks = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' '));
    expect(tracks).toHaveLength(24);
  });

  test('a child spans columns with col-span-N', async ({ page }) => {
    const main = getBlock(page, 'grid_basic_main');
    const side = getBlock(page, 'grid_basic_side');
    const mainBox = await main.boundingBox();
    const sideBox = await side.boundingBox();
    expect(sideBox.y).toBe(mainBox.y);
    expect(mainBox.width / sideBox.width).toBeCloseTo(2, 1);
  });

  test('columns sets the track count', async ({ page }) => {
    const grid = getGridElement(page, 'grid_tiles');
    const tracks = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' '));
    expect(tracks).toHaveLength(4);
    const one = await getBlock(page, 'grid_tiles_one').boundingBox();
    const four = await getBlock(page, 'grid_tiles_four').boundingBox();
    expect(four.y).toBe(one.y);
    expect(four.x).toBeGreaterThan(one.x);
  });
});
