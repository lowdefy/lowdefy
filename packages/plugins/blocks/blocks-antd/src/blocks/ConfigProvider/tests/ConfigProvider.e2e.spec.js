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
});
