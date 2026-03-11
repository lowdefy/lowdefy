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

const getMarkdownBody = (page, blockId) => getBlock(page, blockId).locator('.markdown-body');

test.describe('Markdown Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'markdown');
  });

  test('renders markdown content', async ({ page }) => {
    const block = getBlock(page, 'markdown_basic');
    await expect(block).toBeVisible();
    const body = getMarkdownBody(page, 'markdown_basic');
    await expect(body).toBeVisible();
  });

  test('renders bold text', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_basic');
    const bold = body.locator('strong');
    await expect(bold).toHaveText('world');
  });

  test('renders heading', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_heading');
    const heading = body.locator('h1');
    await expect(heading).toHaveText('Heading One');
  });

  test('renders unordered list', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_list');
    const items = body.locator('li');
    await expect(items).toHaveCount(3);
  });

  test('renders link', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_link');
    const link = body.locator('a');
    await expect(link).toHaveText('Lowdefy');
  });

  test('renders GFM table', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_gfm_table');
    const table = body.locator('table');
    await expect(table).toBeVisible();
  });

  test('renders inline code', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdown_code');
    const code = body.locator('code');
    await expect(code).toHaveText('code');
  });

  test('renders empty markdown without error', async ({ page }) => {
    const block = getBlock(page, 'markdown_empty');
    await expect(block).toBeVisible();
  });
});
