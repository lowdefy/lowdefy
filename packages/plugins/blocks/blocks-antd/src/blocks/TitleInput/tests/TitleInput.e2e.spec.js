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

// TitleInput: use framework wrapper, then locate heading element inside
const getTitle = (page, blockId) => getBlock(page, blockId).locator('h1, h2, h3, h4, h5');

test.describe('TitleInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'titleinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders as h1 by default', async ({ page }) => {
    const block = getBlock(page, 'titleinput_basic');
    await expect(block).toBeVisible();
    const title = getTitle(page, 'titleinput_basic');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
  });

  test('renders with initial value', async ({ page }) => {
    const block = getBlock(page, 'titleinput_with_value');
    await expect(block).toContainText('Editable Title');
  });

  // ============================================
  // LEVEL TESTS
  // ============================================

  test('renders level 2 as h2', async ({ page }) => {
    const title = getTitle(page, 'titleinput_level2');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h2');
  });

  test('renders level 3 as h3', async ({ page }) => {
    const title = getTitle(page, 'titleinput_level3');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h3');
  });

  test('renders level 4 as h4', async ({ page }) => {
    const title = getTitle(page, 'titleinput_level4');
    const tagName = await title.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h4');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with code style', async ({ page }) => {
    const block = getBlock(page, 'titleinput_code');
    const code = block.locator('code');
    await expect(code).toBeAttached();
  });

  test('renders with italic style', async ({ page }) => {
    const block = getBlock(page, 'titleinput_italic');
    const italic = block.locator('i');
    await expect(italic).toBeAttached();
  });

  test('renders with underline style', async ({ page }) => {
    const block = getBlock(page, 'titleinput_underline');
    const underline = block.locator('u');
    await expect(underline).toBeAttached();
  });

  test('renders with delete (strikethrough) style', async ({ page }) => {
    const block = getBlock(page, 'titleinput_delete');
    const del = block.locator('del');
    await expect(del).toBeAttached();
  });

  test('renders with mark (highlight) style', async ({ page }) => {
    const block = getBlock(page, 'titleinput_mark');
    const mark = block.locator('mark');
    await expect(mark).toBeAttached();
  });

  test('renders disabled state', async ({ page }) => {
    const title = getTitle(page, 'titleinput_disabled');
    await expect(title).toHaveClass(/ant-typography-disabled/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders secondary type', async ({ page }) => {
    const title = getTitle(page, 'titleinput_secondary');
    await expect(title).toHaveClass(/ant-typography-secondary/);
  });

  test('renders warning type', async ({ page }) => {
    const title = getTitle(page, 'titleinput_warning');
    await expect(title).toHaveClass(/ant-typography-warning/);
  });

  test('renders danger type', async ({ page }) => {
    const title = getTitle(page, 'titleinput_danger');
    await expect(title).toHaveClass(/ant-typography-danger/);
  });

  test('renders success type', async ({ page }) => {
    const title = getTitle(page, 'titleinput_success');
    await expect(title).toHaveClass(/ant-typography-success/);
  });

  // ============================================
  // COPYABLE TEST
  // ============================================

  test('renders copy button when copyable', async ({ page }) => {
    const block = getBlock(page, 'titleinput_copyable');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await expect(copyBtn).toBeVisible();
  });

  test('onCopy event fires when copy button is clicked', async ({ page }) => {
    const block = getBlock(page, 'titleinput_oncopy');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await copyBtn.click();

    // Verify the onCopy event fired
    const display = getBlock(page, 'oncopy_display');
    await expect(display).toHaveText('Copy fired');
  });

  // ============================================
  // EDITABLE TESTS
  // ============================================

  test('does not render an edit icon by default', async ({ page }) => {
    const block = getBlock(page, 'titleinput_editable');
    await expect(block).toContainText('Click to Edit');
    await expect(block.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });

  test('renders an edit icon that starts editing when editable.icon is set', async ({ page }) => {
    const block = getBlock(page, 'titleinput_edit_icon');
    const editBtn = block.getByRole('button', { name: 'Edit' });
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(block.locator('textarea')).toBeFocused();
  });

  test('clicking the text does not edit when editable is false', async ({ page }) => {
    const block = getBlock(page, 'titleinput_not_editable');
    await block.getByText('Read only title').click();
    await expect(block.locator('textarea')).toHaveCount(0);
  });

  test('shows the placeholder when the value is empty', async ({ page }) => {
    const block = getBlock(page, 'titleinput_empty');
    await expect(block).toHaveText('Name this document');
  });

  // ============================================
  // EDIT INTERACTION TESTS
  // ============================================

  test('can edit title by clicking the text and onChange fires', async ({ page }) => {
    const block = getBlock(page, 'titleinput_onchange');
    await block.getByText('Change me').click();

    // The title is edited in place: a textarea replaces the text inside the same element.
    const textarea = block.locator('textarea');
    await expect(textarea).toBeFocused();
    await textarea.fill('New Title Value');
    await textarea.press('Enter');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: New Title Value');
    await expect(block).toContainText('New Title Value');
  });

  test('Escape cancels the edit and keeps the value', async ({ page }) => {
    const block = getBlock(page, 'titleinput_editable');
    await block.getByText('Click to Edit').click();
    const textarea = block.locator('textarea');
    await textarea.fill('Discarded');
    await textarea.press('Escape');

    await expect(textarea).toHaveCount(0);
    await expect(block).toContainText('Click to Edit');
  });
});
