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

test.describe('Box Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'box');
  });

  test('renders basic Box', async ({ page }) => {
    const box = getBlock(page, 'box_basic');
    await expect(box).toBeAttached();
  });

  test('displays properties.content text', async ({ page }) => {
    const box = getBlock(page, 'box_content');
    await expect(box).toHaveText('Hello from Box');
  });

  test('applies properties.style', async ({ page }) => {
    const box = getBlock(page, 'box_styled');
    await expect(box).toHaveCSS('background-color', 'rgb(0, 128, 255)');
    await expect(box).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(box).toHaveCSS('padding', '10px');
  });

  test('renders child blocks in content area', async ({ page }) => {
    const parent = getBlock(page, 'box_with_children');
    const child = getBlock(page, 'child_span');
    await expect(parent).toBeVisible();
    await expect(child).toBeVisible();
    await expect(child).toHaveText('Child content');
  });

  test('onClick event fires and updates state', async ({ page }) => {
    const box = getBlock(page, 'box_clickable');
    await expect(box).toHaveText('Click me');
    await box.click();
    await expect(box).toHaveText('Clicked!');
  });
});
