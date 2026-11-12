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

// imageSrc can point at a link that answers only once the content is saved. Until then the editor
// shows the pasted file itself, while the value keeps the stable src.
test.describe('TiptapInput image preview', () => {
  const KEY = 'uploads/photo.png';
  const STABLE_SRC = `/e2e-unsaved-image/${KEY}`;

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/request/tiptap-input/upload_policy', (route) =>
      route.fulfill({
        json: {
          id: 'upload_policy',
          success: true,
          response: { method: 'PUT', url: '/e2e-upload', key: KEY, bucket: 'e2e' },
        },
      })
    );
    await page.route('**/e2e-upload', (route) => route.fulfill({ status: 200 }));
    await page.route('**/e2e-unsaved-image/**', (route) => route.fulfill({ status: 404 }));
    await navigateToTestPage(page, 'tiptap-input');
  });

  test('a pasted image shows from the file while the value keeps the stable src', async ({
    page,
  }) => {
    const editor = editorLocator(page, 'tiptap_upload');
    await editor.click();
    await editor.evaluate(async (element) => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 100;
      const context = canvas.getContext('2d');
      context.fillStyle = '#1677ff';
      context.fillRect(0, 0, 160, 100);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const clipboardData = new DataTransfer();
      clipboardData.items.add(new File([blob], 'photo.png', { type: 'image/png' }));
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true })
      );
    });

    const img = editor.locator('img');
    await expect(img).toHaveAttribute('src', /^blob:/);
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth)).toBe(160);
    await expect(editor.locator('a')).toHaveAttribute('href', STABLE_SRC);

    const savedHtml = page.locator('#tiptap_upload_html');
    await expect(savedHtml).toContainText(`src="${STABLE_SRC}"`);
    await expect(savedHtml).not.toContainText('blob:');
  });
});
