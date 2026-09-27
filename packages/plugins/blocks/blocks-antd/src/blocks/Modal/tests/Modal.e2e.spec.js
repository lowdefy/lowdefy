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

// Modal renders in a portal, so we target .ant-modal in the DOM
const getModal = (page) => page.locator('.ant-modal').first();
const getModalMask = (page) => page.locator('.ant-modal-mask').first();

test.describe('Modal Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'modal');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic modal when opened', async ({ page }) => {
    // First verify the button exists
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await expect(openBtn).toBeVisible();
    await expect(openBtn).toHaveText('Open Basic Modal');

    // Click the button
    await openBtn.click();

    // Wait for modal to appear - Ant Design Modal renders in a portal
    // It may take a moment for the animation
    const modal = page.locator('.ant-modal-container');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-modal-title')).toHaveText('Basic Modal');
    await expect(page.locator('.ant-modal-body')).toContainText('This is the modal content.');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders modal with HTML title', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_title').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    const title = modal.locator('.ant-modal-title strong');
    await expect(title).toHaveText('Custom HTML Title');
  });

  test('renders centered modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_centered').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    // Centered modal has ant-modal-centered class on the wrapper
    const modalWrap = page.locator('.ant-modal-wrap');
    await expect(modalWrap).toHaveClass(/ant-modal-centered/);
  });

  test('renders modal without close button when closable is false', async ({ page }) => {
    const openBtn = getBlock(page, 'open_no_close').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    const closeBtn = modal.locator('.ant-modal-close');
    await expect(closeBtn).toHaveCount(0);
  });

  test('renders modal with custom button text', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_buttons').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    const okBtn = modal.locator('.ant-modal-footer .ant-btn-primary');
    const cancelBtn = modal.locator('.ant-modal-footer .ant-btn-default');
    await expect(okBtn).toHaveText('Confirm');
    await expect(cancelBtn).toHaveText('Dismiss');
  });

  test('renders modal with custom width', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_width').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    // Check the modal has the custom width style
    await expect(modal).toHaveCSS('width', '800px');
  });

  test('renders modal without footer when footer is false', async ({ page }) => {
    const openBtn = getBlock(page, 'open_no_footer').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    const footer = modal.locator('.ant-modal-footer');
    await expect(footer).toHaveCount(0);
  });

  test('renders modal with custom footer area', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_footer').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();
    const footer = modal.locator('.ant-modal-footer');
    await expect(footer).toContainText('Custom footer content');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('closes modal when Ok button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    const okBtn = modal.locator('.ant-modal-footer .ant-btn-primary');
    await okBtn.click();

    await expect(modal).toBeHidden();
  });

  test('closes modal when Cancel button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    const cancelBtn = modal.locator('.ant-modal-footer .ant-btn-default');
    await cancelBtn.click();

    await expect(modal).toBeHidden();
  });

  test('closes modal when close button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    const closeBtn = modal.locator('.ant-modal-close');
    await closeBtn.click();

    await expect(modal).toBeHidden();
  });

  test('closes modal when mask is clicked (maskClosable true)', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    // Click on the mask (outside the modal)
    const modalWrap = page.locator('.ant-modal-wrap');
    await modalWrap.click({ position: { x: 10, y: 10 } });

    await expect(modal).toBeHidden();
  });

  test('does not close modal when mask is clicked (maskClosable false)', async ({ page }) => {
    const openBtn = getBlock(page, 'open_mask_not_closable').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    // Click on the mask (outside the modal)
    const modalWrap = page.locator('.ant-modal-wrap');
    await modalWrap.click({ position: { x: 10, y: 10 } });

    // Modal should still be visible
    await expect(modal).toBeVisible();

    // Close it properly
    const okBtn = modal.locator('.ant-modal-footer .ant-btn-primary');
    await okBtn.click();
  });

  test('toggleOpen method toggles modal visibility', async ({ page }) => {
    const toggleBtn = getBlock(page, 'toggle_modal').locator('.ant-btn');

    // Modal should be closed initially
    const modal = page.locator('.ant-modal-container');
    await expect(modal).toBeHidden();

    // Toggle open
    await toggleBtn.click();
    await expect(modal).toBeVisible();

    // Close modal using Ok button (since modal overlay blocks the toggle button)
    const okBtn = page.locator('.ant-modal-footer .ant-btn-primary');
    await okBtn.click();
    await expect(modal).toBeHidden();

    // Toggle open again to verify method still works
    await toggleBtn.click();
    await expect(modal).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onOk event fires when Ok button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onok').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    const okBtn = modal.locator('.ant-modal-footer .ant-btn-primary');
    await okBtn.click();

    const display = getBlock(page, 'onok_display');
    await expect(display).toHaveText('Ok fired');
  });

  test('onCancel event fires when Cancel button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_oncancel').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    const cancelBtn = modal.locator('.ant-modal-footer .ant-btn-default');
    await cancelBtn.click();

    const display = getBlock(page, 'oncancel_display');
    await expect(display).toHaveText('Cancel fired');
  });

  test('onOpen event fires when modal is opened', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onopen').locator('.ant-btn');
    await openBtn.click();

    const display = getBlock(page, 'onopen_display');
    await expect(display).toHaveText('Open fired');
  });

  test('onClose event fires when modal is closed', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onclose').locator('.ant-btn');
    await openBtn.click();

    const modal = getModal(page);
    await expect(modal).toBeVisible();

    // Close the modal
    const okBtn = modal.locator('.ant-modal-footer .ant-btn-primary');
    await okBtn.click();

    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Close fired');
  });
});

test.describe('Modal Block features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'modal_features');
  });

  const openModal = async (page, id) => {
    await getBlock(page, `open_${id}`).locator('.ant-btn').click();
    const container = page.locator('.ant-modal-container').filter({ hasText: `Content of ${id}.` });
    await expect(container).toBeVisible();
    return container;
  };

  test('mask blur adds the antd blur class to the mask', async ({ page }) => {
    await openModal(page, 'modal_blur');
    await expect(page.locator('.ant-modal-mask.ant-modal-mask-blur')).toBeVisible();
  });

  test('mask.closable false wins over maskClosable true', async ({ page }) => {
    const container = await openModal(page, 'modal_mask_object_not_closable');
    await page
      .locator('.ant-modal-wrap')
      .filter({ has: container })
      .click({ position: { x: 10, y: 10 } });
    await expect(container).toBeVisible();
  });

  test('closable disabled renders a disabled close button', async ({ page }) => {
    const container = await openModal(page, 'modal_close_disabled');
    const close = container.locator('.ant-modal-close');
    await expect(close).toBeVisible();
    await expect(close).toBeDisabled();
    // The close icon still comes from the app icon set.
    await expect(close.locator('svg.lucide')).toBeAttached();
  });

  test('keyboard false keeps the modal open on Escape', async ({ page }) => {
    const container = await openModal(page, 'modal_no_keyboard');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(container).toBeVisible();
  });

  test('loading shows a skeleton in place of the body', async ({ page }) => {
    await getBlock(page, 'open_modal_loading').locator('.ant-btn').click();
    const container = page.locator('.ant-modal-container').filter({ hasText: 'Loading' });
    await expect(container.locator('.ant-skeleton')).toBeVisible();
    await expect(container).not.toContainText('Content of modal_loading.');
  });

  test('content, title and header cssKeys reach the antd semantic elements', async ({ page }) => {
    const container = await openModal(page, 'modal_styled');
    await expect(container).toHaveClass(/modal-styled-content/);
    await expect(container).toHaveCSS('border-top-width', '3px');
    await expect(container.locator('.ant-modal-title')).toHaveClass(/modal-styled-title/);
    await expect(container.locator('.ant-modal-header')).toHaveCSS(
      'background-color',
      'rgb(255, 0, 0)'
    );
  });

  test('afterOpenChange fires with the open state', async ({ page }) => {
    const container = await openModal(page, 'modal_after_open_change');
    const display = getBlock(page, 'after_open_change_display');
    await expect(display).toHaveText('opened');
    await container.locator('.ant-modal-footer .ant-btn-primary').click();
    await expect(display).toHaveText('closed');
  });

  test('forceRender renders the modal content before it opens', async ({ page }) => {
    await expect(page.locator('#bl-modal_force_render_text')).toBeAttached();
    await expect(page.locator('#bl-modal_force_render_text')).toBeHidden();
  });

  test('destroyOnHidden unmounts the content when the modal closes', async ({ page }) => {
    const container = await openModal(page, 'modal_destroy_on_hidden');
    await expect(page.locator('#bl-modal_destroy_on_hidden_text')).toBeAttached();
    await container.locator('.ant-modal-footer .ant-btn-primary').click();
    await expect(page.locator('#bl-modal_destroy_on_hidden_text')).not.toBeAttached();
  });

  test('responsive width applies the matching breakpoint', async ({ page }) => {
    const container = await openModal(page, 'modal_responsive_width');
    const modal = page.locator('.ant-modal').filter({ has: container });
    // Polled, because the modal zooms in from a smaller scale as it opens.
    await expect.poll(async () => Math.round((await modal.boundingBox()).width)).toBe(640);
  });

  test('scrollLock false leaves page scrolling on', async ({ page }) => {
    await openModal(page, 'modal_no_scroll_lock');
    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(overflow).not.toBe('hidden');
  });
});
