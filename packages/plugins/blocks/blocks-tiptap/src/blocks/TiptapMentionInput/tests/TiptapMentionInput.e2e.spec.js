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

const editorLocator = (page, blockId) => page.locator(`#${blockId}_input .ProseMirror`).first();

test.describe('TiptapMentionInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tiptap-mention-input');
  });

  test('renders empty editor', async ({ page }) => {
    const block = getBlock(page, 'tiptap_mention_empty');
    await expect(block).toBeVisible();
    const editor = editorLocator(page, 'tiptap_mention_empty');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  test('renders placeholder when empty', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_placeholder');
    const placeholderEl = editor.locator('p.is-editor-empty').first();
    await expect(placeholderEl).toHaveAttribute('data-placeholder', 'Type @ to mention...');
  });

  test('renders initial html value with mention node', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_with_value');
    await expect(editor).toContainText('@Alice');
    await expect(editor.locator('.tiptap-mention')).toBeVisible();
  });

  test('disabled editor is not editable', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_disabled');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  test('typing @ opens mention dropdown with filtered options', async ({ page }) => {
    const editor = editorLocator(page, 'tiptap_mention_options');
    await editor.click();
    await page.keyboard.type('@A');
    const dropdown = page.locator('.tiptap-mention-items');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('.tiptap-mention-item', { hasText: 'Alice' })).toBeVisible();
  });

  test('selecting a mention renders the trigger char and label (not undefined)', async ({
    page,
  }) => {
    const editor = editorLocator(page, 'tiptap_mention_options');
    await editor.click();
    await page.keyboard.type('@B');
    await page.locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Bob' }).click();
    const mention = editor.locator('.tiptap-mention');
    await expect(mention).toBeVisible();
    await expect(mention).toHaveText('@Bob');
    await expect(editor).not.toContainText('undefined');
  });

  test.describe('group mentions', () => {
    const groupsId = 'tiptap_mention_groups';

    test('dropdown groups options under section headings', async ({ page }) => {
      await editorLocator(page, groupsId).click();
      await page.keyboard.type('@');
      const dropdown = page.locator('.tiptap-mention-items');
      await expect(dropdown).toBeVisible();
      const sections = dropdown.locator('.tiptap-mention-section');
      await expect(sections).toHaveText(['People', 'Roles']);
    });

    test('caps each section at mentions.limit (People trimmed to 3 of 4)', async ({ page }) => {
      await editorLocator(page, groupsId).click();
      await page.keyboard.type('@');
      const dropdown = page.locator('.tiptap-mention-items');
      await expect(dropdown).toBeVisible();
      // People has 4 options (Alice, Amir, Anna, Aaron) but limit is 3.
      await expect(dropdown.locator('.tiptap-mention-item', { hasText: 'Alice' })).toBeVisible();
      await expect(dropdown.locator('.tiptap-mention-item', { hasText: 'Aaron' })).toHaveCount(0);
      // Both Roles options fit under the cap.
      await expect(dropdown.locator('.tiptap-mention-item', { hasText: 'Finance' })).toBeVisible();
      await expect(
        dropdown.locator('.tiptap-mention-item', { hasText: 'Developers' })
      ).toBeVisible();
    });

    test('flat keyboard index crosses the section boundary', async ({ page }) => {
      const editor = editorLocator(page, groupsId);
      await editor.click();
      await page.keyboard.type('@');
      await expect(page.locator('.tiptap-mention-items')).toBeVisible();
      // Flat order is [Alice, Amir, Anna | Finance, Developers]; selection starts at 0.
      // Three ArrowDowns must land on Finance — the first Roles option — proving the
      // index carries across the People→Roles heading.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      const chip = editor.locator('[data-mention-group="finance"]');
      await expect(chip).toBeVisible();
      await expect(chip).toHaveText('@Finance');
    });

    test('group option renders a coloured <span> chip with data-mention-group', async ({
      page,
    }) => {
      const editor = editorLocator(page, groupsId);
      await editor.click();
      await page.keyboard.type('@Finance');
      await page.locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Finance' }).click();
      const chip = editor.locator('.tiptap-mention-group');
      await expect(chip).toHaveText('@Finance');
      await expect(chip).toHaveClass(/tiptap-mention\b/);
      await expect(chip).toHaveAttribute('data-mention-group', 'finance');
      await expect(chip).toHaveAttribute('style', /color:\s*#722ed1/);
      // getHref returns nothing for groups → plain span, never <a href="null">.
      expect(await chip.evaluate((n) => n.tagName.toLowerCase())).toBe('span');
    });

    test('person option renders an <a> from getHref (no href="null")', async ({ page }) => {
      const editor = editorLocator(page, groupsId);
      await editor.click();
      await page.keyboard.type('@Alice');
      await page.locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Alice' }).click();
      const chip = editor.locator('a.tiptap-mention', { hasText: '@Alice' });
      await expect(chip).toBeVisible();
      await expect(chip).toHaveAttribute('href', '/contacts?_id=user_1');
      await expect(chip).not.toHaveClass(/tiptap-mention-group/);
    });

    test('hovering a group chip shows its members, and typing tears it down', async ({ page }) => {
      const editor = editorLocator(page, groupsId);
      await editor.click();
      await page.keyboard.type('@Finance');
      await page.locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Finance' }).click();
      const chip = editor.locator('.tiptap-mention-group');
      await chip.hover();
      const popover = page.locator('.tiptap-mention-group-popover');
      await expect(popover).toBeVisible();
      await expect(popover.locator('.tiptap-mention-group-popover-header')).toContainText('Finance');
      await expect(popover.locator('.tiptap-mention-group-popover-header')).toContainText('2');
      await expect(popover).toContainText('Jane Doe');
      await expect(popover).toContainText('jane@example.com');
      // Editing the content must remove the popover.
      await editor.click();
      await page.keyboard.type(' hi');
      await expect(popover).toHaveCount(0);
    });

    test('group chip keeps its inline colour in the saved html', async ({ page }) => {
      const editor = editorLocator(page, groupsId);
      await editor.click();
      await page.keyboard.type('@Developers');
      await page
        .locator('.tiptap-mention-items .tiptap-mention-item', { hasText: 'Developers' })
        .click();
      const html = await editor.evaluate((n) => n.innerHTML);
      expect(html).toContain('data-mention-group="devs"');
      expect(html.toLowerCase()).toContain('#13c2c2');
    });
  });
});
