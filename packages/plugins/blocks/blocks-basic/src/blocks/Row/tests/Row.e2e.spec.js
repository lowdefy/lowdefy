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

// Row renders a flex row with id={blockId}.
// Structure: #bl-{blockId} (layout wrapper) > #{blockId} (flex container)
const getRowElement = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Row Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'row');
  });

  test('renders a flex row', async ({ page }) => {
    const row = getRowElement(page, 'row_basic');
    await expect(row).toBeVisible();
    await expect(row).toHaveCSS('display', 'flex');
    await expect(row).toHaveCSS('flex-direction', 'row');
  });

  test('lays children out side by side and keeps their #bl- wrappers', async ({ page }) => {
    const first = getBlock(page, 'row_basic_first');
    const second = getBlock(page, 'row_basic_second');
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(secondBox.x).toBeGreaterThan(firstBox.x);
    expect(secondBox.y).toBe(firstBox.y);
  });

  test('a child sizes itself with its own class', async ({ page }) => {
    const fixed = getBlock(page, 'row_sized_fixed');
    const fill = getBlock(page, 'row_sized_fill');
    const fixedBox = await fixed.boundingBox();
    const fillBox = await fill.boundingBox();
    expect(fixedBox.width).toBe(128);
    expect(fillBox.width).toBeGreaterThan(fixedBox.width);
  });

  test('gap, align and justify map to flex utilities', async ({ page }) => {
    const row = getRowElement(page, 'row_arranged');
    await expect(row).toHaveCSS('column-gap', '24px');
    await expect(row).toHaveCSS('align-items', 'center');
    await expect(row).toHaveCSS('justify-content', 'space-between');
    await expect(row).toHaveCSS('flex-wrap', 'nowrap');
  });
});
