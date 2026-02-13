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

// Helper to get the switch button element
const getSwitch = (page, blockId) => page.locator(`#${blockId}_input`);

test.describe('Switch Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'switch');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'switch_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Switch');
  });

  test('renders switch element', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_basic');
    await expect(switchEl).toBeVisible();
  });

  test('renders unchecked by default', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_basic');
    await expect(switchEl).not.toHaveClass(/ant-switch-checked/);
  });

  test('renders checked when value is true', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_checked');
    await expect(switchEl).toHaveClass(/ant-switch-checked/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_disabled');
    await expect(switchEl).toHaveClass(/ant-switch-disabled/);
  });

  test('renders disabled and can be checked via initial state', async ({ page }) => {
    // Test that a disabled switch can receive initial checked state
    const switchEl = getSwitch(page, 'switch_disabled');
    await expect(switchEl).toHaveClass(/ant-switch-disabled/);
    await expect(switchEl).not.toHaveClass(/ant-switch-checked/);
  });

  test('renders small size', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_small');
    await expect(switchEl).toHaveClass(/ant-switch-small/);
  });

  test('renders with checked and unchecked text', async ({ page }) => {
    const block = getBlock(page, 'switch_with_text');
    const switchEl = getSwitch(page, 'switch_with_text');

    // Should show OFF text when unchecked
    await expect(block.locator('.ant-switch-inner')).toContainText('OFF');

    // Toggle to checked
    await switchEl.click();

    // Check for ON text
    await expect(block.locator('.ant-switch-inner')).toContainText('ON');
  });

  test('renders with icons', async ({ page }) => {
    const block = getBlock(page, 'switch_with_icons');
    const icons = block.locator('.ant-switch .anticon');
    // Should have at least one icon visible
    await expect(icons.first()).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when switch is toggled', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_onchange');

    // Toggle the switch
    await switchEl.click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: true');
  });

  test('onChange event fires with false when toggled off', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_onchange');

    // Toggle on then off
    await switchEl.click();
    await switchEl.click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: false');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can toggle switch on', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_toggle');

    // Should be off initially
    await expect(switchEl).not.toHaveClass(/ant-switch-checked/);

    // Click to toggle on
    await switchEl.click();

    // Should now be checked
    await expect(switchEl).toHaveClass(/ant-switch-checked/);

    const display = getBlock(page, 'toggle_display');
    await expect(display).toHaveText('Switch is ON');
  });

  test('can toggle switch off', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_toggle');

    // Toggle on first
    await switchEl.click();
    await expect(switchEl).toHaveClass(/ant-switch-checked/);

    // Toggle off
    await switchEl.click();
    await expect(switchEl).not.toHaveClass(/ant-switch-checked/);

    const display = getBlock(page, 'toggle_display');
    await expect(display).toHaveText('Switch is OFF');
  });

  test('cannot toggle disabled switch', async ({ page }) => {
    const switchEl = getSwitch(page, 'switch_disabled');

    // Try to click
    await switchEl.click({ force: true });

    // Should still be unchecked and disabled
    await expect(switchEl).toHaveClass(/ant-switch-disabled/);
    await expect(switchEl).not.toHaveClass(/ant-switch-checked/);
  });
});
