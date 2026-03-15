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

// In antd v6, Timeline is built on top of Steps with type="dot".
// The root element has both ant-steps and ant-timeline classes.
// Items have both ant-steps-item and ant-timeline-item classes.
// Color classes are ant-timeline-item-color-{color} on the item element.
// Labels map to titles: ant-timeline-item-title.
// Icons render inside ant-timeline-item-icon.
// Mode, reverse, and pending no longer produce distinct CSS classes on the root.
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
    // In antd v6, color classes are on the item element: ant-timeline-item-color-{color}
    await expect(items.nth(0)).toHaveClass(/ant-timeline-item-color-green/);
    await expect(items.nth(1)).toHaveClass(/ant-timeline-item-color-red/);
    await expect(items.nth(2)).toHaveClass(/ant-timeline-item-color-blue/);
  });

  test('renders timeline with mode left', async ({ page }) => {
    // In antd v6, mode left maps to placement start on items
    const items = getTimelineItems(page, 'timeline_mode_left');
    await expect(items.first()).toHaveClass(/ant-timeline-item-placement-start/);
  });

  test('renders timeline with mode right', async ({ page }) => {
    // In antd v6, mode right maps to placement end on items
    const items = getTimelineItems(page, 'timeline_mode_right');
    await expect(items.first()).toHaveClass(/ant-timeline-item-placement-end/);
  });

  test('renders timeline with mode alternate', async ({ page }) => {
    // In antd v6, alternate mode adds layout-alternate class on root
    // and alternates item placement between start and end
    const timeline = getTimeline(page, 'timeline_mode_alternate');
    await expect(timeline).toHaveClass(/ant-timeline-layout-alternate/);
    const items = getTimelineItems(page, 'timeline_mode_alternate');
    await expect(items.nth(0)).toHaveClass(/ant-timeline-item-placement-start/);
    await expect(items.nth(1)).toHaveClass(/ant-timeline-item-placement-end/);
    await expect(items.nth(2)).toHaveClass(/ant-timeline-item-placement-start/);
  });

  test('renders timeline items with labels', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_labels');
    await expect(items).toHaveCount(3);
    // In antd v6, labels are rendered as titles: ant-timeline-item-title
    await expect(items.nth(0).locator('.ant-timeline-item-title')).toHaveText('2024-01-01');
    await expect(items.nth(1).locator('.ant-timeline-item-title')).toHaveText('2024-01-02');
    await expect(items.nth(2).locator('.ant-timeline-item-title')).toHaveText('2024-01-03');
  });

  test('renders timeline items with custom icons', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_icons');
    await expect(items).toHaveCount(2);
    // In antd v6, icons render inside ant-timeline-item-icon
    await expect(items.nth(0).locator('.ant-timeline-item-icon svg')).toBeVisible();
    await expect(items.nth(1).locator('.ant-timeline-item-icon svg')).toBeVisible();
  });

  test('renders timeline with pending indicator', async ({ page }) => {
    // In antd v6, pending adds an extra item (with process status) instead of a class on root
    const items = getTimelineItems(page, 'timeline_pending');
    // 2 items from state + 1 pending item
    await expect(items).toHaveCount(3);
    // The pending item has process status
    await expect(items.last()).toHaveClass(/ant-steps-item-process/);
  });

  test('renders timeline with pending text', async ({ page }) => {
    // In antd v6, pending text becomes the content of the pending item
    const items = getTimelineItems(page, 'timeline_pending_text');
    // 2 items from state + 1 pending item
    await expect(items).toHaveCount(3);
    await expect(items.last()).toContainText('Loading more...');
  });

  test('renders timeline in reverse order', async ({ page }) => {
    // In antd v6, reverse just reverses the item array order, no CSS class
    const items = getTimelineItems(page, 'timeline_reverse');
    await expect(items).toHaveCount(3);
    // Items should be in reversed order: Third, Second, First
    await expect(items.nth(0)).toContainText('Third');
    await expect(items.nth(1)).toContainText('Second');
    await expect(items.nth(2)).toContainText('First');
  });

  test('renders timeline with custom field mappings', async ({ page }) => {
    const items = getTimelineItems(page, 'timeline_custom_fields');
    await expect(items).toHaveCount(2);
    // Check custom color field is applied (ant-timeline-item-color-green on item)
    await expect(items.nth(0)).toHaveClass(/ant-timeline-item-color-green/);
    // Check custom label field is applied (rendered as title)
    await expect(items.nth(0).locator('.ant-timeline-item-title')).toHaveText('Jan 1');
    await expect(items.nth(1).locator('.ant-timeline-item-title')).toHaveText('Jan 2');
  });
});
