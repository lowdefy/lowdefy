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

const inAppLink = (page, blockId) =>
  getBlock(page, blockId).locator('a[href="/agent-chat-target"]').first();
const externalLink = (page, blockId) =>
  getBlock(page, blockId).locator('a[href="https://example.com"]').first();

test.describe('AgentChat links', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'agent-chat');
  });

  test('renders markdown links from an assistant message', async ({ page }) => {
    await expect(inAppLink(page, 'chat_wired')).toBeVisible();
    await expect(externalLink(page, 'chat_wired')).toBeVisible();
  });

  test('opens an external link in a new tab', async ({ page }) => {
    const link = externalLink(page, 'chat_wired');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('onLinkClick suppresses navigation and reports the href', async ({ page }) => {
    await page.evaluate(() => {
      window.__notReloaded = true;
    });
    await inAppLink(page, 'chat_wired').click();

    await expect(page.locator('#readout_href')).toHaveText('/agent-chat-target');
    await expect(page.locator('#readout_text')).toHaveText('in-app link');
    await expect(page.locator('#readout_count')).toHaveText('1');
    expect(new URL(page.url()).pathname).toBe('/agent-chat');
    // A reload would clear the marker, so this also proves no navigation happened.
    expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
  });

  test('onLinkClick suppresses an external link too', async ({ page }) => {
    const pagesBefore = page.context().pages().length;
    await externalLink(page, 'chat_wired').click();

    await expect(page.locator('#readout_href')).toHaveText('https://example.com');
    expect(page.context().pages().length).toBe(pagesBefore);
  });

  test('a modified click is never intercepted', async ({ page, context }) => {
    const popupPromise = context.waitForEvent('page', { timeout: 10000 });
    // Ctrl/Meta+click is the browser's open-in-new-tab gesture; the block must leave it be.
    await inAppLink(page, 'chat_wired').click({
      modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'],
    });
    const popup = await popupPromise;
    // A popup is about:blank until it navigates, and domcontentloaded fires on that blank
    // document — so the URL, not the load state, is what has to be waited for.
    await popup.waitForURL(/agent-chat-target/);
    expect(new URL(popup.url()).pathname).toBe('/agent-chat-target');
    // The event does not fire for a click the block did not handle.
    await expect(page.locator('#readout_count')).toHaveText('0');
    await popup.close();
  });

  test('an in-app link routes client-side when onLinkClick is not wired', async ({ page }) => {
    await page.evaluate(() => {
      window.__notReloaded = true;
    });
    await inAppLink(page, 'chat_unwired').click();

    await expect(page.locator('#target_marker')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/agent-chat-target');
    // Still set, so the router navigated rather than the browser reloading.
    expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
  });
});

test.describe('AgentChat feedback', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'agent-chat');
  });

  test('keeps a rating selected after it is given', async ({ page }) => {
    const feedback = getBlock(page, 'chat_wired').locator('[class*="feedback"]').first();
    await expect(feedback).toBeVisible();
    const before = await feedback.innerHTML();

    await feedback.locator('[class*="like"]').first().click();

    // Controlled: the chosen thumb stays and the opposite one is hidden. Uncontrolled, the
    // markup returned to its unrated state on the next render.
    await expect
      .poll(async () => (await feedback.innerHTML()) !== before, { timeout: 5000 })
      .toBe(true);
    const after = await feedback.innerHTML();

    // Survives a re-render driven by unrelated state.
    await inAppLink(page, 'chat_wired').click();
    await expect(page.locator('#readout_count')).toHaveText('1');
    expect(await feedback.innerHTML()).toBe(after);
  });
});
