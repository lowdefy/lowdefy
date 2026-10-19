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

// Paragraph uses id={blockId} directly on the div element
const getParagraph = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Paragraph Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'paragraph');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with content', async ({ page }) => {
    const para = getParagraph(page, 'para_basic');
    await expect(para).toBeVisible();
    await expect(para).toHaveText('This is a basic paragraph.');
  });

  test('renders as typography paragraph', async ({ page }) => {
    const para = getParagraph(page, 'para_basic');
    await expect(para).toHaveClass(/ant-typography/);
  });

  test('renders HTML content', async ({ page }) => {
    const para = getParagraph(page, 'para_html');
    const bold = para.locator('strong');
    const italic = para.locator('em');
    await expect(bold).toHaveText('Bold');
    await expect(italic).toHaveText('italic');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with code style', async ({ page }) => {
    const para = getParagraph(page, 'para_code');
    const code = para.locator('code');
    await expect(code).toBeVisible();
  });

  test('renders with italic style', async ({ page }) => {
    const para = getParagraph(page, 'para_italic');
    const italic = para.locator('i');
    await expect(italic).toBeVisible();
  });

  test('renders with strong style', async ({ page }) => {
    const para = getParagraph(page, 'para_strong');
    const strong = para.locator('strong');
    await expect(strong).toBeVisible();
  });

  test('renders with underline style', async ({ page }) => {
    const para = getParagraph(page, 'para_underline');
    const underline = para.locator('u');
    await expect(underline).toBeVisible();
  });

  test('renders with delete (strikethrough) style', async ({ page }) => {
    const para = getParagraph(page, 'para_delete');
    const del = para.locator('del');
    await expect(del).toBeVisible();
  });

  test('renders with mark (highlight) style', async ({ page }) => {
    const para = getParagraph(page, 'para_mark');
    const mark = para.locator('mark');
    await expect(mark).toBeVisible();
  });

  test('renders disabled state', async ({ page }) => {
    const para = getParagraph(page, 'para_disabled');
    await expect(para).toHaveClass(/ant-typography-disabled/);
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders secondary type', async ({ page }) => {
    const para = getParagraph(page, 'para_secondary');
    await expect(para).toHaveClass(/ant-typography-secondary/);
  });

  test('renders success type', async ({ page }) => {
    const para = getParagraph(page, 'para_success');
    await expect(para).toHaveClass(/ant-typography-success/);
  });

  test('renders warning type', async ({ page }) => {
    const para = getParagraph(page, 'para_warning');
    await expect(para).toHaveClass(/ant-typography-warning/);
  });

  test('renders danger type', async ({ page }) => {
    const para = getParagraph(page, 'para_danger');
    await expect(para).toHaveClass(/ant-typography-danger/);
  });

  // ============================================
  // COPYABLE TESTS
  // ============================================

  test('renders copy button when copyable', async ({ page }) => {
    const block = getBlock(page, 'para_copyable');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await expect(copyBtn).toBeVisible();
  });

  test('onCopy event fires when copy button clicked', async ({ page }) => {
    const block = getBlock(page, 'para_copyable_event');
    const copyBtn = block.getByRole('button', { name: 'Copy' });
    await copyBtn.click();

    const display = getBlock(page, 'oncopy_display');
    await expect(display).toHaveText('Copy fired');
  });

  // ============================================
  // ELLIPSIS TESTS
  // ============================================

  test('renders with ellipsis when content overflows', async ({ page }) => {
    const para = getParagraph(page, 'para_ellipsis');
    await expect(para).toBeVisible();
    await expect(para).toHaveClass(/ant-typography-ellipsis/);
  });

  // ============================================
  // KEYBOARD, TYPE DEFAULT, ACTIONS AND ELLIPSIS OPTIONS
  // ============================================

  test('renders with keyboard style', async ({ page }) => {
    await expect(getParagraph(page, 'para_keyboard').locator('kbd')).toHaveText('Ctrl');
  });

  test('type default adds no type class', async ({ page }) => {
    const el = getParagraph(page, 'para_type_default');
    await expect(el).toBeVisible();
    await expect(el).not.toHaveClass(/ant-typography-default/);
  });

  test('places the action buttons at the start', async ({ page }) => {
    const actions = getParagraph(page, 'para_actions_start').locator('.ant-typography-actions');
    await expect(actions).toHaveClass(/ant-typography-actions-start/);
    await expect(actions).toHaveClass(/para-actions-class/);
    await expect(actions.getByRole('button', { name: 'Copy' })).toBeVisible();
  });

  test('collapsible ellipsis expands and collapses with custom symbols', async ({ page }) => {
    const el = getParagraph(page, 'para_ellipsis_collapsible');
    const display = getBlock(page, 'para_expanded_display');
    await expect(display).toHaveText('Collapsed');
    // The content is cut to one row, not hidden.
    await expect(el).toContainText(/^This.*\.\.\./);
    await expect(el).not.toContainText('the box it sits in.');
    const expand = el.locator('.ant-typography-expand');
    await expect(expand).toHaveText('Show more');
    await expand.click();
    await expect(display).toHaveText('Expanded');
    await expect(el).toContainText('the box it sits in.');
    const collapse = el.locator('.ant-typography-collapse');
    await expect(collapse).toHaveText('Show less');
    await collapse.click();
    await expect(display).toHaveText('Collapsed');
  });

  test('defaultExpanded starts with the text expanded', async ({ page }) => {
    const el = getParagraph(page, 'para_ellipsis_default_expanded');
    await expect(el.getByRole('button', { name: 'Collapse' })).toBeVisible();
    await expect(el).toContainText('the box it sits in.');
  });

  test('onTextSelection fires for plain text cut by an expandable ellipsis', async ({ page }) => {
    const el = getParagraph(page, 'para_ellipsis_selection');
    await expect(el.locator('.ant-typography-expand')).toBeVisible();
    await expect(getBlock(page, 'para_selection_display')).toHaveText('Nothing selected');
    // A double click on the first word selects it.
    await el.dblclick({ position: { x: 5, y: 5 } });
    await expect(getBlock(page, 'para_selection_display')).toHaveText('Selected Selectable');
  });

  test('ellipsis tooltip shows on hover', async ({ page }) => {
    await getParagraph(page, 'para_ellipsis_tooltip').hover();
    await expect(page.locator('.ant-tooltip')).toContainText('Full text in a tooltip');
  });
});
