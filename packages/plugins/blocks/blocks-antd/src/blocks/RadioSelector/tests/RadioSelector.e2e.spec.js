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

// Helper to get a radio option by its label text (works regardless of ID format)
const getRadioByLabel = (page, blockId, labelText) =>
  page.locator(`#${escapeId(blockId)}_input label:has-text("${labelText}") input[type="radio"]`);

// Helper to get a radio option by index (for object options)
const getRadioByIndex = (page, blockId, index) => page.locator(`#${escapeId(blockId)}_${index}`);

// Helper to get the radio group
const getRadioGroup = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

test.describe('RadioSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'radio_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with options visible', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_basic');
    await expect(group).toBeVisible();

    // All three options should be visible
    await expect(getRadioByLabel(page, 'rs_basic', 'Option 1')).toBeVisible();
    await expect(getRadioByLabel(page, 'rs_basic', 'Option 2')).toBeVisible();
    await expect(getRadioByLabel(page, 'rs_basic', 'Option 3')).toBeVisible();
  });

  test('renders with initial value checked', async ({ page }) => {
    // Option 2 should be checked
    const radio = getRadioByLabel(page, 'rs_with_value', 'Option 2');
    await expect(radio).toBeChecked();

    // Other options should not be checked
    await expect(getRadioByLabel(page, 'rs_with_value', 'Option 1')).not.toBeChecked();
    await expect(getRadioByLabel(page, 'rs_with_value', 'Option 3')).not.toBeChecked();
  });

  test('renders option labels correctly', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_basic');
    const labels = group.locator('label');

    await expect(labels.nth(0)).toHaveText('Option 1');
    await expect(labels.nth(1)).toHaveText('Option 2');
    await expect(labels.nth(2)).toHaveText('Option 3');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_disabled');
    await expect(group).toHaveClass(/ant-radio-group/);

    // Check that radios are disabled
    const radio = getRadioByLabel(page, 'rs_disabled', 'A');
    await expect(radio).toBeDisabled();
  });

  test('renders vertical direction', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_vertical');
    const space = group.locator('.ant-space');
    await expect(space).toHaveClass(/ant-space-vertical/);
  });

  test('renders horizontal direction', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_horizontal');
    const space = group.locator('.ant-space');
    await expect(space).toHaveClass(/ant-space-horizontal/);
  });

  // ============================================
  // COLUMNS (GRID LAYOUT) TESTS
  // ============================================

  test('renders a grid instead of the flow layout when columns is set', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_columns_2');
    await expect(group.locator('.ant-row')).toHaveCount(1);
    await expect(group.locator('.ant-space')).toHaveCount(0);
  });

  test('keeps the flow layout when columns is not set', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_basic');
    await expect(group.locator('.ant-space')).toHaveCount(1);
    await expect(group.locator('.ant-row')).toHaveCount(0);
  });

  test('stretches the group to full width in grid mode', async ({ page }) => {
    // The group is inline-block, so without an explicit width the row inside it
    // sizes to its content instead of filling the container.
    const group = getRadioGroup(page, 'rs_columns_2');
    const [groupWidth, parentWidth] = await group.evaluate((el) => [
      el.getBoundingClientRect().width,
      el.parentElement.getBoundingClientRect().width,
    ]);
    expect(Math.round(groupWidth)).toBe(Math.round(parentWidth));
  });

  test('renders two even columns as span 12', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_columns_2');
    const cols = group.locator('.ant-row > .ant-col');
    await expect(cols).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      await expect(cols.nth(i)).toHaveClass(/ant-col-12/);
    }
  });

  test('renders three even columns as span 8', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_columns_3');
    const cols = group.locator('.ant-row > .ant-col');
    await expect(cols).toHaveCount(6);
    await expect(cols.first()).toHaveClass(/ant-col-8/);
  });

  test('renders a responsive column count per breakpoint', async ({ page }) => {
    const col = getRadioGroup(page, 'rs_columns_responsive').locator('.ant-row > .ant-col').first();
    await expect(col).toHaveClass(/ant-col-xs-24/);
    await expect(col).toHaveClass(/ant-col-md-8/);
  });

  test('applies an explicit gutter to the grid', async ({ page }) => {
    const col = getRadioGroup(page, 'rs_columns_gutter').locator('.ant-row > .ant-col').first();
    await expect(col).toHaveCSS('padding-left', '12px');
    await expect(col).toHaveCSS('padding-right', '12px');
  });

  test('falls back to content width for a column count that does not divide 24', async ({
    page,
  }) => {
    // 24/5 is 4.8, so the class name carries a decimal and antd has no rule for it —
    // the column gets no flex-basis and keeps its content width. A supported count
    // resolves to a percentage, which is the contrast being asserted here.
    const unsupported = getRadioGroup(page, 'rs_columns_unsupported')
      .locator('.ant-row > .ant-col')
      .first();
    await expect(unsupported).toHaveCSS('flex-basis', 'auto');

    const supported = getRadioGroup(page, 'rs_columns_2').locator('.ant-row > .ant-col').first();
    await expect(supported).toHaveCSS('flex-basis', '50%');
  });

  test('renders option labels at normal size inside the grid', async ({ page }) => {
    // The radio group sets font-size 0 as an inline-block whitespace trick; an
    // intervening column must not leave the labels at that size.
    const label = getRadioGroup(page, 'rs_columns_2').locator('.ant-radio-wrapper').first();
    const fontSize = await label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThan(0);
  });

  test('nests the column outside a per-option color provider', async ({ page }) => {
    const cols = getRadioGroup(page, 'rs_columns_color').locator('.ant-row > .ant-col');
    await expect(cols).toHaveCount(2);
    await expect(cols.nth(1).locator('.ant-radio-wrapper')).toHaveCount(1);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'rs_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Select your option/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'rs_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Choose one/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select exactly one option');
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  test('renders object options with labels', async ({ page }) => {
    // Object options use index as id suffix
    const option1 = page.locator('label:has(#rs_object_options_0)');
    const option2 = page.locator('label:has(#rs_object_options_1)');
    const option3 = page.locator('label:has(#rs_object_options_2)');

    await expect(option1).toHaveText('First Option');
    await expect(option2).toHaveText('Second Option');
    await expect(option3).toHaveText('Third Option');
  });

  test('renders disabled option correctly', async ({ page }) => {
    const enabledRadio = getRadioByIndex(page, 'rs_disabled_option', 0);
    const disabledRadio = getRadioByIndex(page, 'rs_disabled_option', 1);
    const anotherEnabled = getRadioByIndex(page, 'rs_disabled_option', 2);

    await expect(enabledRadio).toBeEnabled();
    await expect(disabledRadio).toBeDisabled();
    await expect(anotherEnabled).toBeEnabled();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when option selected', async ({ page }) => {
    const radio = getRadioByLabel(page, 'rs_onchange', 'Banana');
    await radio.click();

    const display = getBlock(page, 'rs_onchange_display');
    await expect(display).toHaveText('Selected: Banana');
  });

  test('onChange event fires when changing selection', async ({ page }) => {
    // Select first option
    await getRadioByLabel(page, 'rs_onchange', 'Apple').click();

    const display = getBlock(page, 'rs_onchange_display');
    await expect(display).toHaveText('Selected: Apple');

    // Change to another option
    await getRadioByLabel(page, 'rs_onchange', 'Cherry').click();
    await expect(display).toHaveText('Selected: Cherry');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can select option by clicking', async ({ page }) => {
    const radio = getRadioByLabel(page, 'rs_interaction', 'A');
    await expect(radio).not.toBeChecked();

    await radio.click();
    await expect(radio).toBeChecked();
  });

  test('selecting one option deselects others', async ({ page }) => {
    // Select first option
    await getRadioByLabel(page, 'rs_interaction', 'A').click();
    await expect(getRadioByLabel(page, 'rs_interaction', 'A')).toBeChecked();

    // Select second option
    await getRadioByLabel(page, 'rs_interaction', 'B').click();
    await expect(getRadioByLabel(page, 'rs_interaction', 'B')).toBeChecked();
    await expect(getRadioByLabel(page, 'rs_interaction', 'A')).not.toBeChecked();
  });

  test('clicking same option again keeps it selected', async ({ page }) => {
    const radio = getRadioByLabel(page, 'rs_interaction', 'A');

    await radio.click();
    await expect(radio).toBeChecked();

    // Click again - should still be checked (radio buttons don't uncheck)
    await radio.click();
    await expect(radio).toBeChecked();
  });

  test('can click on label to select radio', async ({ page }) => {
    const group = getRadioGroup(page, 'rs_interaction');
    const label = group.locator('label').filter({ hasText: 'A' });
    const radio = getRadioByLabel(page, 'rs_interaction', 'A');

    await expect(radio).not.toBeChecked();
    await label.click();
    await expect(radio).toBeChecked();
  });

  test('cannot interact with disabled radio', async ({ page }) => {
    const radio = getRadioByLabel(page, 'rs_disabled', 'A');
    await expect(radio).not.toBeChecked();

    // Try to click - should fail because disabled
    await radio.click({ force: true });

    // Should still be unchecked
    await expect(radio).not.toBeChecked();
  });

  test('cannot select disabled option in mixed group', async ({ page }) => {
    const disabledRadio = getRadioByIndex(page, 'rs_disabled_option', 1);
    await expect(disabledRadio).not.toBeChecked();

    // Try to click - should fail because disabled
    await disabledRadio.click({ force: true });

    // Should still be unchecked
    await expect(disabledRadio).not.toBeChecked();
  });
});
