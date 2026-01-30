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

// ConfirmModal renders in a portal using Modal.method(), target .ant-modal-confirm
const getConfirmModal = (page) => page.locator('.ant-modal-confirm').first();

test.describe('ConfirmModal Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'confirmmodal');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic confirm modal when opened', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ant-modal-confirm-title')).toHaveText('Confirm Action');
    await expect(modal.locator('.ant-modal-confirm-content')).toContainText(
      'Are you sure you want to proceed?'
    );
  });

  // ============================================
  // STATUS TYPE TESTS
  // ============================================

  test('renders success status modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_success').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-success/);
  });

  test('renders error status modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_error').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-error/);
  });

  test('renders info status modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_info').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-info/);
  });

  test('renders warning status modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_warning').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-warning/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders modal with custom button text', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_buttons').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    const okBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-primary');
    const cancelBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-default');
    await expect(okBtn).toHaveText('Yes, proceed');
    await expect(cancelBtn).toHaveText('No, go back');
  });

  test('renders centered modal', async ({ page }) => {
    const openBtn = getBlock(page, 'open_centered').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    const modalWrap = page.locator('.ant-modal-wrap');
    await expect(modalWrap).toHaveClass(/ant-modal-centered/);
  });

  test('renders modal with close button when closable is true', async ({ page }) => {
    const openBtn = getBlock(page, 'open_closable').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    const closeBtn = modal.locator('.ant-modal-close');
    await expect(closeBtn).toBeVisible();
  });

  test('renders modal with custom width', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_width').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('width', '600px');
  });

  test('renders modal with custom icon', async ({ page }) => {
    const openBtn = getBlock(page, 'open_with_icon').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    const icon = modal.locator('.ant-modal-confirm-body svg');
    await expect(icon).toBeAttached();
  });

  test('renders modal with content area', async ({ page }) => {
    const openBtn = getBlock(page, 'open_content_area').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ant-modal-confirm-content')).toContainText(
      'This is custom content from the content area.'
    );
  });

  // ============================================
  // RUNTIME STATUS OVERRIDE
  // ============================================

  test('can override status at runtime to success', async ({ page }) => {
    const openBtn = getBlock(page, 'open_runtime_success').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-success/);
  });

  test('can override status at runtime to error', async ({ page }) => {
    const openBtn = getBlock(page, 'open_runtime_error').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/ant-modal-confirm-error/);
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('closes modal when Ok button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();

    const okBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-primary');
    await okBtn.click();

    await expect(modal).toBeHidden();
  });

  test('closes modal when Cancel button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();

    const cancelBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-default');
    await cancelBtn.click();

    await expect(modal).toBeHidden();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onOk event fires when Ok button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onok').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();

    const okBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-primary');
    await okBtn.click();

    const display = getBlock(page, 'onok_display');
    await expect(display).toHaveText('Ok fired');
  });

  test('onCancel event fires when Cancel button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_oncancel').locator('.ant-btn');
    await openBtn.click();

    const modal = getConfirmModal(page);
    await expect(modal).toBeVisible();

    const cancelBtn = modal.locator('.ant-modal-confirm-btns .ant-btn-default');
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
});
