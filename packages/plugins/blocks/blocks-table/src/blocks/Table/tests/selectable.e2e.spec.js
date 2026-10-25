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
import { getBlock } from '@lowdefy/block-dev-e2e';

import openTablePage from '../../../../e2e/openTablePage.js';

const checkbox = (page, rowKey) =>
  getBlock(page, 'sel').locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-lf-select-cell] input`
  );
const selectAll = (page) => getBlock(page, 'sel').locator('[data-lf-select-all]');

test.describe('Table rowSelection.selectable', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'selectable');
    await expect(getBlock(page, 'sel').locator('.lf-table-body')).toBeVisible();
  });

  test('a row that fails the condition has a disabled checkbox and cannot be selected', async ({
    page,
  }) => {
    await expect(checkbox(page, '1')).toBeEnabled();
    await expect(checkbox(page, '2')).toBeDisabled();
    await checkbox(page, '2').click({ force: true });
    await expect(getBlock(page, 'sel_value')).toHaveText('selected=[]');
    await checkbox(page, '1').click();
    await expect(getBlock(page, 'sel_value')).toHaveText('selected=[1]');
  });

  test('select-all skips rows that fail the condition and reads as checked without them', async ({
    page,
  }) => {
    await selectAll(page).click();
    await expect(getBlock(page, 'sel_value')).toHaveText('selected=[1,3]');
    await expect(selectAll(page)).toBeChecked();
    await expect(checkbox(page, '2')).not.toBeChecked();
    await selectAll(page).click();
    await expect(getBlock(page, 'sel_value')).toHaveText('selected=[]');
  });
});
