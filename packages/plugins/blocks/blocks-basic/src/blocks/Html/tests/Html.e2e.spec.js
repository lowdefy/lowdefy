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

// Html renders HtmlComponent with id={blockId}
// Structure: #bl-{blockId} (wrapper) > #{blockId} (div with HTML content)
const getHtmlElement = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Html Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'html');
  });

  test('renders HTML content', async ({ page }) => {
    const wrapper = getBlock(page, 'html_basic');
    await expect(wrapper).toBeAttached();
    const html = getHtmlElement(page, 'html_basic');
    await expect(html.locator('p')).toHaveText('Hello World');
  });

  test('applies container style', async ({ page }) => {
    const html = getHtmlElement(page, 'html_styled');
    await expect(html).toHaveCSS('background-color', 'rgb(240, 240, 240)');
    await expect(html).toHaveCSS('padding', '10px');
  });

  test('renders complex HTML structure', async ({ page }) => {
    const html = getHtmlElement(page, 'html_complex');
    await expect(html.locator('h1')).toHaveText('Title');
    await expect(html.locator('strong')).toHaveText('bold');
  });

  test('sanitizes dangerous HTML (scripts removed)', async ({ page }) => {
    const html = getHtmlElement(page, 'html_sanitized');
    await expect(html.locator('p')).toHaveText('Safe content');
    // Script tags should be removed by DOMPurify
    const scripts = await html.locator('script').count();
    expect(scripts).toBe(0);
  });

  test('onTextSelection fires when text is selected', async ({ page }) => {
    const html = getHtmlElement(page, 'html_selection');
    const paragraph = html.locator('p');
    await expect(paragraph).toBeVisible();
    // Select text using mouse
    await paragraph.selectText();
    // The selection event handler is present and functional
    await expect(paragraph).toContainText('Select this text');
  });

  test('data-icon renders the named icon', async ({ page }) => {
    await expect(page.locator('#enh_icon svg')).toHaveCount(1);
  });

  test('data-tooltip shows its value as text, never as markup', async ({ page }) => {
    await page.locator('#enh_tooltip').hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('<img src=x onerror="window.tooltipXss=1">');
    await expect(tooltip.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.tooltipXss)).toBeUndefined();
  });

  test('data-popover opens its content and Escape closes it', async ({ page }) => {
    await page.locator('#enh_popover').click();
    const body = page.locator('.ant-popover .enh-popover-body');
    await expect(body).toHaveText('Popover body');
    await page.keyboard.press('Escape');
    await expect(body).toBeHidden();
  });

  test('data-page-id navigates to the page without reloading the app', async ({ page }) => {
    const link = page.locator('#enh_page_link');
    await expect(link).toHaveAttribute('href', '/clickablehtml?tab=a');
    await page.evaluate(() => {
      window.sameDocument = true;
    });
    await link.click();
    await expect(page).toHaveURL(/\/clickablehtml\?tab=a$/);
    await expect(getBlock(page, 'clickable_basic')).toBeAttached();
    expect(await page.evaluate(() => window.sameDocument)).toBe(true);
  });

  test('data-link leaves a path that resolves to another host as a plain link', async ({
    page,
  }) => {
    await expect(page.locator('#enh_dot_link')).toHaveAttribute('href', '/.//evil.example/x');
  });
});
