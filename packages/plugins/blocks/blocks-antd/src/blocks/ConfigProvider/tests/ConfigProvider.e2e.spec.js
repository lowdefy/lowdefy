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

const byId = (page, id) => page.locator(`#${escapeId(id)}`);

test.describe('ConfigProvider Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'config_provider');
  });

  test('theme property overrides design tokens for its children', async ({ page }) => {
    const button = getBlock(page, 'cp_theme_btn').locator('.ant-btn');
    await expect(button).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('token takes precedence over theme', async ({ page }) => {
    const button = getBlock(page, 'cp_token_wins_btn').locator('.ant-btn');
    await expect(button).toHaveCSS('background-color', 'rgb(0, 0, 255)');
  });

  test('componentSize reaches child components', async ({ page }) => {
    const button = getBlock(page, 'cp_size_btn').locator('.ant-btn');
    await expect(button).toHaveClass(/ant-btn-sm/);
  });

  test('virtual false renders every selector option', async ({ page }) => {
    await getBlock(page, 'cp_not_virtual_selector').locator('.ant-select').click();
    await expect(page.locator('.ant-select-item-option')).toHaveCount(30);
  });

  test('virtual false renders every multiple selector option', async ({ page }) => {
    await getBlock(page, 'cp_not_virtual_multiple_selector').locator('.ant-select').click();
    await expect(page.locator('.ant-select-item-option')).toHaveCount(20);
  });

  test('virtual false renders every tree selector node', async ({ page }) => {
    await getBlock(page, 'cp_not_virtual_tree_selector').locator('.ant-select').click();
    await expect(page.locator('.ant-select-tree-title')).toHaveCount(20);
  });

  test('componentDisabled disables text inputs, buttons and switches', async ({ page }) => {
    await expect(byId(page, 'cp_disabled_text_input_input')).toBeDisabled();
    await expect(byId(page, 'cp_disabled_button')).toBeDisabled();
    await expect(byId(page, 'cp_disabled_switch_input')).toBeDisabled();
  });

  test('componentDisabled disables selectors and date selectors', async ({ page }) => {
    const selector = page.locator('.ant-select:has(#cp_disabled_selector_input)');
    await expect(selector).toHaveClass(/ant-select-disabled/);
    const picker = page.locator('.ant-picker:has(#cp_disabled_date_selector_input)');
    await expect(picker).toHaveClass(/ant-picker-disabled/);
    await expect(byId(page, 'cp_disabled_date_selector_input')).toBeDisabled();
  });

  test('componentDisabled disables tag, segmented and button selectors', async ({ page }) => {
    const tags = byId(page, 'cp_disabled_tag_selector_input').locator('button');
    await expect(tags).toHaveCount(2);
    await expect(tags.nth(0)).toBeDisabled();
    await expect(tags.nth(1)).toBeDisabled();
    await expect(byId(page, 'cp_disabled_segmented_selector_input')).toHaveClass(
      /ant-segmented-disabled/
    );
    const radios = getBlock(page, 'cp_disabled_button_selector').locator('input[type="radio"]');
    await expect(radios).toHaveCount(2);
    await expect(radios.nth(0)).toBeDisabled();
    await expect(radios.nth(1)).toBeDisabled();
  });

  test('componentDisabled disables the dropdown button and its hover menu', async ({ page }) => {
    const button = getBlock(page, 'cp_disabled_dropdown_button').locator('.ant-btn');
    await expect(button).toBeDisabled();
    await button.hover();
    // antd opens a hover menu after a short delay; give it time to (not) appear.
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-dropdown:visible')).toHaveCount(0);
  });

  test('componentDisabled disables the controlled list add and remove controls', async ({
    page,
  }) => {
    await expect(byId(page, 'cp_disabled_list_add_button')).toBeDisabled();
    const items = getBlock(page, 'cp_disabled_list').locator('.ant-list-item');
    await expect(items).toHaveCount(2);
    await expect(byId(page, 'cp_disabled_list.0.name_input')).toBeDisabled();
    const remove = items.nth(0).locator('.lf-controlled-list-remove');
    await expect(remove).toHaveClass(/lf-controlled-list-remove-disabled/);
    await expect(remove).toHaveAttribute('aria-disabled', 'true');
    await remove.locator('[id$="_remove_icon"]').click();
    await expect(items).toHaveCount(2);
  });

  test('disabled false re-enables a block inside componentDisabled', async ({ page }) => {
    const input = byId(page, 'cp_enabled_text_input_input');
    await expect(input).toBeEnabled();
    await input.fill('typed');
    await expect(input).toHaveValue('typed');
    await expect(byId(page, 'cp_enabled_button')).toBeEnabled();
    const tags = byId(page, 'cp_enabled_tag_selector_input').locator('button');
    await expect(tags.nth(0)).toBeEnabled();
  });

  test('componentDisabled false leaves blocks enabled and their own disabled applies', async ({
    page,
  }) => {
    await expect(byId(page, 'cp_disabled_false_text_input_input')).toBeEnabled();
    await expect(byId(page, 'cp_disabled_false_disabled_input_input')).toBeDisabled();
  });
});
