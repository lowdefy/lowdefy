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

test.describe('DiffTimeline Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'diff-timeline');
  });

  test('renders one timeline item per change', async ({ page }) => {
    const block = getBlock(page, 'diff_timeline');
    await expect(block.locator('.ant-timeline')).toBeVisible();
    await expect(block.locator('.ant-timeline-item')).toHaveCount(3);
  });
});
