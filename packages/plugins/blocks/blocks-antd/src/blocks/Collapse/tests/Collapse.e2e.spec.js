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

// Collapse renders with .ant-collapse class
const getCollapse = (page, blockId) => getBlock(page, blockId).locator('.ant-collapse');
const getPanel = (collapse, index) => collapse.locator('.ant-collapse-item').nth(index);
const getPanelHeader = (panel) => panel.locator('.ant-collapse-header');

test.describe('Collapse Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'collapse');
  });

  test('renders collapse with multiple panels', async ({ page }) => {
    const block = getBlock(page, 'collapse_basic');
    await expect(block).toBeVisible();
    const collapse = getCollapse(page, 'collapse_basic');
    await expect(collapse).toBeVisible();
    // Should have 3 panels
    const panels = collapse.locator('.ant-collapse-item');
    await expect(panels).toHaveCount(3);
    await expect(getPanelHeader(panels.nth(0))).toContainText('Panel 1');
    await expect(getPanelHeader(panels.nth(1))).toContainText('Panel 2');
    await expect(getPanelHeader(panels.nth(2))).toContainText('Panel 3');
  });

  test('can expand and collapse panels', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_basic');
    const panel2 = getPanel(collapse, 1);

    // Panel 2 should be collapsed initially (panel 1 is default open)
    await expect(panel2).not.toHaveClass(/ant-collapse-item-active/);

    // Click to expand
    await getPanelHeader(panel2).click();
    await expect(panel2).toHaveClass(/ant-collapse-item-active/);
  });

  test('accordion mode allows only one panel open', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_accordion');
    const panel1 = getPanel(collapse, 0);
    const panel2 = getPanel(collapse, 1);

    // Panel 1 is open by default
    await expect(panel1).toHaveClass(/ant-collapse-item-active/);

    // Click panel 2
    await getPanelHeader(panel2).click();

    // Panel 2 should be open, panel 1 should be closed
    await expect(panel2).toHaveClass(/ant-collapse-item-active/);
    await expect(panel1).not.toHaveClass(/ant-collapse-item-active/);
  });

  test('renders borderless collapse', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_borderless');
    await expect(collapse).toBeVisible();
    await expect(collapse).toHaveClass(/ant-collapse-borderless/);
  });

  test('renders with icon on right', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_icon_right');
    await expect(collapse).toBeVisible();
    await expect(collapse).toHaveClass(/ant-collapse-icon-placement-end/);
  });

  test('disabled panel cannot be opened', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_disabled');
    const disabledPanel = getPanel(collapse, 1);

    // Disabled panel should have disabled class
    await expect(disabledPanel).toHaveClass(/ant-collapse-item-disabled/);
  });

  test('opens panel specified by defaultActiveKey', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_default_active');
    const panel1 = getPanel(collapse, 0);
    const panel2 = getPanel(collapse, 1);

    // Second panel should be open by default
    await expect(panel2).toHaveClass(/ant-collapse-item-active/);
    await expect(panel1).not.toHaveClass(/ant-collapse-item-active/);
  });

  test('onChange event fires when panel is toggled', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_onchange');
    const panel = getPanel(collapse, 0);

    // Click to toggle panel (close it since it's open by default)
    await getPanelHeader(panel).click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Collapse changed!');
  });

  test('renders a ghost collapse in the large size', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_ghost_large');
    await expect(collapse).toHaveClass(/ant-collapse-ghost/);
    await expect(collapse).toHaveClass(/ant-collapse-large/);
  });

  test('collapsible icon toggles only from the expand icon', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_icon_only');
    const panel = getPanel(collapse, 0);
    await expect(panel).toHaveClass(/ant-collapse-item/);
    await expect(panel).not.toHaveClass(/ant-collapse-item-active/);
    await panel.locator('.ant-collapse-title').click();
    await expect(panel).not.toHaveClass(/ant-collapse-item-active/);
    await panel.locator('.ant-collapse-expand-icon').click();
    await expect(panel).toHaveClass(/ant-collapse-item-active/);
  });

  test('renders panel extra content without the arrow', async ({ page }) => {
    const panel = getPanel(getCollapse(page, 'collapse_hidden_arrow_extra'), 0);
    await expect(panel.locator('.ant-collapse-extra')).toContainText('Extra tag');
    await expect(panel.locator('.ant-collapse-expand-icon')).toHaveCount(0);
  });

  test('applies class and style to the semantic parts', async ({ page }) => {
    const panel = getPanel(getCollapse(page, 'collapse_css_keys'), 0);
    await expect(getPanelHeader(panel)).toHaveClass(/collapse-header-class/);
    await expect(panel.locator('.ant-collapse-title')).toHaveClass(/collapse-title-class/);
    const body = panel.locator('.ant-collapse-body');
    await expect(body).toHaveClass(/collapse-content-class/);
    await expect(body).toHaveCSS('background-color', 'rgb(255, 250, 230)');
  });

  test('renders an empty collapse when panels is an empty list', async ({ page }) => {
    const collapse = getCollapse(page, 'collapse_empty_panels');
    await expect(collapse).toBeAttached();
    await expect(collapse.locator('.ant-collapse-item')).toHaveCount(0);
  });
});
