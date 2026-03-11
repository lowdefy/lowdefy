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

test.describe('MarkdownWithCode Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'markdownwithcode');
  });

  test('renders markdown content', async ({ page }) => {
    const block = getBlock(page, 'markdownwithcode_basic');
    await expect(block).toBeVisible();
    const body = getMarkdownBody(page, 'markdownwithcode_basic');
    const bold = body.locator('strong');
    await expect(bold).toHaveText('world');
  });

  test('renders code block with syntax highlighting', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdownwithcode_codeblock');
    const pre = body.locator('pre');
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('const');
  });

  test('renders inline code', async ({ page }) => {
    const body = getMarkdownBody(page, 'markdownwithcode_inline');
    const code = body.locator('code');
    await expect(code).toHaveText('console.log');
  });
});
