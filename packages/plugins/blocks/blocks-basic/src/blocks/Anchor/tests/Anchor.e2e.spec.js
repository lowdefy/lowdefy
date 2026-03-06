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

// Anchor renders a Link component with id={blockId}
// Structure: #bl-{blockId} (wrapper) > #{blockId} (Link/anchor element)
const getAnchor = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Anchor Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'anchor');
  });

  test('renders basic Anchor with title', async ({ page }) => {
    const wrapper = getBlock(page, 'anchor_basic');
    await expect(wrapper).toBeAttached();
    const anchor = getAnchor(page, 'anchor_basic');
    await expect(anchor).toHaveText('Basic Anchor');
  });

  test('renders with icon', async ({ page }) => {
    const anchor = getAnchor(page, 'anchor_with_icon');
    await expect(anchor).toBeVisible();
    // Icon should be rendered as SVG within the anchor
    const svg = anchor.locator('svg');
    await expect(svg).toBeAttached();
  });

  test('applies disabled styling', async ({ page }) => {
    const anchor = getAnchor(page, 'anchor_disabled');
    await expect(anchor).toHaveCSS('cursor', 'not-allowed');
  });

  test('href attribute is set correctly', async ({ page }) => {
    const anchor = getAnchor(page, 'anchor_href');
    await expect(anchor).toHaveAttribute('href', 'https://lowdefy.com');
  });

  test('newTab sets target="_blank"', async ({ page }) => {
    const anchor = getAnchor(page, 'anchor_newtab');
    await expect(anchor).toHaveAttribute('target', '_blank');
  });

  test('onClick event fires and updates state', async ({ page }) => {
    const anchor = getAnchor(page, 'anchor_clickable');
    await expect(anchor).toHaveText('Click me');
    await anchor.click();
    await expect(anchor).toHaveText('Clicked!');
  });
});
