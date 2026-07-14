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

// TagSelector renders its tag row with an _input suffix.
const getTags = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);
const tag = (page, blockId, text) =>
  getTags(page, blockId).locator('.lf-tag-selector-tag').filter({ hasText: text });

test.describe('TagSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tag_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders tag pills with options', async ({ page }) => {
    const tags = getTags(page, 'tag_basic');
    await expect(tags).toBeVisible();
    await expect(tags).toContainText('Ethics');
    await expect(tags).toContainText('Environment');
    await expect(tags).toContainText('Governance');
  });

  // ============================================
  // SELECTION / EVENT TESTS
  // ============================================

  test('toggles selection, fires onChange and updates state', async ({ page }) => {
    await tag(page, 'tag_change', 'Option A').click();
    await expect(tag(page, 'tag_change', 'Option A')).toHaveClass(/lf-tag-selector-tag-selected/);

    const display = getBlock(page, 'tag_change_display');
    await expect(display).toContainText('a');

    // Multi-select: a second toggle adds to the array.
    await tag(page, 'tag_change', 'Option B').click();
    await expect(tag(page, 'tag_change', 'Option B')).toHaveClass(/lf-tag-selector-tag-selected/);
    await expect(display).toContainText('b');

    // Toggling off removes it and keeps the selection controlled.
    await tag(page, 'tag_change', 'Option A').click();
    await expect(tag(page, 'tag_change', 'Option A')).not.toHaveClass(
      /lf-tag-selector-tag-selected/
    );
  });

  // ============================================
  // DISABLED TESTS
  // ============================================

  test('disables the whole selector', async ({ page }) => {
    await expect(tag(page, 'tag_disabled', 'X')).toBeDisabled();
    await expect(tag(page, 'tag_disabled', 'Y')).toBeDisabled();
  });

  test('disables a single option while others stay enabled', async ({ page }) => {
    await expect(tag(page, 'tag_disabled_option', 'Enabled')).toBeEnabled();
    await expect(tag(page, 'tag_disabled_option', 'Locked')).toBeDisabled();
  });
});
