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

const getInput = (page, blockId) => getBlock(page, blockId).locator('.adm-input-element');

test.describe('TextInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'text-input');
  });

  test('renders input with placeholder and label', async ({ page }) => {
    const input = getInput(page, 'text_basic');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Enter your name');
    await expect(getBlock(page, 'text_basic').locator('label')).toHaveText('Name');
  });

  test('typing sets the block value in state', async ({ page }) => {
    await getInput(page, 'text_basic').fill('Ada Lovelace');
    await expect(getBlock(page, 'text_value_display')).toHaveText('Ada Lovelace');
  });

  test('renders disabled input', async ({ page }) => {
    await expect(getInput(page, 'text_disabled')).toBeDisabled();
  });
});
