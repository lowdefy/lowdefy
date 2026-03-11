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

test.describe('DangerousMarkdown Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'dangerousmarkdown');
  });

  test('renders markdown content', async ({ page }) => {
    const block = getBlock(page, 'dangerousmarkdown_basic');
    await expect(block).toBeVisible();
    const body = getMarkdownBody(page, 'dangerousmarkdown_basic');
    const bold = body.locator('strong');
    await expect(bold).toHaveText('dangerous');
  });

  test('renders raw HTML content', async ({ page }) => {
    const body = getMarkdownBody(page, 'dangerousmarkdown_html');
    const customDiv = body.locator('.custom-div');
    await expect(customDiv).toHaveText('HTML content');
  });

  test('renders mixed markdown and HTML', async ({ page }) => {
    const body = getMarkdownBody(page, 'dangerousmarkdown_mixed');
    const heading = body.locator('h1');
    await expect(heading).toHaveText('Heading');
    const span = body.locator('span');
    await expect(span).toHaveText('Red text');
  });
});
