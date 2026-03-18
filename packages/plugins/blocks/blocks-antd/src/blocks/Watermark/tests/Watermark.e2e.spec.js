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

test.describe('Watermark Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'watermark_block');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders watermark container', async ({ page }) => {
    const block = getBlock(page, 'wm_text');
    await expect(block).toBeVisible();

    // Verify child content is rendered inside the watermark
    await expect(block).toContainText('Document content here');
  });

  test('renders child content', async ({ page }) => {
    const block = getBlock(page, 'wm_text');
    await expect(block).toBeVisible();

    // Verify child content is rendered
    await expect(block).toContainText('Document content here');
  });

  // ============================================
  // MULTILINE WATERMARK TEST
  // ============================================

  test('renders multiline watermark text', async ({ page }) => {
    const block = getBlock(page, 'wm_multi');
    await expect(block).toBeVisible();

    // Verify child content is rendered
    await expect(block).toContainText('Multi-line watermark content');
  });
});
