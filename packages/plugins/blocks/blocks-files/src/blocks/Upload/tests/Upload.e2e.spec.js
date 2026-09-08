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

const getButton = (page, blockId) => getBlock(page, blockId).locator('.ant-btn');
const getFileInput = (page, blockId) => getBlock(page, blockId).locator('input[type="file"]');

test.describe('Upload Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'upload');
  });

  test('renders basic upload button with default title', async ({ page }) => {
    const block = getBlock(page, 'upload_basic');
    await expect(block).toBeVisible();
    const button = getButton(page, 'upload_basic');
    await expect(button).toHaveText(/Upload/);
  });

  test('renders custom button title and type', async ({ page }) => {
    const button = getButton(page, 'upload_custom_button');
    await expect(button).toHaveText(/Choose File/);
    await expect(button).toHaveClass(/ant-btn-primary/);
  });

  test('renders disabled state', async ({ page }) => {
    const button = getButton(page, 'upload_disabled');
    await expect(button).toBeDisabled();
    const input = getFileInput(page, 'upload_disabled');
    await expect(input).toBeDisabled();
  });

  test('sets accept attribute on file input', async ({ page }) => {
    const input = getFileInput(page, 'upload_accept');
    await expect(input).toHaveAttribute('accept', '.pdf');
  });

  test('emitFileContent emits name, type and base64 content on file selection', async ({
    page,
  }) => {
    const input = getFileInput(page, 'upload_emit');
    await input.setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello world'),
    });
    await expect(getBlock(page, 'emit_name_display')).toHaveText('Name: hello.txt');
    await expect(getBlock(page, 'emit_type_display')).toHaveText('Type: text/plain');
    await expect(getBlock(page, 'emit_content_display')).toHaveText(
      `Content: ${Buffer.from('hello world').toString('base64')}`
    );
  });

  test('emitFileContent shows the file as done in the upload list', async ({ page }) => {
    const input = getFileInput(page, 'upload_emit');
    await input.setInputFiles({
      name: 'report.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('report content'),
    });
    const item = getBlock(page, 'upload_emit').locator('.ant-upload-list-item');
    await expect(item).toContainText('report.txt');
    await expect(item).not.toHaveClass(/ant-upload-list-item-error/);
  });
});
