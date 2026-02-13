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

// Comment renders with .ant-comment class
const getComment = (page, blockId) => getBlock(page, blockId).locator('.ant-comment');

test.describe('Comment Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'comment');
  });

  test('renders basic comment with author and content', async ({ page }) => {
    const block = getBlock(page, 'comment_basic');
    await expect(block).toBeVisible();
    const comment = getComment(page, 'comment_basic');
    await expect(comment.locator('.ant-comment-content-author-name')).toHaveText('John Doe');
    await expect(comment.locator('.ant-comment-content-detail')).toHaveText('This is a comment');
  });

  test('renders comment with datetime', async ({ page }) => {
    const comment = getComment(page, 'comment_with_datetime');
    await expect(comment.locator('.ant-comment-content-author-name')).toHaveText('Jane Smith');
    await expect(comment.locator('.ant-comment-content-author-time')).toHaveText(
      '2024-01-15 10:30'
    );
  });

  test('renders comment with avatar from URL string', async ({ page }) => {
    const comment = getComment(page, 'comment_avatar_string');
    // Avatar element should exist (URL loading is not tested as it's unreliable)
    const avatar = comment.locator('.ant-comment-avatar .ant-avatar');
    await expect(avatar).toBeVisible();
  });

  test('renders comment with custom avatar object', async ({ page }) => {
    const comment = getComment(page, 'comment_avatar_object');
    const avatar = comment.locator('.ant-comment-avatar .ant-avatar');
    await expect(avatar).toHaveText('UT');
    await expect(avatar).toHaveCSS('background-color', 'rgb(24, 144, 255)');
  });

  test('renders avatar with first two letters of author name when no avatar specified', async ({
    page,
  }) => {
    const comment = getComment(page, 'comment_avatar_from_author');
    const avatar = comment.locator('.ant-comment-avatar .ant-avatar');
    await expect(avatar).toHaveText('Mi');
  });

  test('renders comment with action buttons', async ({ page }) => {
    const comment = getComment(page, 'comment_with_actions');
    const actions = comment.locator('.ant-comment-actions');
    await expect(actions).toBeVisible();
    await expect(actions).toContainText('Like');
    await expect(actions).toContainText('Reply');
  });

  test('renders nested comment in children area', async ({ page }) => {
    const parentComment = getComment(page, 'comment_with_children');
    await expect(parentComment.locator('.ant-comment-content-author-name').first()).toHaveText(
      'Parent'
    );

    // Child comment should be nested inside
    const childBlock = getBlock(page, 'comment_child');
    await expect(childBlock).toBeVisible();
    const childComment = getComment(page, 'comment_child');
    await expect(childComment.locator('.ant-comment-content-author-name')).toHaveText('Child');
  });

  test('renders comment with content area blocks', async ({ page }) => {
    const comment = getComment(page, 'comment_content_area');
    await expect(comment.locator('.ant-comment-content-author-name')).toHaveText('Rich Content');
    // Content should include the Paragraph block
    await expect(comment.locator('.ant-comment-content-detail')).toContainText(
      'This comment uses the content area'
    );
  });

  test('renders comment with author area block', async ({ page }) => {
    const comment = getComment(page, 'comment_author_area');
    // Author should be the custom Anchor block
    await expect(comment.locator('.ant-comment-content-author-name')).toContainText(
      'Custom Author Link'
    );
  });
});
