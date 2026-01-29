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

// Button: use framework wrapper, then locate .ant-btn inside
const getButton = (page, blockId) => getBlock(page, blockId).locator('.ant-btn');

test.describe('Button Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'button');
  });

  test('renders basic button with title', async ({ page }) => {
    const block = getBlock(page, 'button_basic');
    await expect(block).toBeVisible();
    const button = getButton(page, 'button_basic');
    await expect(button).toHaveText('Basic Button');
  });

  test('renders primary type button', async ({ page }) => {
    const button = getButton(page, 'button_primary');
    await expect(button).toHaveClass(/ant-btn-primary/);
  });

  test('renders default type button', async ({ page }) => {
    const button = getButton(page, 'button_default');
    await expect(button).toHaveClass(/ant-btn-default/);
  });

  test('renders dashed type button', async ({ page }) => {
    const button = getButton(page, 'button_dashed');
    await expect(button).toHaveClass(/ant-btn-dashed/);
  });

  test('renders link type button', async ({ page }) => {
    const button = getButton(page, 'button_link');
    await expect(button).toHaveClass(/ant-btn-link/);
  });

  test('renders disabled button', async ({ page }) => {
    const button = getButton(page, 'button_disabled');
    await expect(button).toBeDisabled();
  });

  test('renders small size button', async ({ page }) => {
    const button = getButton(page, 'button_small');
    await expect(button).toHaveClass(/ant-btn-sm/);
  });

  test('renders large size button', async ({ page }) => {
    const button = getButton(page, 'button_large');
    await expect(button).toHaveClass(/ant-btn-lg/);
  });

  test('renders danger button', async ({ page }) => {
    const button = getButton(page, 'button_danger');
    await expect(button).toHaveClass(/ant-btn-dangerous/);
  });

  test('renders block button (full width)', async ({ page }) => {
    const button = getButton(page, 'button_block');
    await expect(button).toHaveClass(/ant-btn-block/);
  });

  test('renders button with icon', async ({ page }) => {
    const button = getButton(page, 'button_with_icon');
    await expect(button).toBeVisible();
    // Icon should be rendered as SVG within the button
    const svg = button.locator('svg');
    await expect(svg).toBeAttached();
  });

  test('onClick event fires and updates state', async ({ page }) => {
    const button = getButton(page, 'button_clickable');
    await expect(button).toHaveText('Click me');
    await button.click();
    await expect(button).toHaveText('Clicked!');
  });

  test('button click works on loading button', async ({ page }) => {
    const button = getButton(page, 'button_loading');
    await expect(button).toBeVisible();
    await button.click();
    // Verify button is still functional after click
    await expect(button).toBeVisible();
  });

  test('renders ghost button with transparent background', async ({ page }) => {
    const button = getButton(page, 'button_ghost');
    await expect(button).toHaveClass(/ant-btn-background-ghost/);
  });

  test('renders circle shape button', async ({ page }) => {
    const button = getButton(page, 'button_shape_circle');
    await expect(button).toHaveClass(/ant-btn-circle/);
  });

  test('renders round shape button', async ({ page }) => {
    const button = getButton(page, 'button_shape_round');
    await expect(button).toHaveClass(/ant-btn-round/);
  });

  test('renders text type button', async ({ page }) => {
    const button = getButton(page, 'button_text');
    await expect(button).toHaveClass(/ant-btn-text/);
  });

  test('renders button with href attribute', async ({ page }) => {
    const button = getButton(page, 'button_href');
    await expect(button).toHaveAttribute('href', 'https://lowdefy.com');
  });

  test('renders button with hidden title (icon only)', async ({ page }) => {
    const button = getButton(page, 'button_hide_title');
    await expect(button).toBeVisible();
    // Should have icon-only class
    await expect(button).toHaveClass(/ant-btn-icon-only/);
    // Should have icon
    const svg = button.locator('svg');
    await expect(svg).toBeAttached();
  });

  test('renders button with custom color', async ({ page }) => {
    const button = getButton(page, 'button_color');
    await expect(button).toBeVisible();
    // Check that the custom background color is applied
    await expect(button).toHaveCSS('background-color', 'rgb(82, 196, 26)');
  });

  test('shows loading spinner during onClick action', async ({ page }) => {
    const button = getButton(page, 'button_loading_spinner');
    await expect(button).toBeVisible();
    // Click and immediately check for loading state
    await button.click();
    // The button should show loading spinner (ant-btn-loading class)
    await expect(button).toHaveClass(/ant-btn-loading/);
  });
});
