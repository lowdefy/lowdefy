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

// Descriptions renders with .ant-descriptions class
const getDescriptions = (page, blockId) => getBlock(page, blockId).locator('.ant-descriptions');

test.describe('Descriptions Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'descriptions');
  });

  test('renders descriptions with title and items', async ({ page }) => {
    const block = getBlock(page, 'descriptions_basic');
    await expect(block).toBeVisible();
    const descriptions = getDescriptions(page, 'descriptions_basic');
    await expect(descriptions).toBeVisible();

    // Check title
    await expect(descriptions.locator('.ant-descriptions-title')).toHaveText('User Information');

    // Check items
    await expect(descriptions).toContainText('Name');
    await expect(descriptions).toContainText('John Doe');
    await expect(descriptions).toContainText('Email');
    await expect(descriptions).toContainText('john@example.com');
  });

  test('renders descriptions from object items', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_object');
    await expect(descriptions).toBeVisible();
    await expect(descriptions).toContainText('name');
    await expect(descriptions).toContainText('Jane Smith');
    await expect(descriptions).toContainText('email');
    await expect(descriptions).toContainText('jane@example.com');
  });

  test('renders bordered descriptions', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_bordered');
    await expect(descriptions).toBeVisible();
    await expect(descriptions).toHaveClass(/ant-descriptions-bordered/);
  });

  test('renders small size descriptions', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_small');
    await expect(descriptions).toBeVisible();
    await expect(descriptions).toHaveClass(/ant-descriptions-small/);
  });

  test('renders descriptions without colon', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_no_colon');
    await expect(descriptions).toBeVisible();
    // The label text should not contain a colon
    const label = descriptions.locator('.ant-descriptions-item-label').first();
    const labelText = await label.textContent();
    expect(labelText).not.toContain(':');
  });

  test('renders vertical layout descriptions', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_vertical');
    await expect(descriptions).toBeVisible();
    // Vertical layout has different row structure
    const rows = descriptions.locator('.ant-descriptions-row');
    // Vertical layout creates 2 rows per item (one for label, one for content)
    await expect(rows.first()).toBeVisible();
  });

  test('renders descriptions with custom columns', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_columns');
    await expect(descriptions).toBeVisible();
    await expect(descriptions.locator('.ant-descriptions-title')).toHaveText('Two Columns');
  });

  test('renders descriptions with item span', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_span');
    await expect(descriptions).toBeVisible();
    await expect(descriptions).toContainText('Normal');
    await expect(descriptions).toContainText('Wide');
  });

  test('renders descriptions with extra area', async ({ page }) => {
    const descriptions = getDescriptions(page, 'descriptions_extra');
    await expect(descriptions).toBeVisible();
    const extra = descriptions.locator('.ant-descriptions-extra');
    await expect(extra).toBeVisible();
    await expect(extra).toContainText('Edit');
  });
});
