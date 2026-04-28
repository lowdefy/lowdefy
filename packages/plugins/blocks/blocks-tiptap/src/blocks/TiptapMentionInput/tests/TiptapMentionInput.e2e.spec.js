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

const editorLocator = (page, blockId) => page.locator(`#${blockId}_input .ProseMirror`).first();

test.describe('TiptapMentionInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tiptap-mention-input');
  });

  test('renders empty editor', async ({ page }) => {
    const block = getBlock(page, 'tiptap_mention_empty');
    await expect(block).toBeVisible();
    const editor = editorLocator(page, 'tiptap_mention_empty');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  test('renders placeholder when empty', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_placeholder');
    const placeholderEl = editor.locator('p.is-editor-empty').first();
    await expect(placeholderEl).toHaveAttribute('data-placeholder', 'Type @ to mention...');
  });

  test('renders initial html value with mention node', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_with_value');
    await expect(editor).toContainText('@Alice');
    await expect(editor.locator('.tiptap-mention')).toBeVisible();
  });

  test('disabled editor is not editable', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_disabled');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  test('typing @ opens mention dropdown with filtered options', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_options');
    await editor.click();
    await page.keyboard.type('@A');
    const dropdown = page.locator('.tiptap-mention-items');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('.tiptap-mention-item', { hasText: 'Alice' })).toBeVisible();
  });

  test('selecting a mention renders the trigger char and label (not undefined)', async ({
    page,
  }) => {
    const editor = editorLocator(page, 'tiptap_mention_options');
    await editor.click();
    await page.keyboard.type('@B');
    await page.locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Bob' }).click();
    const mention = editor.locator('.tiptap-mention');
    await expect(mention).toBeVisible();
    await expect(mention).toHaveText('@Bob');
    await expect(editor).not.toContainText('undefined');
  });
});
