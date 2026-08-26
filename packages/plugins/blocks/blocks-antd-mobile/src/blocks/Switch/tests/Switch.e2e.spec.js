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

const getSwitch = (page, blockId) => getBlock(page, blockId).locator('.adm-switch');

test.describe('Switch Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'switch');
  });

  test('renders unchecked switch', async ({ page }) => {
    const swtch = getSwitch(page, 'switch_basic');
    await expect(swtch).toBeVisible();
    await expect(swtch).not.toHaveClass(/adm-switch-checked/);
    await expect(getBlock(page, 'switch_value_display')).toHaveText('off');
  });

  test('toggling the switch sets the value in state', async ({ page }) => {
    await getSwitch(page, 'switch_basic').click();
    await expect(getSwitch(page, 'switch_basic')).toHaveClass(/adm-switch-checked/);
    await expect(getBlock(page, 'switch_value_display')).toHaveText('on');
  });

  test('renders disabled switch', async ({ page }) => {
    await expect(getSwitch(page, 'switch_disabled')).toHaveClass(/adm-switch-disabled/);
  });
});
