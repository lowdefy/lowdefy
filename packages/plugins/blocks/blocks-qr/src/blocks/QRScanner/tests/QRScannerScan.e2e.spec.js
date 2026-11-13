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

import os from 'node:os';
import path from 'node:path';
import { chromium, expect, test } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

import writeQrVideo from './writeQrVideo.js';

const QR_TEXT = 'LOWDEFY-QR-E2E';

let browser;

// The page in a browser whose camera shows a QR code: Chromium's fake camera plays the video,
// and its fake permission prompt allows it.
test.beforeAll(async () => {
  const videoPath = path.join(os.tmpdir(), `lowdefy-qrscanner-${process.pid}.y4m`);
  await writeQrVideo({ filePath: videoPath, text: QR_TEXT });
  browser = await chromium.launch({
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${videoPath}`,
    ],
  });
});

test.afterAll(async () => {
  await browser.close();
});

async function openScanPage({ baseURL, withoutNativeDetector }) {
  const context = await browser.newContext({ baseURL, permissions: ['camera'] });
  const page = await context.newPage();
  if (withoutNativeDetector) {
    await page.addInitScript(() => {
      delete window.BarcodeDetector;
    });
  }
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  return { context, page, requests };
}

test.describe('QRScanner reading codes', () => {
  test('reads a QR code with the browser BarcodeDetector', async ({ baseURL }) => {
    const { context, page } = await openScanPage({ baseURL });
    await navigateToTestPage(page, 'qrscanner-scan');
    // BarcodeDetector is only exposed on secure pages, so it is checked on the app's page.
    const hasNativeDetector = await page.evaluate(() => 'BarcodeDetector' in window);
    test.skip(!hasNativeDetector, 'This Chromium has no native BarcodeDetector (Linux, Windows).');
    await expect(getBlock(page, 'scan_value')).toHaveText(`value: ${QR_TEXT} qr`);
    await expect(getBlock(page, 'scan_event_text')).toHaveText(`event: ${QR_TEXT}`);
    await context.close();
  });

  test('reads a QR code with the zxing ponyfill, its wasm served by the app', async ({
    baseURL,
  }) => {
    const { context, page, requests } = await openScanPage({
      baseURL,
      withoutNativeDetector: true,
    });
    await navigateToTestPage(page, 'qrscanner-scan');
    await expect(getBlock(page, 'scan_value')).toHaveText(`value: ${QR_TEXT} qr`);
    await expect(getBlock(page, 'scan_event_text')).toHaveText(`event: ${QR_TEXT}`);
    const wasmRequests = requests.filter((url) => url.includes('.wasm'));
    expect(wasmRequests.length).toBeGreaterThan(0);
    wasmRequests.forEach((url) => expect(url.startsWith(baseURL)).toBe(true));
    expect(requests.some((url) => url.includes('jsdelivr'))).toBe(false);
    await context.close();
  });
});

test.describe('QRScanner without a camera', () => {
  test('shows the error and fires onError', async ({ page }) => {
    await navigateToTestPage(page, 'qrscanner-scan');
    await expect(getBlock(page, 'qrscanner_scan').getByRole('alert')).toBeVisible();
    await expect(getBlock(page, 'error_event_text')).toHaveText(
      /error: (NotAllowedError|NotFoundError)/
    );
    await expect(getBlock(page, 'scan_value')).toHaveText('value:  ');
  });
});
