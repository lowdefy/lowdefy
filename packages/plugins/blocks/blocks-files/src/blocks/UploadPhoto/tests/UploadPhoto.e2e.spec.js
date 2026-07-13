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

// 1x1 transparent PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('UploadPhoto Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'uploadphoto');
  });

  test('renders upload card with default title', async ({ page }) => {
    const block = getBlock(page, 'uploadphoto_basic');
    await expect(block).toBeVisible();
    await expect(block).toContainText('Upload image');
  });

  test('renders custom title', async ({ page }) => {
    const block = getBlock(page, 'uploadphoto_custom_title');
    await expect(block).toContainText('Add Photo');
  });

  test('accepts only images', async ({ page }) => {
    const input = getFileInput(page, 'uploadphoto_basic');
    await expect(input).toHaveAttribute('accept', 'image/*');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getFileInput(page, 'uploadphoto_disabled');
    await expect(input).toBeDisabled();
  });

  test('emitFileContent emits the selected image as value', async ({ page }) => {
    const input = getFileInput(page, 'uploadphoto_emit');
    await input.setInputFiles({
      name: 'pixel.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(getBlock(page, 'emit_photo_display')).toHaveText('Name: pixel.png');
  });
});
