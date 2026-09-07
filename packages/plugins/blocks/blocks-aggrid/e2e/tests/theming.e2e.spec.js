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

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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

// row-index="1" is the odd row, the one --ag-odd-row-background-color paints. Every grid read this
// way needs at least two rows on the theming page.
const oddRowBackground = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-row[row-index="1"]')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

// headerBackgroundColor paints .ag-header, not .ag-header-cell — the cell resolves to
// rgba(0, 0, 0, 0) and reading it would make the themeParams assertions vacuous.
const headerBackground = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-header')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

// A custom property's computed value has its var() references substituted, so this reads the
// resolved colour a param chain lands on without needing the surface that consumes it to be
// on screen.
const cssVariable = (page, blockId, variable) =>
  getBlock(page, blockId)
    .locator('.ag-root-wrapper')
    .first()
    .evaluate((el, name) => getComputedStyle(el).getPropertyValue(name).trim(), variable);

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

const wrapperBorderRadius = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-root-wrapper')
    .first()
    .evaluate((el) => getComputedStyle(el).borderRadius);

const headerFontWeight = (page, blockId) =>
  getBlock(page, blockId)
    .locator('.ag-header-cell')
    .first()
    .evaluate((el) => getComputedStyle(el).fontWeight);

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

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');

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

    // antdParams is shared by all eight blocks, so dark mode is not an AgGridLowdefy claim — a
    // regression confined to themeBalhamAntd or to the input core's wrapper would leave the three
    // tests above untouched. row-index="0" is an even row, so it reads the background colour rather
    // than the odd-row colour on both: the legacy bases carry antdParams' real oddRowBackgroundColor
    // instead of the Lowdefy blocks' transparent, and reading an odd row would compare two different
    // params across the two block families.
    test('row background follows dark mode on a legacy-base block', async ({ page }) => {
      const lightRow = await rowBackground(page, 'theming_mixed_legacy');
      expect(luminance(lightRow)).toBeGreaterThan(0.7);

      await clickButton(page, 'theming_dark_on');
      await expect.poll(() => isDark(page)).toBe(true);
      await expect.poll(() => rowBackground(page, 'theming_mixed_legacy')).not.toBe(lightRow);
      expect(luminance(await rowBackground(page, 'theming_mixed_legacy'))).toBeLessThan(0.3);

      await clickButton(page, 'theming_dark_off');
      await expect.poll(() => isDark(page)).toBe(false);
      await expect.poll(() => rowBackground(page, 'theming_mixed_legacy')).toBe(lightRow);
    });

    test('row background follows dark mode on an input block', async ({ page }) => {
      const lightRow = await rowBackground(page, 'theming_input_size_small');
      expect(luminance(lightRow)).toBeGreaterThan(0.7);

      await clickButton(page, 'theming_dark_on');
      await expect.poll(() => isDark(page)).toBe(true);
      await expect.poll(() => rowBackground(page, 'theming_input_size_small')).not.toBe(lightRow);
      expect(luminance(await rowBackground(page, 'theming_input_size_small'))).toBeLessThan(0.3);

      await clickButton(page, 'theming_dark_off');
      await expect.poll(() => isDark(page)).toBe(false);
      await expect.poll(() => rowBackground(page, 'theming_input_size_small')).toBe(lightRow);
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
  // MIXED — two theme objects on one page
  // ============================================

  test.describe('theme independence', () => {
    // AG Grid gives each theme object its own params class, so a collision would let one grid's
    // params leak onto the other and every other assertion on this page would still pass. Both
    // properties read here are ones the two theme objects genuinely disagree on: Balham's base sets
    // wrapperBorderRadius: 2 and headerFontWeight: 'bold', and neither is in antdParams, while
    // lowdefyParams sets wrapperBorderRadius to --ant-border-radius-lg and headerFontWeight: 600.
    test('a Balham and a Lowdefy grid on one page keep their own theme params', async ({
      page,
    }) => {
      await navigateToTestPage(page, 'aggridtheming');
      await expect(
        getBlock(page, 'theming_mixed_legacy').locator('.ag-root-wrapper')
      ).toBeVisible();
      await expect(
        getBlock(page, 'theming_mixed_lowdefy').locator('.ag-root-wrapper')
      ).toBeVisible();

      // The Lowdefy radius resolves from an antd token, so this is asserted as a difference rather
      // than against a pixel value a token change could move.
      expect(await wrapperBorderRadius(page, 'theming_mixed_legacy')).not.toBe(
        await wrapperBorderRadius(page, 'theming_mixed_lowdefy')
      );

      // Both weights are literals in the theme module, not tokens, so these are pinned: 'bold' and
      // 600 each resolving to the other's value is a leak in a specific direction.
      expect(await headerFontWeight(page, 'theming_mixed_legacy')).toBe('700');
      expect(await headerFontWeight(page, 'theming_mixed_lowdefy')).toBe('600');
    });
  });

  // ============================================
  // THEME PARAMS
  // ============================================

  test.describe('themeParams', () => {
    // useGridTheme calls baseTheme.withParams(themeParams), which returns a new theme object rather
    // than mutating the base. Nothing in the module enforces that, so the sibling half of this test
    // is the one that would catch a rewrite that merged into the shared module-scope object: every
    // AgGridLowdefy on the page would go magenta together and the difference half alone would still
    // pass.
    test('themeParams changes only the grid that declares it', async ({ page }) => {
      await navigateToTestPage(page, 'aggridtheming');
      await expect(getBlock(page, 'theming_params_override').locator('.ag-header')).toBeVisible();
      await expect(getBlock(page, 'theming_params_sibling').locator('.ag-header')).toBeVisible();

      const override = await headerBackground(page, 'theming_params_override');
      const sibling = await headerBackground(page, 'theming_params_sibling');

      expect(override).not.toBe(sibling);
      // Pinned to the literal the page config declares, not to a resolved token, so the difference
      // above cannot be satisfied by some other divergence between the two grids.
      expect(override).toBe('rgb(255, 0, 255)');

      // A third default AgGridLowdefy: the sibling matching it is what "untouched" means here.
      expect(sibling).toBe(await headerBackground(page, 'theming_dark_grid'));
    });
  });

  // ============================================
  // LEGACY BASE IDENTITY
  // ============================================

  // lowdefyParams must not reach the prebuilt bases. Balham's wrapperBorderRadius and
  // headerFontWeight are covered under theme independence above; these are the rest of the list.
  test.describe('legacy base identity', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToTestPage(page, 'aggridtheming');
      await expect(
        getBlock(page, 'theming_legacy_material').locator('.ag-row[row-index="1"]')
      ).toBeVisible();
    });

    test('Material keeps its own square wrapper corners', async ({ page }) => {
      // 0 is a literal on AG Grid's Material base. The Lowdefy comparison is what makes the failure
      // legible: lowdefyParams reaching Material would give it the antd radius instead.
      expect(await wrapperBorderRadius(page, 'theming_legacy_material')).toBe('0px');
      expect(await wrapperBorderRadius(page, 'theming_legacy_material')).not.toBe(
        await wrapperBorderRadius(page, 'theming_mixed_lowdefy')
      );
    });

    // The zebra is antdParams' oddRowBackgroundColor, not anything the bases bring — v33 defaults
    // the param to backgroundColor, so Alpine and Material have no stripe of their own. The Lowdefy
    // blocks override it to transparent, so the contrast between the two families is the assertion:
    // a param moved from antdParams to lowdefyParams (or the reverse) breaks one side or the other.
    test('the legacy bases stripe alternating rows and the Lowdefy blocks do not', async ({
      page,
    }) => {
      for (const blockId of [
        'theming_mixed_legacy',
        'theming_legacy_alpine',
        'theming_legacy_material',
      ]) {
        expect(await oddRowBackground(page, blockId)).not.toBe(await rowBackground(page, blockId));
      }

      expect(await oddRowBackground(page, 'theming_mixed_lowdefy')).toBe('rgba(0, 0, 0, 0)');
      expect(await oddRowBackground(page, 'theming_params_sibling')).toBe('rgba(0, 0, 0, 0)');
    });

    // primaryColor exists only on Material's param type, so it is the one param the shared antdParams
    // map cannot carry and the only reason Material's tab underline, button text, input focus border
    // and cell editing border are not still Material indigo. --ag-primary-color is read directly
    // because none of those four surfaces render without interaction; --ag-button-text-color is read
    // alongside it to prove the ref chain off primaryColor actually resolves.
    test('Material follows the app primary colour rather than Material indigo', async ({
      page,
    }) => {
      const primary = await cssVariable(page, 'theming_legacy_material', '--ant-color-primary');
      // Guards the degenerate pass where both sides read as an empty string.
      expect(primary).toMatch(/^#[0-9a-f]{6}$/i);

      expect(await cssVariable(page, 'theming_legacy_material', '--ag-primary-color')).toBe(
        primary
      );
      expect(await cssVariable(page, 'theming_legacy_material', '--ag-button-text-color')).toBe(
        primary
      );
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

    // The two tests above only see the block types the e2e app renders, and only once the app
    // builds. A stylesheet import added to a block this app does not use, or to one whose page
    // fails to build, would slip past them — and a single ag-grid.css anywhere in the bundle breaks
    // theming for every grid in the app. The static half is what keeps the whole of src/ covered.
    test('no source file imports AG Grid CSS', async () => {
      const entries = await readdir(srcDir, { recursive: true, withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile());
      // A wrong srcDir would make an empty sweep pass silently.
      expect(files.length).toBeGreaterThan(0);

      const importers = [];
      for (const entry of files) {
        const file = path.join(entry.parentPath, entry.name);
        const contents = await readFile(file, 'utf8');
        if (contents.includes('ag-grid-community/styles')) {
          importers.push(path.relative(srcDir, file));
        }
      }
      expect(importers).toEqual([]);
    });
  });
});
