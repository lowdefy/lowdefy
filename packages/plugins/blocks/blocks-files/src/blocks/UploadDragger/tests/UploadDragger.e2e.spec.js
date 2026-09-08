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

const getFileInput = (page, blockId) => getBlock(page, blockId).locator('input[type="file"]');

test.describe('UploadDragger Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'uploaddragger');
  });

  test('renders drag area with default hint', async ({ page }) => {
    const block = getBlock(page, 'uploaddragger_basic');
    await expect(block).toBeVisible();
    await expect(block).toContainText('Click or drag to add a file.');
    await expect(block.locator('.ant-upload-drag')).toBeVisible();
  });

  test('renders custom title', async ({ page }) => {
    const block = getBlock(page, 'uploaddragger_custom_title');
    await expect(block).toContainText('Drop your files here');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getFileInput(page, 'uploaddragger_disabled');
    await expect(input).toBeDisabled();
  });

  test('emitFileContent emits the selected file as value', async ({ page }) => {
    const input = getFileInput(page, 'uploaddragger_emit');
    await input.setInputFiles({
      name: 'dropped.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('dropped content'),
    });
    await expect(getBlock(page, 'emit_drop_display')).toHaveText('Name: dropped.txt');
  });
});
