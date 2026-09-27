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

const getHtmlElement = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('ClickableHtml Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'clickablehtml');
  });

  test('renders HTML content', async ({ page }) => {
    const wrapper = getBlock(page, 'clickable_basic');
    await expect(wrapper).toBeAttached();
    const html = getHtmlElement(page, 'clickable_basic');
    await expect(html.locator('button[data-event="onGreetClick"]')).toHaveText('World');
  });

  test('fires the event named by data-event, with data-* attributes as snake_case keys', async ({
    page,
  }) => {
    const html = getHtmlElement(page, 'clickable_basic');
    await html.locator('button[data-event="onGreetClick"]').click();
    await expect(page.locator('#clicked_event')).toHaveText('greet');
    await expect(page.locator('#clicked_user_id')).toHaveText('u_1');
    await html.locator('button[data-event="onWaveClick"]').click();
    await expect(page.locator('#clicked_event')).toHaveText('wave');
    await expect(page.locator('#clicked_user_id')).toHaveText('u_2');
  });

  test('fires no event for elements without data-event', async ({ page }) => {
    const html = getHtmlElement(page, 'clickable_no_event');
    await html.locator('button').click();
    await expect(page.locator('#clicked_event')).toHaveText('');
  });

  test('sanitizes dangerous HTML (scripts removed)', async ({ page }) => {
    const html = getHtmlElement(page, 'clickable_sanitized');
    await expect(html.locator('p')).toHaveText('Safe content');
    const scripts = await html.locator('script').count();
    expect(scripts).toBe(0);
  });

  test('data-confirm fires the event only after OK, and only once', async ({ page }) => {
    const target = page.locator('#confirm_delete');
    const confirm = page.locator('.ant-popconfirm');
    await target.click();
    await expect(confirm).toContainText('Delete row 7?');
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();
    await expect(page.locator('#delete_count')).toHaveText('0');
    await target.click();
    await confirm.getByRole('button', { name: 'OK' }).dblclick();
    await expect(page.locator('#delete_count')).toHaveText('1');
    await expect(confirm).toBeHidden();
    await expect(page.locator('#delete_count')).toHaveText('1');
  });

  test('a data-event naming an inherited property fires nothing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.locator('#proto_event').click();
    await getHtmlElement(page, 'clickable_basic')
      .locator('button[data-event="onGreetClick"]')
      .click();
    await expect(page.locator('#clicked_event')).toHaveText('greet');
    expect(await page.evaluate(() => Object.hasOwn(Object.prototype, 'loading'))).toBe(false);
    expect(errors).toEqual([]);
  });
});
