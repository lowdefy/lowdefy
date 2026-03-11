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

// Google Maps blocks require a valid API key to fully render maps.
// Tests verify that block wrappers render without crashing.

test.describe('GoogleMapsScript Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'googlemapsscript');
  });

  test('GoogleMapsScript wrapper renders', async ({ page }) => {
    const block = getBlock(page, 'gmscript_basic');
    await expect(block).toBeVisible();
  });

  test('GoogleMaps block renders inside script wrapper', async ({ page }) => {
    const block = getBlock(page, 'gm_basic');
    await expect(block).toBeVisible();
  });

  test('GoogleMapsHeatmap block renders inside script wrapper', async ({ page }) => {
    const block = getBlock(page, 'gmheatmap_basic');
    await expect(block).toBeVisible();
  });
});
