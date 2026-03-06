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

// ===========================================
// CHOOSE THE APPROPRIATE HELPER FOR YOUR BLOCK TYPE:
// ===========================================

// For Display Blocks (Button, Alert, Badge, etc.):
// getBlock() returns the framework wrapper (#bl-{blockId})
// Locate the Ant Design component inside the wrapper
const getButton = (page, blockId) => getBlock(page, blockId).locator('.ant-btn');

// For Input Blocks (TextInput, NumberInput, etc.):
// Input element has a specific ID pattern
// const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// For Selector Blocks (Selector, MultipleSelector, etc.):
// const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);
// const getOption = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

test.describe('BlockName Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'blockname'); // matches yaml page id
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  test('renders basic block', async ({ page }) => {
    const block = getBlock(page, 'blockname_basic');
    await expect(block).toBeVisible();
    // Locate Ant component inside wrapper for further assertions
    const button = getButton(page, 'blockname_basic');
    await expect(button).toHaveText('Expected Title');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with property variant', async ({ page }) => {
    // Check class on the Ant component, not the wrapper
    const button = getButton(page, 'blockname_variant');
    await expect(button).toHaveClass(/ant-btn-primary/);
  });

  test('renders disabled state', async ({ page }) => {
    const button = getButton(page, 'blockname_disabled');
    await expect(button).toBeDisabled();
  });

  test('renders with size property', async ({ page }) => {
    const button = getButton(page, 'blockname_small');
    await expect(button).toHaveClass(/ant-btn-sm/);
  });

  // ============================================
  // ATTRIBUTE TESTS
  // ============================================

  test('sets href attribute correctly', async ({ page }) => {
    const button = getButton(page, 'blockname_href');
    await expect(button).toHaveAttribute('href', 'https://example.com');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('applies custom color style', async ({ page }) => {
    const button = getButton(page, 'blockname_color');
    await expect(button).toHaveCSS('background-color', 'rgb(82, 196, 26)');
  });

  // ============================================
  // CHILD ELEMENT TESTS
  // ============================================

  test('renders with icon', async ({ page }) => {
    const button = getButton(page, 'blockname_with_icon');
    await expect(button).toBeVisible();
    const svg = button.locator('svg');
    await expect(svg).toBeAttached();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires and updates state', async ({ page }) => {
    const button = getButton(page, 'blockname_clickable');
    await expect(button).toHaveText('Click me');
    await button.click();
    await expect(button).toHaveText('Clicked!');
  });

  test('shows loading spinner during async action', async ({ page }) => {
    const button = getButton(page, 'blockname_loading');
    await button.click();
    // Check for loading class on Ant component
    await expect(button).toHaveClass(/ant-btn-loading/);
  });

  // ============================================
  // EDGE CASE TESTS (optional)
  // ============================================

  test('handles empty content gracefully', async ({ page }) => {
    const button = getButton(page, 'blockname_empty');
    await expect(button).toBeVisible();
  });
});
