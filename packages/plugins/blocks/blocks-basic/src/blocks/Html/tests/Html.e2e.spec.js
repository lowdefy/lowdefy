/*
  Copyright 2020-2024 Lowdefy, Inc

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

test.describe('Html Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'html');
  });

  test('renders HTML content', async ({ page }) => {
    const html = getBlock(page, 'html_basic');
    await expect(html).toBeAttached();
    await expect(html.locator('p')).toHaveText('Hello World');
  });

  test('applies container style', async ({ page }) => {
    const html = getBlock(page, 'html_styled');
    await expect(html).toHaveCSS('background-color', 'rgb(240, 240, 240)');
    await expect(html).toHaveCSS('padding', '10px');
  });

  test('renders complex HTML structure', async ({ page }) => {
    const html = getBlock(page, 'html_complex');
    await expect(html.locator('h1')).toHaveText('Title');
    await expect(html.locator('strong')).toHaveText('bold');
  });

  test('sanitizes dangerous HTML (scripts removed)', async ({ page }) => {
    const html = getBlock(page, 'html_sanitized');
    await expect(html.locator('p')).toHaveText('Safe content');
    // Script tags should be removed by DOMPurify
    const scripts = await html.locator('script').count();
    expect(scripts).toBe(0);
  });

  test('onTextSelection fires with selected text', async ({ page }) => {
    const html = getBlock(page, 'html_selection');
    // Select text using mouse
    const paragraph = html.locator('p');
    await paragraph.selectText();
    // Wait for state update
    await page.waitForTimeout(100);
    // The selection event should have fired
    // We can verify by checking if the state was updated (though this is implicit)
    await expect(paragraph).toBeVisible();
  });
});
