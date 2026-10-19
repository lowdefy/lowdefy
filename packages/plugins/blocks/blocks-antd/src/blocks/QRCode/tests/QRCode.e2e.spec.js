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

test.describe('QRCode Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'qr_code');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders QR code', async ({ page }) => {
    const block = getBlock(page, 'qr_basic');
    await expect(block).toBeVisible();
    const qrcode = block.locator('.ant-qrcode');
    await expect(qrcode).toBeVisible();
  });

  test('renders bordered QR code', async ({ page }) => {
    const block = getBlock(page, 'qr_bordered');
    await expect(block).toBeVisible();
    const qrcode = block.locator('.ant-qrcode');
    await expect(qrcode).not.toHaveClass(/ant-qrcode-borderless/);
  });

  test('renders with custom size', async ({ page }) => {
    const block = getBlock(page, 'qr_size');
    await expect(block).toBeVisible();
    const qrcode = block.locator('.ant-qrcode');
    await expect(qrcode).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('shows expired status and fires onRefresh', async ({ page }) => {
    const block = getBlock(page, 'qr_expired');
    await expect(block).toBeVisible();

    // Expired QR code should show expired text
    await expect(block.locator('.ant-qrcode-expired')).toBeVisible();

    // Click the refresh button (link button sibling of the expired text)
    const refreshBtn = block.locator('.ant-btn-link');
    await refreshBtn.click();

    const display = getBlock(page, 'qr_refresh_display');
    await expect(display).toHaveText('Refresh fired');
  });

  // ============================================
  // ICON SIZE AND SEMANTIC KEYS
  // ============================================

  test('renders the icon with an object iconSize', async ({ page }) => {
    const image = getBlock(page, 'qr_icon_size').locator('svg image');
    await expect(image).toBeAttached();
    // The svg draws in module units, so the 60 x 30 icon keeps its 2:1 ratio.
    const width = Number(await image.getAttribute('width'));
    const height = Number(await image.getAttribute('height'));
    expect(width / height).toBeCloseTo(2);
  });

  test('applies class and style to the status cover', async ({ page }) => {
    const cover = getBlock(page, 'qr_cover_style').locator('.ant-qrcode-cover');
    await expect(cover).toHaveClass(/qr-cover-class/);
    await expect(cover).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  });

  // ============================================
  // NULL PROPERTIES
  // ============================================

  test('null properties fall back to antd defaults', async ({ page }) => {
    const qrcode = getBlock(page, 'qr_null_props').locator('.ant-qrcode');
    await expect(qrcode).toBeVisible();
    await expect(qrcode).toHaveCSS('width', '160px');
    await expect(qrcode).not.toHaveClass(/ant-qrcode-borderless/);
    await expect(qrcode.locator('canvas')).toBeVisible();
    await expect(qrcode.locator('.ant-qrcode-cover')).toHaveCount(0);
  });
});
