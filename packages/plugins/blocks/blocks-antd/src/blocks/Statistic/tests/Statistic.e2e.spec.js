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

// Statistic: use framework wrapper
const getStatistic = (page, blockId) => getBlock(page, blockId);

test.describe('Statistic Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'statistic');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic statistic', async ({ page }) => {
    const block = getStatistic(page, 'statistic_basic');
    await expect(block).toBeVisible();
    const statistic = block.locator('.ant-statistic');
    await expect(statistic).toHaveClass(/ant-statistic/);
  });

  test('renders with title', async ({ page }) => {
    const block = getStatistic(page, 'statistic_basic');
    const title = block.locator('.ant-statistic-title');
    await expect(title).toHaveText('Active Users');
  });

  test('renders with numeric value', async ({ page }) => {
    const block = getStatistic(page, 'statistic_basic');
    const value = block.locator('.ant-statistic-content-value');
    // Value renders (may or may not have thousand separator depending on settings)
    await expect(value).toContainText('112');
  });

  test('renders with string value', async ({ page }) => {
    const block = getStatistic(page, 'statistic_string_value');
    const value = block.locator('.ant-statistic-content-value');
    await expect(value).toHaveText('Online');
  });

  // ============================================
  // PRECISION TESTS
  // ============================================

  test('renders with precision', async ({ page }) => {
    const block = getStatistic(page, 'statistic_precision');
    const value = block.locator('.ant-statistic-content-value');
    // Should show 2 decimal places (value is 1234.5678, precision 2 = 1234.56)
    await expect(value).toContainText('1234.56');
  });

  test('renders full decimal without precision', async ({ page }) => {
    const block = getStatistic(page, 'statistic_no_precision');
    const value = block.locator('.ant-statistic-content-value');
    await expect(value).toContainText('1234.5678');
  });

  // ============================================
  // PREFIX/SUFFIX TESTS
  // ============================================

  test('renders with prefix text', async ({ page }) => {
    const block = getStatistic(page, 'statistic_prefix');
    const prefix = block.locator('.ant-statistic-content-prefix');
    await expect(prefix).toHaveText('$');
  });

  test('renders with suffix text', async ({ page }) => {
    const block = getStatistic(page, 'statistic_suffix');
    const suffix = block.locator('.ant-statistic-content-suffix');
    await expect(suffix).toHaveText('%');
  });

  test('renders with prefix icon', async ({ page }) => {
    const block = getStatistic(page, 'statistic_prefix_icon');
    const prefix = block.locator('.ant-statistic-content-prefix');
    const icon = prefix.locator('.anticon');
    await expect(icon).toBeVisible();
  });

  test('renders with suffix icon', async ({ page }) => {
    const block = getStatistic(page, 'statistic_suffix_icon');
    const suffix = block.locator('.ant-statistic-content-suffix');
    const icon = suffix.locator('.anticon');
    await expect(icon).toBeVisible();
  });

  // ============================================
  // SEPARATOR TESTS
  // ============================================

  test('renders with custom group separator', async ({ page }) => {
    const block = getStatistic(page, 'statistic_group_separator');
    const value = block.locator('.ant-statistic-content-value');
    // Should use space as separator
    await expect(value).toContainText('1 234 567');
  });

  test('renders with custom decimal separator', async ({ page }) => {
    const block = getStatistic(page, 'statistic_decimal_separator');
    const value = block.locator('.ant-statistic-content-value');
    // Should use comma as decimal separator (1234,56)
    await expect(value).toContainText('1234,56');
  });

  // ============================================
  // LOADING TESTS
  // ============================================

  test('renders loading skeleton', async ({ page }) => {
    const block = getStatistic(page, 'statistic_loading');
    const skeleton = block.locator('.ant-skeleton');
    await expect(skeleton).toBeVisible();
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with custom value style', async ({ page }) => {
    const block = getStatistic(page, 'statistic_value_style');
    // Value style is applied - just verify content is visible
    const value = block.locator('.ant-statistic-content-value');
    await expect(value).toBeVisible();
    await expect(value).toContainText('11.28');
  });

  test('renders negative value with custom style', async ({ page }) => {
    const block = getStatistic(page, 'statistic_negative_style');
    const value = block.locator('.ant-statistic-content-value');
    await expect(value).toContainText('-9.26');
  });
});
