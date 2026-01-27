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

test.describe('Span Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'span');
  });

  test('renders basic Span with data-testid', async ({ page }) => {
    const span = getBlock(page, 'span_basic');
    await expect(span).toBeAttached();
  });

  test('displays properties.content text', async ({ page }) => {
    const span = getBlock(page, 'span_content');
    await expect(span).toHaveText('Hello from Span');
  });

  test('applies properties.style', async ({ page }) => {
    const span = getBlock(page, 'span_styled');
    await expect(span).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(span).toHaveCSS('font-weight', '700');
  });

  test('renders child blocks in content area', async ({ page }) => {
    const parent = getBlock(page, 'span_with_children');
    const child = getBlock(page, 'child_span');
    await expect(parent).toBeVisible();
    await expect(child).toBeVisible();
    await expect(child).toHaveText('Child content');
  });

  test('onClick event fires and updates state', async ({ page }) => {
    const span = getBlock(page, 'span_clickable');
    await expect(span).toHaveText('Click me');
    await span.click();
    await expect(span).toHaveText('Clicked!');
  });
});
