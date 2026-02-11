/*
  Copyright 2020-2024 Lowdefy, Inc

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

// TimelineList renders with .ant-timeline class
const getTimeline = (page, blockId) => getBlock(page, blockId).locator('.ant-timeline');
const getTimelineItems = (page, blockId) => getBlock(page, blockId).locator('.ant-timeline-item');

test.describe('TimelineList Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'timelinelist');
  });

  test('renders timeline with items from state', async ({ page }) => {
    const block = getBlock(page, 'timeline_basic');
    await expect(block).toBeVisible();
    const items = getTimelineItems(page, 'timeline_basic');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Event 1');
    await expect(items.nth(1)).toContainText('Event 2');
    await expect(items.nth(2)).toContainText('Event 3');
  });

  test('renders empty timeline when state array is undefined', async ({ page }) => {
    const block = getBlock(page, 'timeline_empty');
    await expect(block).toBeVisible();
    const items = getTimelineItems(page, 'timeline_empty');
    await expect(items).toHaveCount(0);
  });

  test('renders timeline items with custom colors', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_colors');
    await expect(items).toHaveCount(3);
    // Check that items have different colored dots (green, red, blue classes)
    await expect(items.nth(0).locator('.ant-timeline-item-head')).toHaveClass(
      /ant-timeline-item-head-green/
    );
    await expect(items.nth(1).locator('.ant-timeline-item-head')).toHaveClass(
      /ant-timeline-item-head-red/
    );
    await expect(items.nth(2).locator('.ant-timeline-item-head')).toHaveClass(
      /ant-timeline-item-head-blue/
    );
  });

  test('renders timeline with mode left', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_mode_left');
    await expect(timeline).toHaveClass(/ant-timeline-left/);
  });

  test('renders timeline with mode right', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_mode_right');
    await expect(timeline).toHaveClass(/ant-timeline-right/);
  });

  test('renders timeline with mode alternate', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_mode_alternate');
    await expect(timeline).toHaveClass(/ant-timeline-alternate/);
  });

  test('renders timeline items with labels', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_labels');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0).locator('.ant-timeline-item-label')).toHaveText('2024-01-01');
    await expect(items.nth(1).locator('.ant-timeline-item-label')).toHaveText('2024-01-02');
    await expect(items.nth(2).locator('.ant-timeline-item-label')).toHaveText('2024-01-03');
  });

  test('renders timeline items with custom icons', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_icons');
    await expect(items).toHaveCount(2);
    // Check icons are rendered (SVG elements in the head)
    await expect(items.nth(0).locator('.ant-timeline-item-head svg')).toBeVisible();
    await expect(items.nth(1).locator('.ant-timeline-item-head svg')).toBeVisible();
  });

  test('renders timeline with pending indicator', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_pending');
    await expect(timeline).toHaveClass(/ant-timeline-pending/);
    // Should have a pending item at the end
    const pendingItem = timeline.locator('.ant-timeline-item-pending');
    await expect(pendingItem).toBeVisible();
  });

  test('renders timeline with pending text', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_pending_text');
    await expect(timeline).toHaveClass(/ant-timeline-pending/);
    const pendingItem = timeline.locator('.ant-timeline-item-pending');
    await expect(pendingItem).toContainText('Loading more...');
  });

  test('renders timeline in reverse order', async ({ page }) => {
    const timeline = getTimeline(page, 'timeline_reverse');
    await expect(timeline).toHaveClass(/ant-timeline-reverse/);
  });

  test('renders timeline with custom field mappings', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_custom_fields');
    await expect(items).toHaveCount(2);
    // Check custom color field is applied (green class)
    await expect(items.nth(0).locator('.ant-timeline-item-head')).toHaveClass(
      /ant-timeline-item-head-green/
    );
    // Check custom label field is applied
    await expect(items.nth(0).locator('.ant-timeline-item-label')).toHaveText('Jan 1');
    await expect(items.nth(1).locator('.ant-timeline-item-label')).toHaveText('Jan 2');
  });
});
