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

test.describe('TiptapInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tiptap-input');
  });

  test('renders empty editor', async ({ page }) => {
    const block = getBlock(page, 'tiptap_empty');
    await expect(block).toBeVisible();
    const editor = editorLocator(page, 'tiptap_empty');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  test('renders placeholder when empty', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_placeholder');
    const placeholderEl = editor.locator('p.is-editor-empty').first();
    await expect(placeholderEl).toHaveAttribute('data-placeholder', 'Start typing...');
  });

  test('renders initial html value', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_with_value');
    await expect(editor).toContainText('Hello world.');
    await expect(editor.locator('strong')).toHaveText('world');
  });

  test('disabled editor is not editable', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_disabled');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    await expect(editor).toContainText('Disabled content.');
  });

  test('borderless editor applies the borderless wrapper class', async ({ page }) => {
    const wrapper = page.locator('#tiptap_borderless_input');
    await expect(wrapper).toHaveClass(/tiptap-wrapper-borderless/);
  });

  test('typing updates editor content', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_typing');
    await editor.click();
    await page.keyboard.type('hello from test');
    await expect(editor).toContainText('hello from test');
  });
});
