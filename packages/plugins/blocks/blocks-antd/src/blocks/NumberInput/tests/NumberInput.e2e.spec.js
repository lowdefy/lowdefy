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
import { escapeId } from '@lowdefy/e2e-utils';

// Helper to get the input element (input has id={blockId}_input)
const getInput = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

test.describe('NumberInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'numberinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'numberinput_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Number Input');
  });

  test('renders with initial value', async ({ page }) => {
    const input = getInput(page, 'numberinput_with_value');
    await expect(input).toHaveValue('42');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with placeholder', async ({ page }) => {
    const input = getInput(page, 'numberinput_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Enter a number');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'numberinput_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const block = getBlock(page, 'numberinput_small');
    const wrapper = block.locator('.ant-input-number');
    await expect(wrapper).toHaveClass(/ant-input-number-sm/);
  });

  test('renders large size', async ({ page }) => {
    const block = getBlock(page, 'numberinput_large');
    const wrapper = block.locator('.ant-input-number');
    await expect(wrapper).toHaveClass(/ant-input-number-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const block = getBlock(page, 'numberinput_borderless');
    const wrapper = block.locator('.ant-input-number');
    await expect(wrapper).toHaveClass(/ant-input-number-borderless/);
  });

  test('hides controls when controls is false', async ({ page }) => {
    const block = getBlock(page, 'numberinput_no_controls');
    // antd v6 uses .ant-input-number-actions instead of .ant-input-number-handler-wrap
    const handler = block.locator('.ant-input-number-actions');
    await expect(handler).toHaveCount(0);
  });

  test('shows controls when controls is true', async ({ page }) => {
    const block = getBlock(page, 'numberinput_controls');
    // Hover to show controls - antd v6 uses .ant-input-number-actions
    await block.hover();
    const handler = block.locator('.ant-input-number-actions');
    await expect(handler).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing', async ({ page }) => {
    const input = getInput(page, 'numberinput_onchange');
    // antd v6 InputNumber: use click + keyboard typing instead of fill
    await input.click();
    await input.press('Control+a');
    await page.keyboard.type('123');
    await input.press('Enter');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: 123');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'numberinput_onblur');

    await input.click();
    // Click elsewhere to blur
    await page.click('body');

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when input gains focus', async ({ page }) => {
    const input = getInput(page, 'numberinput_onfocus');
    await input.click();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onPressEnter event fires when Enter is pressed', async ({ page }) => {
    const input = getInput(page, 'numberinput_onpressenter');
    await input.click();
    await page.keyboard.press('Enter');

    const display = getBlock(page, 'onpressenter_display');
    await expect(display).toHaveText('Enter pressed');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can type number into input', async ({ page }) => {
    const input = getInput(page, 'numberinput_typing');
    // antd v6 InputNumber: use click + keyboard typing instead of fill
    await input.click();
    await input.press('Control+a');
    await page.keyboard.type('99');
    await input.press('Enter');

    const display = getBlock(page, 'typing_display');
    await expect(display).toHaveText('Typed: 99');
  });

  test('can increment using up arrow control', async ({ page }) => {
    const block = getBlock(page, 'numberinput_controls');
    const input = getInput(page, 'numberinput_controls');

    // Initial value is 10
    await expect(input).toHaveValue('10');

    // Hover to show controls - antd v6 uses .ant-input-number-action-up
    await block.hover();

    // Click up handler
    const upHandler = block.locator('.ant-input-number-action-up');
    await upHandler.click();

    // Value should be incremented
    await expect(input).toHaveValue('11');
  });

  test('can decrement using down arrow control', async ({ page }) => {
    const block = getBlock(page, 'numberinput_controls');
    const input = getInput(page, 'numberinput_controls');

    // Initial value is 10
    await expect(input).toHaveValue('10');

    // Hover to show controls - antd v6 uses .ant-input-number-action-down
    await block.hover();

    // Click down handler
    const downHandler = block.locator('.ant-input-number-action-down');
    await downHandler.click();

    // Value should be decremented
    await expect(input).toHaveValue('9');
  });
});
