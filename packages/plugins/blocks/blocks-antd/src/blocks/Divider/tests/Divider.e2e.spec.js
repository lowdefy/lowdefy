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
import { navigateToTestPage } from '@lowdefy/block-dev-e2e';
import { escapeId } from '@lowdefy/e2e-utils';

// Divider uses id={blockId} directly
const getDivider = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Divider Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'divider');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic divider', async ({ page }) => {
    const divider = getDivider(page, 'divider_basic');
    await expect(divider).toBeVisible();
    await expect(divider).toHaveClass(/ant-divider/);
  });

  test('renders with title', async ({ page }) => {
    const divider = getDivider(page, 'divider_with_title');
    await expect(divider).toBeVisible();
    const innerText = divider.locator('.ant-divider-inner-text');
    await expect(innerText).toHaveText('Section Title');
  });

  test('renders with text class when title provided', async ({ page }) => {
    const divider = getDivider(page, 'divider_with_title');
    await expect(divider).toHaveClass(/ant-divider-with-text/);
  });

  // ============================================
  // ORIENTATION TESTS (horizontal/vertical)
  // ============================================

  test('renders horizontal divider by default', async ({ page }) => {
    const divider = getDivider(page, 'divider_horizontal');
    await expect(divider).toHaveClass(/ant-divider-horizontal/);
  });

  test('renders vertical divider', async ({ page }) => {
    const divider = getDivider(page, 'divider_vertical');
    await expect(divider).toHaveClass(/ant-divider-vertical/);
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders dashed divider', async ({ page }) => {
    const divider = getDivider(page, 'divider_dashed');
    await expect(divider).toHaveClass(/ant-divider-dashed/);
  });

  test('renders plain divider', async ({ page }) => {
    const divider = getDivider(page, 'divider_plain');
    await expect(divider).toHaveClass(/ant-divider-plain/);
  });

  // ============================================
  // TITLE PLACEMENT TESTS (left/center/right)
  // ============================================

  test('renders with left title placement', async ({ page }) => {
    const divider = getDivider(page, 'divider_left');
    await expect(divider).toHaveClass(/ant-divider-with-text-start/);
  });

  test('renders with center title placement', async ({ page }) => {
    const divider = getDivider(page, 'divider_center');
    await expect(divider).toHaveClass(/ant-divider-with-text-center/);
  });

  test('renders with right title placement', async ({ page }) => {
    const divider = getDivider(page, 'divider_right');
    await expect(divider).toHaveClass(/ant-divider-with-text-end/);
  });

  // ============================================
  // HTML TITLE
  // ============================================

  test('renders HTML in title', async ({ page }) => {
    const divider = getDivider(page, 'divider_html');
    const bold = divider.locator('strong');
    await expect(bold).toHaveText('Bold');
  });
});
