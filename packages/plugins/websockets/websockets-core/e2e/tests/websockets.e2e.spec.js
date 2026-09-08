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

function readCount(text) {
  return Number(text.replace('count:', '').replace('received:', ''));
}

test.describe('Interval source', () => {
  test('subscribes on page mount and receives ticks', async ({ page }) => {
    await navigateToTestPage(page, 'interval');
    await expect(getBlock(page, 'subscribed_status')).toHaveText('connected');
    await expect(getBlock(page, 'last_tick')).not.toHaveText('tick:none', { timeout: 10000 });
    const count1 = readCount(await getBlock(page, 'tick_count').textContent());
    await expect
      .poll(async () => readCount(await getBlock(page, 'tick_count').textContent()), {
        timeout: 10000,
      })
      .toBeGreaterThan(count1);
  });

  test('channel state resets and resubscribes after navigating away and back', async ({
    page,
  }) => {
    await navigateToTestPage(page, 'interval');
    await expect(getBlock(page, 'last_tick')).not.toHaveText('tick:none', { timeout: 10000 });
    await navigateToTestPage(page, 'chat');
    await expect(getBlock(page, 'chat_input')).toBeVisible();
    await navigateToTestPage(page, 'interval');
    await expect(getBlock(page, 'subscribed_status')).toHaveText('connected');
    await expect
      .poll(async () => readCount(await getBlock(page, 'tick_count').textContent()), {
        timeout: 10000,
      })
      .toBeGreaterThan(0);
  });
});

test.describe('Channel publish', () => {
  test('a published message is delivered back to the sender', async ({ page }) => {
    await navigateToTestPage(page, 'chat');
    await expect(getBlock(page, 'message_count')).toHaveText('received:0');
    await getBlock(page, 'chat_input').locator('input').fill('hello world');
    await getBlock(page, 'send').locator('button').click();
    await expect(getBlock(page, 'last_message')).toHaveText('last:hello world', {
      timeout: 10000,
    });
    await expect(getBlock(page, 'message_count')).toHaveText('received:1');
  });

  test('a published message reaches other subscribed clients', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await pageA.goto('http://localhost:3009/chat');
    await pageB.goto('http://localhost:3009/chat');
    await expect(getBlock(pageA, 'message_count')).toHaveText('received:0');
    await expect(getBlock(pageB, 'message_count')).toHaveText('received:0');

    await getBlock(pageA, 'chat_input').locator('input').fill('cross client');
    await getBlock(pageA, 'send').locator('button').click();

    await expect(getBlock(pageA, 'last_message')).toHaveText('last:cross client', {
      timeout: 10000,
    });
    await expect(getBlock(pageB, 'last_message')).toHaveText('last:cross client', {
      timeout: 10000,
    });
    await contextA.close();
    await contextB.close();
  });

  test('publish to a channel that does not allow publishing rejects', async ({ page }) => {
    await navigateToTestPage(page, 'locked');
    await expect(getBlock(page, 'publish_result')).toHaveText('no-error');
    await getBlock(page, 'publish_locked').locator('button').click();
    await expect(getBlock(page, 'publish_result')).toHaveText('publish-rejected', {
      timeout: 10000,
    });
  });
});
