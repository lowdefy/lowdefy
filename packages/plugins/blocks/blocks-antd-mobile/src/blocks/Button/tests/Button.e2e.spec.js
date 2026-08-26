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

const getButton = (page, blockId) => getBlock(page, blockId).locator('.adm-button');

test.describe('Button Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'button');
  });

  test('renders basic button with title', async ({ page }) => {
    const button = getButton(page, 'button_basic');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Basic Button');
  });

  test('renders success color button', async ({ page }) => {
    await expect(getButton(page, 'button_success')).toHaveClass(/adm-button-success/);
  });

  test('renders danger color button', async ({ page }) => {
    await expect(getButton(page, 'button_danger')).toHaveClass(/adm-button-danger/);
  });

  test('renders disabled button', async ({ page }) => {
    await expect(getButton(page, 'button_disabled')).toBeDisabled();
  });

  test('renders block button', async ({ page }) => {
    await expect(getButton(page, 'button_block')).toHaveClass(/adm-button-block/);
  });

  test('onClick event updates state', async ({ page }) => {
    await expect(getBlock(page, 'clicked_result')).toHaveText('not clicked');
    await getButton(page, 'button_click').click();
    await expect(getBlock(page, 'clicked_result')).toHaveText('clicked');
  });
});
