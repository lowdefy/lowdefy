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

// Card renders with .ant-card class
const getCard = (page, blockId) => getBlock(page, blockId).locator('.ant-card');

test.describe('Card Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'card');
  });

  test('renders basic card with title and content', async ({ page }) => {
    const block = getBlock(page, 'card_basic');
    await expect(block).toBeVisible();
    const card = getCard(page, 'card_basic');
    await expect(card).toBeVisible();
    await expect(card.locator('.ant-card-head-title')).toHaveText('Basic Card');
    await expect(card.locator('.ant-card-body')).toContainText('Card content here');
  });

  test('renders card without title', async ({ page }) => {
    const card = getCard(page, 'card_no_title');
    await expect(card).toBeVisible();
    // No head element when no title
    await expect(card.locator('.ant-card-head')).toBeHidden();
    await expect(card.locator('.ant-card-body')).toContainText('Card without title');
  });

  test('renders small size card', async ({ page }) => {
    const card = getCard(page, 'card_small');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/ant-card-small/);
  });

  test('renders bordered card', async ({ page }) => {
    const card = getCard(page, 'card_bordered');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/ant-card-bordered/);
  });

  test('renders borderless card', async ({ page }) => {
    const card = getCard(page, 'card_borderless');
    await expect(card).toBeVisible();
    await expect(card).not.toHaveClass(/ant-card-bordered/);
  });

  test('renders hoverable card', async ({ page }) => {
    const card = getCard(page, 'card_hoverable');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/ant-card-hoverable/);
  });

  test('renders inner type card', async ({ page }) => {
    const card = getCard(page, 'card_inner');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/ant-card-type-inner/);
  });

  test('renders card with extra content', async ({ page }) => {
    const card = getCard(page, 'card_with_extra');
    await expect(card).toBeVisible();
    await expect(card.locator('.ant-card-extra')).toBeVisible();
    await expect(card.locator('.ant-card-extra')).toContainText('More');
  });

  test('renders card with cover image', async ({ page }) => {
    const card = getCard(page, 'card_with_cover');
    await expect(card).toBeVisible();
    await expect(card.locator('.ant-card-cover')).toBeVisible();
    await expect(card.locator('.ant-card-cover img')).toBeVisible();
  });

  test('renders card with custom title block', async ({ page }) => {
    const card = getCard(page, 'card_title_block');
    await expect(card).toBeVisible();
    await expect(card.locator('.ant-card-head-title')).toContainText('Custom Title Block');
  });

  test('onClick event fires when card is clicked', async ({ page }) => {
    const card = getCard(page, 'card_onclick');
    await card.click();
    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Card clicked!');
  });
});
