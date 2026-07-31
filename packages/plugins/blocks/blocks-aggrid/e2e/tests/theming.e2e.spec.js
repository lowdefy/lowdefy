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

// The Theming API paints .ag-row and .ag-root-wrapper from --ag-background-color; nothing paints
// .ag-cell, so a cell resolves to rgba(0, 0, 0, 0) in both modes and would make the dark-mode
// assertion vacuous. Odd rows read --ag-odd-row-background-color, which the Lowdefy blocks set to
// transparent on purpose, so read row-index="0".
const rowBackground = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-row[row-index="0"]')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

const wrapperBackground = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-root-wrapper')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

const wrapperColorScheme = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-root-wrapper')
    .first()
    .evaluate((el) => getComputedStyle(el).colorScheme);

// The resolved colours come from antd's dark algorithm and must never be hardcoded here — the
// assertions are on change plus luminance direction, so a token change does not break the test.
function luminance(color) {
  const [r, g, b] = color
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const boxHeight = async (locator) => (await locator.first().boundingBox()).height;

const rowHeight = (page, blockId) => boxHeight(getBlock(page, blockId).locator('.ag-row'));

const headerHeight = (page, blockId) =>
  boxHeight(getBlock(page, blockId).locator('.ag-header-row'));

const isDark = (page) => page.evaluate(() => window.__lowdefy_isDark);

// The block wrapper is full width, so click the button element rather than the wrapper's centre.
const clickButton = (page, blockId) => getBlock(page, blockId).locator('button').click();

// AG Grid errors 106 and 239 are the two legacy-CSS diagnostics: 106 fires when a Theming API theme
// is passed while ag-grid.css is in the document, 239 when no theme is passed and the default
// applies. Matched on the error numbers and their message text rather than on a broad
// /theme|legacy|ag-grid/i, which would trip on the suppressLoadingOverlay deprecation every v33 grid
// logs and on columnMenu="legacy" diagnostics.
const LEGACY_CSS_ERROR =
  /error #(106|239)\b|Theming API and (Legacy Themes|CSS File Themes) are both used/i;

function collectConsoleMessages(page) {
  const messages = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') messages.push(msg.text());
  });
  return messages;
}

test.describe('AG Grid theming', () => {
  test.beforeEach(async ({ page }) => {
    // SetDarkMode persists the preference in localStorage, so clear it on every navigation to keep
    // the tests independent of the order they run in.
    await page.addInitScript(() => window.localStorage.removeItem('lowdefy_darkMode'));
  });

  // ============================================
  // DARK MODE
  // ============================================

  test.describe('dark mode', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToTestPage(page, 'aggridtheming');
      await expect(getBlock(page, 'theming_dark_grid').locator('.ag-root-wrapper')).toBeVisible();
    });

    test('row background follows dark mode with no block-level JS', async ({ page }) => {
      const lightRow = await rowBackground(page, 'theming_dark_grid');
      expect(luminance(lightRow)).toBeGreaterThan(0.7);

      await clickButton(page, 'theming_dark_on');
      await expect.poll(() => isDark(page)).toBe(true);
      await expect.poll(() => rowBackground(page, 'theming_dark_grid')).not.toBe(lightRow);
      expect(luminance(await rowBackground(page, 'theming_dark_grid'))).toBeLessThan(0.3);

      await clickButton(page, 'theming_dark_off');
      await expect.poll(() => isDark(page)).toBe(false);
      await expect.poll(() => rowBackground(page, 'theming_dark_grid')).toBe(lightRow);
    });

    test('root wrapper background follows dark mode', async ({ page }) => {
      const lightWrapper = await wrapperBackground(page, 'theming_dark_grid');
      expect(luminance(lightWrapper)).toBeGreaterThan(0.7);

      await clickButton(page, 'theming_dark_on');
      await expect.poll(() => isDark(page)).toBe(true);
      await expect.poll(() => wrapperBackground(page, 'theming_dark_grid')).not.toBe(lightWrapper);
      expect(luminance(await wrapperBackground(page, 'theming_dark_grid'))).toBeLessThan(0.3);

      await clickButton(page, 'theming_dark_off');
      await expect.poll(() => wrapperBackground(page, 'theming_dark_grid')).toBe(lightWrapper);
    });

    // color-scheme is not a colour and no antd token carries it, so this half rides on the theme's
    // browserColorScheme: 'inherit' plus the color-scheme the client sets on <html>. Asserted as a
    // computed property rather than a screenshot: scrollbar rendering is platform-dependent, the
    // property is not.
    test('browser chrome follows dark mode through color-scheme', async ({ page }) => {
      await expect.poll(() => wrapperColorScheme(page, 'theming_dark_grid')).toBe('light');

      await clickButton(page, 'theming_dark_on');
      await expect.poll(() => isDark(page)).toBe(true);
      await expect.poll(() => wrapperColorScheme(page, 'theming_dark_grid')).toBe('dark');

      await clickButton(page, 'theming_dark_off');
      await expect.poll(() => isDark(page)).toBe(false);
      await expect.poll(() => wrapperColorScheme(page, 'theming_dark_grid')).toBe('light');
    });
  });

  // ============================================
  // SIZE — row density
  // ============================================

  test.describe('size', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToTestPage(page, 'aggridtheming');
      await expect(getBlock(page, 'theming_size_small').locator('.ag-row').first()).toBeVisible();
    });

    test('size gives distinct display row heights of 36, 44 and 54', async ({ page }) => {
      const small = await rowHeight(page, 'theming_size_small');
      const middle = await rowHeight(page, 'theming_size_middle');
      const large = await rowHeight(page, 'theming_size_large');

      expect(small).toBeCloseTo(36, 0);
      expect(middle).toBeCloseTo(44, 0);
      expect(large).toBeCloseTo(54, 0);
      // Asserted distinct so a bug where every size resolves to the middle fallback fails loudly.
      expect(new Set([small, middle, large]).size).toBe(3);
    });

    test('header heights match the display row heights', async ({ page }) => {
      expect(await headerHeight(page, 'theming_size_small')).toBeCloseTo(36, 0);
      expect(await headerHeight(page, 'theming_size_middle')).toBeCloseTo(44, 0);
      expect(await headerHeight(page, 'theming_size_large')).toBeCloseTo(54, 0);
    });

    test('input grids get the same row heights at small and large', async ({ page }) => {
      const small = await rowHeight(page, 'theming_input_size_small');
      const large = await rowHeight(page, 'theming_input_size_large');

      expect(small).toBeCloseTo(36, 0);
      expect(large).toBeCloseTo(54, 0);
      expect(small).not.toBeCloseTo(large, 0);
    });

    test('avatars track size at small and large', async ({ page }) => {
      const small = getBlock(page, 'theming_size_small').locator('.ant-avatar').first();
      await expect(small).toHaveCSS('width', '20px');
      await expect(small).toHaveCSS('height', '20px');

      const large = getBlock(page, 'theming_size_large').locator('.ant-avatar').first();
      await expect(large).toHaveCSS('width', '28px');
      await expect(large).toHaveCSS('height', '28px');
    });
  });

  // ============================================
  // NO LEGACY-CSS ERROR
  // ============================================

  // The cause of error 106 was never per-page: a single ag-grid.css import anywhere in the bundle
  // breaks theming for every grid in the app, so both a mixed page and a Lowdefy-only page are
  // checked. Console collection starts before the navigation so the whole page load is covered.
  test.describe('legacy CSS error', () => {
    test('is absent with a Balham and a Lowdefy grid on one page', async ({ page }) => {
      const messages = collectConsoleMessages(page);
      await navigateToTestPage(page, 'aggridtheming');
      await expect(
        getBlock(page, 'theming_mixed_legacy').locator('.ag-root-wrapper')
      ).toBeVisible();
      await expect(
        getBlock(page, 'theming_mixed_lowdefy').locator('.ag-root-wrapper')
      ).toBeVisible();
      expect(messages.filter((message) => LEGACY_CSS_ERROR.test(message))).toEqual([]);
    });

    test('is absent on a page of AgGridLowdefy grids only', async ({ page }) => {
      const messages = collectConsoleMessages(page);
      await navigateToTestPage(page, 'aggridlowdefy');
      await expect(getBlock(page, 'aggridlowdefy_basic').locator('.ag-root-wrapper')).toBeVisible();
      expect(messages.filter((message) => LEGACY_CSS_ERROR.test(message))).toEqual([]);
    });
  });
});
