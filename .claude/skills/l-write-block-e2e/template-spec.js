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

test.describe('BlockName Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'blockname'); // matches yaml page id
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  test('renders basic block with data-testid', async ({ page }) => {
    const block = getBlock(page, 'blockname_basic');
    await expect(block).toBeVisible();
  });

  test('renders with title property', async ({ page }) => {
    const block = getBlock(page, 'blockname_basic');
    await expect(block).toHaveText('Expected Title');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with property variant', async ({ page }) => {
    const block = getBlock(page, 'blockname_variant');
    await expect(block).toHaveClass(/expected-class/);
  });

  test('renders disabled state', async ({ page }) => {
    const block = getBlock(page, 'blockname_disabled');
    await expect(block).toBeDisabled();
  });

  test('renders with size property', async ({ page }) => {
    const block = getBlock(page, 'blockname_small');
    await expect(block).toHaveClass(/size-class-sm/);
  });

  // ============================================
  // ATTRIBUTE TESTS
  // ============================================

  test('sets href attribute correctly', async ({ page }) => {
    const block = getBlock(page, 'blockname_href');
    await expect(block).toHaveAttribute('href', 'https://example.com');
  });

  test('sets target="_blank" for newTab', async ({ page }) => {
    const block = getBlock(page, 'blockname_newtab');
    await expect(block).toHaveAttribute('target', '_blank');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('applies custom color style', async ({ page }) => {
    const block = getBlock(page, 'blockname_color');
    await expect(block).toHaveCSS('background-color', 'rgb(82, 196, 26)');
  });

  test('applies disabled cursor style', async ({ page }) => {
    const block = getBlock(page, 'blockname_disabled');
    await expect(block).toHaveCSS('cursor', 'not-allowed');
  });

  // ============================================
  // CHILD ELEMENT TESTS
  // ============================================

  test('renders with icon', async ({ page }) => {
    const block = getBlock(page, 'blockname_with_icon');
    await expect(block).toBeVisible();
    const svg = block.locator('svg');
    await expect(svg).toBeAttached();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires and updates state', async ({ page }) => {
    const block = getBlock(page, 'blockname_clickable');
    await expect(block).toHaveText('Click me');
    await block.click();
    await expect(block).toHaveText('Clicked!');
  });

  test('shows loading spinner during async action', async ({ page }) => {
    const block = getBlock(page, 'blockname_loading');
    await block.click();
    // Check for loading class/state immediately after click
    await expect(block).toHaveClass(/loading-class/);
  });

  // ============================================
  // EDGE CASE TESTS (optional)
  // ============================================

  test('handles empty content gracefully', async ({ page }) => {
    const block = getBlock(page, 'blockname_empty');
    await expect(block).toBeVisible();
    await expect(block).toHaveText('');
  });
});
