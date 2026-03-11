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

const getContainer = (page, blockId) => getBlock(page, blockId).locator('.progress-bar-container');
const getLoader = (page, blockId) => getBlock(page, blockId).locator('.progress-bar-loader');
const getShadow = (page, blockId) => getBlock(page, blockId).locator('.progress-bar-shadow');

test.describe('ProgressBar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'progressbar');
  });

  test('renders basic progress bar', async ({ page }) => {
    const block = getBlock(page, 'progressbar_basic');
    await expect(block).toBeVisible();
    const container = getContainer(page, 'progressbar_basic');
    await expect(container).toBeVisible();
  });

  test('renders loader element', async ({ page }) => {
    const loader = getLoader(page, 'progressbar_basic');
    await expect(loader).toBeVisible();
  });

  test('renders shadow by default', async ({ page }) => {
    const shadow = getShadow(page, 'progressbar_basic');
    await expect(shadow).toBeVisible();
  });

  test('hides shadow when shadow is false', async ({ page }) => {
    const shadow = getShadow(page, 'progressbar_no_shadow');
    await expect(shadow).toHaveCount(0);
  });
});
