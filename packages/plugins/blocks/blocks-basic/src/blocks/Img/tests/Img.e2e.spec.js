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

test.describe('Img Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'img');
  });

  test('renders image with src', async ({ page }) => {
    const img = getBlock(page, 'img_basic');
    await expect(img).toBeAttached();
    await expect(img).toHaveAttribute('src', 'https://via.placeholder.com/100');
  });

  test('applies width and height', async ({ page }) => {
    const img = getBlock(page, 'img_sized');
    await expect(img).toHaveAttribute('width', '150');
    await expect(img).toHaveAttribute('height', '100');
  });

  test('alt text is set', async ({ page }) => {
    const img = getBlock(page, 'img_alt');
    await expect(img).toHaveAttribute('alt', 'Test image description');
  });

  test('loading="lazy" attribute', async ({ page }) => {
    const img = getBlock(page, 'img_lazy');
    await expect(img).toHaveAttribute('loading', 'lazy');
  });

  test('onClick event fires', async ({ page }) => {
    const img = getBlock(page, 'img_clickable');
    await expect(img).toHaveCSS('border', '2px solid rgb(255, 0, 0)');
    await img.click();
    await expect(img).toHaveCSS('border', '2px solid rgb(0, 128, 0)');
  });
});
