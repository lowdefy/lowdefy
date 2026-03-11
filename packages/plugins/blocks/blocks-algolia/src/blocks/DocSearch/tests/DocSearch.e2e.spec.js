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

// DocSearch renders the Algolia DocSearch widget with a search button.
// API credentials are test values so search results won't work,
// but we can test rendering and UI interactions.
const getSearchButton = (page, blockId) => getBlock(page, blockId).locator('.DocSearch-Button');

test.describe('DocSearch Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'docsearch');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders search button', async ({ page }) => {
    const block = getBlock(page, 'docsearch_basic');
    await expect(block).toBeVisible();
    const button = getSearchButton(page, 'docsearch_basic');
    await expect(button).toBeVisible();
  });

  test('search button has placeholder text', async ({ page }) => {
    const button = getSearchButton(page, 'docsearch_basic');
    const placeholder = button.locator('.DocSearch-Button-Placeholder');
    await expect(placeholder).toBeVisible();
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('clicking search button opens modal', async ({ page }) => {
    const button = getSearchButton(page, 'docsearch_basic');
    await button.click();
    const modal = page.locator('.DocSearch-Modal');
    await expect(modal).toBeVisible();
  });

  test('modal contains search input', async ({ page }) => {
    const button = getSearchButton(page, 'docsearch_basic');
    await button.click();
    const searchInput = page.locator('.DocSearch-Input');
    await expect(searchInput).toBeVisible();
  });

  test('modal can be closed with escape', async ({ page }) => {
    const button = getSearchButton(page, 'docsearch_basic');
    await button.click();
    const modal = page.locator('.DocSearch-Modal');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('initialQuery populates search input when modal opens', async ({ page }) => {
    const button = getSearchButton(page, 'docsearch_with_initial_query');
    await button.click();
    const searchInput = page.locator('.DocSearch-Input');
    await expect(searchInput).toHaveValue('lowdefy');
  });
});
