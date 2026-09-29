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

// Enrichment tables (enrichment.e2e.yaml). Cells carry their run state in
// [data-lf-enrich-status]; event payloads are recorded as JSON in the ev_<event> spans; buttons
// stand in for the server by pushing states with applyTransaction.
const cell = (page, rowKey, key, blockId = 'enrich') =>
  getBlock(page, blockId).locator(
    `.lf-table-body [data-row-key="${rowKey}"] [data-lf-cell][data-col-key="${key}"]`
  );
const state = (page, rowKey, key, blockId) =>
  cell(page, rowKey, key, blockId).locator('[data-lf-enrich-status]');
const header = (page, key, blockId = 'enrich') =>
  getBlock(page, blockId).locator(`[data-lf-header][data-col-key="${key}"]`);
const chip = (page, key, blockId) =>
  header(page, key, blockId).locator('[data-lf-enrich-progress]');
const picker = (page) => page.locator('[data-lf-column-picker]');
const details = (page) => page.locator('[data-lf-cell-details]');
// The open select's dropdown: the newest one, as a closing one may still be animating out.
const dropdown = (page) => page.locator('.ant-select-dropdown:visible').last();
const button = (page, blockId) => page.locator(`#${blockId}`);
const selectRow = (page, rowKey, blockId = 'enrich') =>
  getBlock(page, blockId)
    .locator(`.lf-table-body [data-row-key="${rowKey}"] [data-lf-select-cell] input`)
    .click();
// Enrichment cells hold links (email); a click beside the value opens the details panel.
const clickCell = (page, rowKey, key) =>
  cell(page, rowKey, key).click({ position: { x: 180, y: 10 } });

async function eventOf(page, name) {
  return JSON.parse(await getBlock(page, `ev_${name}`).textContent());
}

async function expectEvent(page, name, expected) {
  await expect.poll(() => eventOf(page, name)).toEqual(expected);
}

async function openMenu(page, key, blockId = 'enrich') {
  await header(page, key, blockId).hover();
  await header(page, key, blockId).locator('[data-lf-header-menu]').click();
  const menu = page.locator(`[data-lf-header-menu-popup][data-col-key="${key}"]`);
  await expect(menu).toBeVisible();
  return menu;
}

async function menuItem(page, key, name, blockId = 'enrich') {
  const menu = await openMenu(page, key, blockId);
  await menu.getByRole('menuitem', { name, exact: true }).click();
}

async function pick(page, select, title) {
  await select.click();
  await dropdown(page).getByTitle(title, { exact: true }).click();
}

// A select with search: type the option and pick it with Enter (the list is virtual, so an
// option far down is not rendered until the search brings it up).
async function search(page, select, text) {
  await select.click();
  await page.keyboard.type(text);
  await dropdown(page).getByTitle(text, { exact: true }).click();
}

async function previewConfig(page) {
  return JSON.parse(await picker(page).locator('[data-lf-picker-preview]').textContent());
}

async function openPicker(page, blockId = 'enrich') {
  await getBlock(page, blockId).locator('[data-lf-enrich-add-column]').click();
  await expect(picker(page)).toBeVisible();
}

test.describe('Table enrichment', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table-enrichment');
    await expect(cell(page, 'r1', 'company')).toHaveText('Acme');
  });

  // ============================================
  // CELL RUN STATES
  // ============================================

  test('enrichment cells render every run state', async ({ page }) => {
    await expect(state(page, 'r1', 'email')).toHaveAttribute('data-lf-enrich-status', 'ok');
    await expect(cell(page, 'r1', 'email')).toHaveText('ada@acme.com');
    await expect(state(page, 'r2', 'email')).toHaveAttribute('data-lf-enrich-status', 'queued');
    await expect(cell(page, 'r2', 'email')).toHaveText('Queued');
    await expect(state(page, 'r3', 'email')).toHaveAttribute('data-lf-enrich-status', 'running');
    await expect(cell(page, 'r3', 'email').locator('.lf-enrich-spinner')).toBeVisible();
    await expect(state(page, 'r4', 'email')).toHaveAttribute('data-lf-enrich-status', 'error');
    await expect(cell(page, 'r4', 'email')).toHaveText('Error');
    await expect(state(page, 'r5', 'email')).toHaveAttribute('data-lf-enrich-status', 'empty');
    await expect(cell(page, 'r5', 'email')).toHaveText('No result');
    await expect(state(page, 'r7', 'email')).toHaveAttribute('data-lf-enrich-status', 'none');
    await expect(cell(page, 'r7', 'email')).toHaveText('—');
    // Cells are static DOM: no antd component until hover.
    await expect(getBlock(page, 'enrich').locator('.lf-table-body .ant-tooltip-open')).toHaveCount(
      0
    );
  });

  test('an error cell shows its message in a tooltip on hover', async ({ page }) => {
    await expect(cell(page, 'r4', 'email').locator('[data-lf-enrich-error]')).toHaveAttribute(
      'data-lf-enrich-error',
      'Rate limited by the provider'
    );
    await cell(page, 'r4', 'email').hover();
    await cell(page, 'r4', 'email').locator('[data-lf-enrich-error]').hover();
    await expect(page.getByRole('tooltip')).toContainText('Rate limited by the provider');
  });

  test('a done cell whose inputs changed since it ran is stale', async ({ page }) => {
    // r6 ran with other inputs (its inputHash is of old.com); r1's hash matches its domain.
    await expect(state(page, 'r6', 'email')).toHaveAttribute('data-lf-enrich-stale', '');
    await expect(cell(page, 'r6', 'email').locator('[data-lf-enrich-rerun]')).toBeVisible();
    await expect(state(page, 'r1', 'email')).not.toHaveAttribute('data-lf-enrich-stale', '');
    await expect(state(page, 'r5', 'email')).not.toHaveAttribute('data-lf-enrich-stale', '');
    // Changing r1's domain makes its email stale, and only that cell.
    await button(page, 'enrich_change_domain').click();
    await expect(cell(page, 'r1', 'domain')).toHaveText('acme.io');
    await expect(state(page, 'r1', 'email')).toHaveAttribute('data-lf-enrich-stale', '');
    await expect(state(page, 'r1', 'summary')).not.toHaveAttribute('data-lf-enrich-stale', '');
  });

  test('the rerun button of a stale cell fires onCellRun', async ({ page }) => {
    await cell(page, 'r6', 'email').locator('[data-lf-enrich-rerun]').click();
    await expectEvent(page, 'onCellRun', {
      rowKey: 'r6',
      company: 'Stark',
      column: {
        key: 'email',
        kind: 'enrichment',
        type: 'email',
        provider: 'findEmail',
        inputs: { domain: { column: 'domain' } },
        output: 'email',
        width: 190,
      },
    });
    await expect(details(page)).toHaveCount(0);
  });

  test('formula and extract columns compute in the browser', async ({ page }) => {
    await expect(cell(page, 'r1', 'label')).toHaveText('Acme (acme.com)');
    await expect(cell(page, 'r1', 'linkedin')).toHaveText('in/ada');
    await expect(cell(page, 'r2', 'linkedin')).toHaveText('');
    await button(page, 'enrich_change_domain').click();
    await expect(cell(page, 'r1', 'label')).toHaveText('Acme (acme.io)');
  });

  // ============================================
  // HEADER PROGRESS AND PUSH UPDATES
  // ============================================

  test('enrichment headers count running, queued and failed cells', async ({ page }) => {
    await expect(chip(page, 'email')).toHaveText('2 running · 1 queued · 1 error');
    await expect(chip(page, 'summary')).toHaveText('1 running');
    await expect(chip(page, 'company')).toHaveCount(0);
    await button(page, 'enrich_push_running').click();
    await expect(chip(page, 'email')).toHaveText('4 running · 1 queued · 1 error');
  });

  test('a deep applyTransaction update merges a partial _enrich push into the row', async ({
    page,
  }) => {
    await expect(state(page, 'r2', 'summary')).toHaveAttribute('data-lf-enrich-status', 'running');
    await button(page, 'enrich_push_ok').click();
    await expect(cell(page, 'r2', 'email')).toHaveText('hank@globex.com');
    await expect(state(page, 'r2', 'email')).not.toHaveAttribute('data-lf-enrich-stale', '');
    // The row's other fields and the summary column's state survive the push.
    await expect(cell(page, 'r2', 'company')).toHaveText('Globex');
    await expect(state(page, 'r2', 'summary')).toHaveAttribute('data-lf-enrich-status', 'running');
    await expect(chip(page, 'email')).toHaveText('2 running · 1 error');
  });

  // ============================================
  // ADD COLUMN PICKER
  // ============================================

  test('the add-column picker adds an input column', async ({ page }) => {
    await openPicker(page);
    await expect(picker(page).locator('[data-lf-picker-kind]')).toHaveText([
      /^Input/,
      /^Formula/,
      /^Find email/,
      /^Company info/,
      /^AI/,
      /^Extract/,
    ]);
    await picker(page).getByLabel('Title').fill('Notes');
    await search(page, picker(page).locator('[data-lf-picker-field="type"] .ant-select'), 'number');
    expect(await previewConfig(page)).toEqual({
      key: 'notes',
      title: 'Notes',
      type: 'number',
      kind: 'input',
      userDefined: true,
      editable: true,
    });
    await page.locator('[data-lf-picker-submit]').click();
    await expect(picker(page)).toHaveCount(0);
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'notes',
        title: 'Notes',
        type: 'number',
        kind: 'input',
        userDefined: true,
        editable: true,
      },
      position: null,
    });
  });

  test('the add-column picker builds a formula from column chips', async ({ page }) => {
    await openPicker(page);
    await picker(page).locator('[data-lf-picker-kind="formula"]').click();
    await picker(page).getByLabel('Title').fill('Pitch line');
    const template = picker(page).locator('[data-lf-picker-template="template"] textarea');
    await template.fill('Hello ');
    await picker(page)
      .locator('[data-lf-picker-template="template"] [data-lf-picker-chip="company"]')
      .click();
    await expect(template).toHaveValue('Hello {{ company }}');
    await page.locator('[data-lf-picker-submit]').click();
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'pitch_line',
        title: 'Pitch line',
        type: 'text',
        kind: 'formula',
        userDefined: true,
        template: 'Hello {{ company }}',
      },
      position: null,
    });
  });

  test('the add-column picker maps a provider inputs to columns and literals', async ({ page }) => {
    await openPicker(page);
    await picker(page).locator('[data-lf-picker-kind="provider:findEmail"]').click();
    // The provider fills the title and its first output (and that output's type).
    await expect(picker(page).getByLabel('Title')).toHaveValue('Find email');
    await expect(page.locator('[data-lf-picker-submit]')).toBeDisabled();
    await expect(page.locator('[data-lf-picker-problem]')).toHaveText(
      'Map the required inputs: Domain.'
    );
    await pick(page, picker(page).locator('[data-lf-picker-input="domain"] .ant-select'), 'Domain');
    await pick(
      page,
      picker(page).locator('[data-lf-picker-input="name"] .ant-select'),
      'Literal value…'
    );
    await picker(page).locator('input[data-lf-picker-literal="name"]').fill('Ada');
    await pick(
      page,
      picker(page).locator('[data-lf-picker-field="output"] .ant-select'),
      'Confidence'
    );
    await picker(page).getByLabel('Run automatically').click();
    await page.locator('[data-lf-picker-submit]').click();
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'find_email',
        title: 'Find email',
        type: 'number',
        kind: 'enrichment',
        userDefined: true,
        provider: 'findEmail',
        inputs: { domain: { column: 'domain' }, name: { value: 'Ada' } },
        output: 'confidence',
        autoRun: true,
      },
      position: null,
    });
  });

  test('the add-column picker writes an AI prompt with column chips as its inputs', async ({
    page,
  }) => {
    await openPicker(page);
    await picker(page).locator('[data-lf-picker-kind="ai"]').click();
    await picker(page).getByLabel('Title').fill('Segment');
    const prompt = picker(page).locator('[data-lf-picker-template="prompt"] textarea');
    await prompt.fill('Which segment is ');
    await picker(page)
      .locator('[data-lf-picker-template="prompt"] [data-lf-picker-chip="company"]')
      .click();
    await prompt.press('End');
    await prompt.pressSequentially(' at ');
    await picker(page)
      .locator('[data-lf-picker-template="prompt"] [data-lf-picker-chip="domain"]')
      .click();
    await expect(prompt).toHaveValue('Which segment is {{ company }} at {{ domain }}');
    await expect(picker(page).locator('[data-lf-picker-prompt-note]')).toContainText(
      'Changing the prompt does not make cells stale'
    );
    await search(page, picker(page).locator('[data-lf-picker-field="type"] .ant-select'), 'tag');
    const options = picker(page).locator('[data-lf-picker-field="outputOptions"] input');
    await options.fill('smb');
    await options.press('Enter');
    await options.fill('enterprise');
    await options.press('Enter');
    expect((await previewConfig(page)).inputs).toEqual({
      company: { column: 'company' },
      domain: { column: 'domain' },
    });
    // Removing a reference from the prompt removes its input.
    await prompt.fill('Which segment is {{ company }}?');
    await page.locator('[data-lf-picker-submit]').click();
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'segment',
        title: 'Segment',
        type: 'tag',
        kind: 'ai',
        userDefined: true,
        prompt: 'Which segment is {{ company }}?',
        inputs: { company: { column: 'company' } },
        output: { type: 'tag', options: ['smb', 'enterprise'] },
        autoRun: false,
      },
      position: null,
    });
  });

  test('the add-column picker adds an extract column', async ({ page }) => {
    await openPicker(page);
    await picker(page).locator('[data-lf-picker-kind="extract"]').click();
    await picker(page).getByLabel('Title').fill('Confidence');
    await pick(page, picker(page).locator('[data-lf-picker-field="source"] .ant-select'), 'Email');
    await picker(page).getByLabel('Path').fill('confidence');
    await page.locator('[data-lf-picker-submit]').click();
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'confidence',
        title: 'Confidence',
        type: 'text',
        kind: 'extract',
        userDefined: true,
        source: 'email',
        path: 'confidence',
      },
      position: null,
    });
  });

  test('the picker stays open, pending, while onColumnAdd runs and shows its error', async ({
    page,
  }) => {
    await openPicker(page, 'enrich_fail');
    await expect(picker(page).locator('[data-lf-picker-kind]')).toHaveText([/^Input/, /^Formula/]);
    await picker(page).getByLabel('Title').fill('Phone');
    await page.locator('[data-lf-picker-submit]').click();
    await expect(page.locator('[data-lf-picker-submit]')).toHaveClass(/ant-btn-loading/);
    await expect(picker(page).locator('[data-lf-picker-error]')).toContainText(
      'Column limit reached'
    );
    await expect(page.locator('[data-lf-picker-submit]')).not.toHaveClass(/ant-btn-loading/);
    await expect(picker(page)).toBeVisible();
  });

  // ============================================
  // COLUMN MANAGEMENT
  // ============================================

  test('a declared enrichment column menu has Run only, a user column the management items', async ({
    page,
  }) => {
    const emailMenu = await openMenu(page, 'email');
    await expect(emailMenu.getByRole('menuitem', { name: 'Run', exact: true })).toBeVisible();
    await expect(emailMenu.getByRole('menuitem', { name: 'Rename', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    const summaryMenu = await openMenu(page, 'summary');
    for (const name of [
      'Run',
      'Rename',
      'Edit column',
      'Duplicate',
      'Insert left',
      'Insert right',
      'Delete column',
    ]) {
      await expect(summaryMenu.getByRole('menuitem', { name, exact: true })).toBeVisible();
    }
  });

  test('Run in the header menu fires onColumnRun with the mode and the view', async ({ page }) => {
    const menu = await openMenu(page, 'email');
    await menu.getByRole('menuitem', { name: 'Run', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Errors', exact: true }).click();
    await expectEvent(page, 'onColumnRun', {
      column: {
        key: 'email',
        kind: 'enrichment',
        type: 'email',
        provider: 'findEmail',
        inputs: { domain: { column: 'domain' } },
        output: 'email',
        width: 190,
      },
      mode: 'errors',
      selection: { all: true, except: [], filter: null, search: null },
    });
  });

  test('Run on a selection runs the selected rows', async ({ page }) => {
    await selectRow(page, 'r2');
    await selectRow(page, 'r3');
    const menu = await openMenu(page, 'summary');
    await menu.getByRole('menuitem', { name: 'Run', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Stale cells', exact: true }).click();
    await expect
      .poll(async () => (await eventOf(page, 'onColumnRun'))?.selection)
      .toEqual(['r2', 'r3']);
    expect((await eventOf(page, 'onColumnRun')).mode).toBe('stale');
  });

  test('Rename edits the title inline and fires onColumnUpdate', async ({ page }) => {
    await menuItem(page, 'summary', 'Rename');
    const input = header(page, 'summary').locator('[data-lf-enrich-rename]');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Summary');
    await input.fill('One liner');
    await input.press('Enter');
    await expect(input).toHaveCount(0);
    await expectEvent(page, 'onColumnUpdate', {
      column: {
        key: 'summary',
        kind: 'ai',
        prompt: 'Summarise {{ company }} in one line.',
        inputs: { company: { column: 'company' } },
        userDefined: true,
        width: 170,
        title: 'One liner',
      },
      previous: {
        key: 'summary',
        kind: 'ai',
        prompt: 'Summarise {{ company }} in one line.',
        inputs: { company: { column: 'company' } },
        userDefined: true,
        width: 170,
      },
    });
  });

  test('a failed rename keeps the input open with the error', async ({ page }) => {
    await menuItem(page, 'email', 'Rename', 'enrich_fail');
    const input = header(page, 'email', 'enrich_fail').locator('[data-lf-enrich-rename]');
    await input.fill('Work email');
    await input.press('Enter');
    await expect(input).toHaveAttribute('data-saving', '');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('title', 'Title is taken');
    await input.press('Escape');
    await expect(input).toHaveCount(0);
  });

  test('Edit reopens the picker prefilled and fires onColumnUpdate', async ({ page }) => {
    await menuItem(page, 'label', 'Edit column');
    await expect(picker(page)).toHaveAttribute('data-lf-column-picker', 'edit');
    await expect(picker(page).getByLabel('Title')).toHaveValue('Label');
    const template = picker(page).locator('[data-lf-picker-template="template"] textarea');
    await expect(template).toHaveValue('{{ company }} ({{ domain }})');
    await template.fill('{{ company }}!');
    await page.locator('[data-lf-picker-submit]').click();
    await expectEvent(page, 'onColumnUpdate', {
      column: {
        key: 'label',
        title: 'Label',
        type: 'text',
        kind: 'formula',
        userDefined: true,
        template: '{{ company }}!',
      },
      previous: {
        key: 'label',
        kind: 'formula',
        template: '{{ company }} ({{ domain }})',
        userDefined: true,
        width: 190,
      },
    });
  });

  test('Duplicate adds a copy after the column', async ({ page }) => {
    await menuItem(page, 'linkedin', 'Duplicate');
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'linkedin_copy',
        kind: 'extract',
        source: 'email',
        path: 'profile.linkedin',
        userDefined: true,
        width: 150,
        title: 'Linkedin (copy)',
      },
      position: { after: 'linkedin' },
    });
  });

  test('Insert left and right open the picker with a position', async ({ page }) => {
    await menuItem(page, 'summary', 'Insert left');
    await picker(page).getByLabel('Title').fill('Before');
    await page.locator('[data-lf-picker-submit]').click();
    await expect
      .poll(async () => (await eventOf(page, 'onColumnAdd'))?.position)
      .toEqual({
        before: 'summary',
      });
    await menuItem(page, 'summary', 'Insert right');
    await picker(page).getByLabel('Title').fill('After');
    await page.locator('[data-lf-picker-submit]').click();
    await expect
      .poll(async () => (await eventOf(page, 'onColumnAdd'))?.position)
      .toEqual({
        after: 'summary',
      });
    expect((await eventOf(page, 'onColumnAdd')).column.key).toBe('after');
  });

  test('Delete asks first, then fires onColumnDelete', async ({ page }) => {
    await menuItem(page, 'label', 'Delete column');
    const dialog = page.locator('.ant-modal:has([data-lf-delete-column="label"])');
    await expect(dialog).toContainText('Delete the column “Label”?');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toHaveCount(0);
    await expectEvent(page, 'onColumnDelete', {
      column: {
        key: 'label',
        kind: 'formula',
        template: '{{ company }} ({{ domain }})',
        userDefined: true,
        width: 190,
      },
    });
  });

  test('a failed delete shows the error in the confirmation', async ({ page }) => {
    await menuItem(page, 'email', 'Delete column', 'enrich_fail');
    const dialog = page.locator('.ant-modal:has([data-lf-delete-column="email"])');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog.locator('[data-lf-delete-error]')).toContainText('Column is in use');
    await expect(dialog).toBeVisible();
  });

  test('a failed run shows its error under the table', async ({ page }) => {
    const menu = await openMenu(page, 'email', 'enrich_fail');
    await menu.getByRole('menuitem', { name: 'Run', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'All rows', exact: true }).click();
    await expect(getBlock(page, 'enrich_fail').locator('[data-lf-enrich-notice]')).toContainText(
      'Out of credits'
    );
  });

  // ============================================
  // ROW AND SELECTION RUNS
  // ============================================

  test('a row run button fires onRowRun with the run columns', async ({ page }) => {
    const run = getBlock(page, 'enrich').locator(
      '.lf-table-body [data-row-key="r4"] [data-lf-enrich-run-row]'
    );
    await cell(page, 'r4', 'company').hover();
    await run.click();
    await expectEvent(page, 'onRowRun', {
      rowKey: 'r4',
      company: 'Umbrella',
      columns: ['email', 'summary'],
    });
  });

  test('Run selected in the bulk bar runs a column on the selection', async ({ page }) => {
    await selectRow(page, 'r1');
    await page.locator('[data-lf-bulk-action="run"]').click();
    await page.locator('.ant-dropdown:visible').getByRole('menuitem', { name: 'Summary' }).click();
    await expect.poll(async () => (await eventOf(page, 'onColumnRun'))?.selection).toEqual(['r1']);
    const event = await eventOf(page, 'onColumnRun');
    expect(event.mode).toBe('all');
    expect(event.column.key).toBe('summary');
  });

  // ============================================
  // CELL DETAILS PANEL
  // ============================================

  test('clicking an enrichment cell opens its details panel', async ({ page }) => {
    await clickCell(page, 'r1', 'email');
    await expect(details(page)).toHaveAttribute('data-lf-cell-details', 'email');
    await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Done');
    await expect(details(page).locator('[data-lf-details-value]')).toHaveText('ada@acme.com');
    await expect(details(page).locator('[data-lf-details-timing="queued"]')).toHaveText(
      /^2026-09-01 \d\d:00:00$/
    );
    await expect(details(page).locator('[data-lf-details-timing="attempts"]')).toHaveText('1');
    await expect(details(page).locator('[data-lf-details-input="domain"]')).toHaveText(
      '"acme.com"'
    );
    await expect(details(page).locator('[data-lf-json-node="email"]')).toContainText(
      '"ada@acme.com"'
    );
    // Objects expand on demand.
    await expect(details(page).locator('[data-lf-json-node="profile.name"]')).toHaveCount(0);
    await details(page).locator('[data-lf-json-toggle="profile"]').click();
    await expect(details(page).locator('[data-lf-json-node="profile.name"]')).toContainText(
      '"Ada Lovelace"'
    );
  });

  test('Space on an enrichment cell opens the panel, which shows the error', async ({ page }) => {
    await cell(page, 'r4', 'domain').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(' ');
    await expect(details(page)).toHaveAttribute('data-row-id', 'r4');
    await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Error');
    await expect(details(page).locator('[data-lf-details-error]')).toHaveText(
      'Rate limited by the provider'
    );
    await details(page).locator('[data-lf-details-rerun]').click();
    await expect.poll(async () => (await eventOf(page, 'onCellRun'))?.rowKey).toBe('r4');
  });

  test('the details panel follows push updates to its row', async ({ page }) => {
    await clickCell(page, 'r2', 'email');
    await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Queued');
    await button(page, 'enrich_push_ok').click();
    await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Done');
    await expect(details(page).locator('[data-lf-details-value]')).toHaveText('hank@globex.com');
  });

  test('an extract cell opens its source column run', async ({ page }) => {
    await cell(page, 'r1', 'linkedin').click();
    await expect(details(page)).toHaveAttribute('data-lf-cell-details', 'linkedin');
    await expect(details(page).locator('[data-lf-details-extract]')).toHaveText(
      'Extracts "profile.linkedin" from Email.'
    );
    await expect(details(page).locator('[data-lf-details-value]')).toHaveText('in/ada');
  });

  test('"Add as column" on a raw result node fires onColumnAdd with an extract column', async ({
    page,
  }) => {
    await clickCell(page, 'r1', 'email');
    await details(page).locator('[data-lf-json-toggle="profile"]').click();
    await details(page).locator('[data-lf-json-node="profile.name"] > div').first().hover();
    await details(page).locator('[data-lf-json-add="profile.name"]').click();
    await expectEvent(page, 'onColumnAdd', {
      column: {
        key: 'email_profile_name',
        title: 'Profile name',
        type: 'text',
        kind: 'extract',
        source: 'email',
        path: 'profile.name',
        userDefined: true,
      },
      position: { after: 'email' },
    });
    await details(page).locator('[data-lf-json-toggle="sources"]').click();
    await details(page).locator('[data-lf-json-node="sources"] > div').first().hover();
    await details(page).locator('[data-lf-json-add="sources"]').click();
    await expect
      .poll(async () => (await eventOf(page, 'onColumnAdd'))?.column)
      .toEqual({
        key: 'email_sources',
        title: 'Sources',
        type: 'tags',
        kind: 'extract',
        source: 'email',
        path: 'sources',
        userDefined: true,
      });
    await details(page).locator('[data-lf-json-node="confidence"] > div').first().hover();
    await details(page).locator('[data-lf-json-add="confidence"]').click();
    await expect.poll(async () => (await eventOf(page, 'onColumnAdd'))?.column.type).toBe('number');
  });

  // ============================================
  // NEW ROWS
  // ============================================

  test('"+ New row" adds a row through onRowAdd, saving until it settles', async ({ page }) => {
    await getBlock(page, 'enrich').locator('[data-lf-new-row]').click();
    const editor = getBlock(page, 'enrich').locator('[data-lf-new-row-editor]');
    await expect(editor.locator('[data-lf-new-row-field]')).toHaveText(['Company', 'Domain']);
    await expect(editor.locator('[data-lf-new-row-field="company"] input')).toBeFocused();
    await editor.locator('[data-lf-new-row-field="company"] input').fill('Tyrell');
    await editor.locator('[data-lf-new-row-field="domain"] input').fill('tyrell.com');
    await page.keyboard.press('Enter');
    const saving = getBlock(page, 'enrich').locator('.lf-table-body [data-saving]');
    await expect(saving).toHaveCount(1);
    await expect(saving.locator('[data-col-key="company"]')).toHaveText('Tyrell');
    await expect(editor.locator('[data-lf-new-row-saving]')).toBeVisible();
    await expectEvent(page, 'onRowAdd', { values: { company: 'Tyrell', domain: 'tyrell.com' } });
    await expect(saving).toHaveCount(0);
    await expect(cell(page, 'saved', 'company')).toHaveText('Tyrell');
    // The editor stays open, cleared, for the next row.
    await expect(editor.locator('[data-lf-new-row-field="company"] input')).toHaveValue('');
  });

  test('a failed new row goes, and the editor keeps its values with the error', async ({
    page,
  }) => {
    await getBlock(page, 'enrich_fail').locator('[data-lf-new-row]').click();
    await expect(getBlock(page, 'enrich_fail').locator('[data-lf-new-row]')).toHaveCount(0);
    const editor = getBlock(page, 'enrich_fail').locator('[data-lf-new-row-editor]');
    await editor.locator('[data-lf-new-row-field="company"] input').fill('Acme');
    await editor.locator('[data-lf-new-row-submit]').click();
    await expect(getBlock(page, 'enrich_fail').locator('.lf-table-body [data-saving]')).toHaveCount(
      1
    );
    await expect(editor.locator('[data-lf-new-row-error]')).toHaveText('Duplicate company');
    await expect(getBlock(page, 'enrich_fail').locator('.lf-table-body [data-saving]')).toHaveCount(
      0
    );
    await expect(editor.locator('[data-lf-new-row-field="company"] input')).toHaveValue('Acme');
    await expect(getBlock(page, 'enrich_fail').locator('.lf-table-body [role="row"]')).toHaveCount(
      1
    );
    await page.keyboard.press('Escape');
    await expect(getBlock(page, 'enrich_fail').locator('[data-lf-new-row]')).toHaveText(
      '+Add a company'
    );
  });

  // ============================================
  // CSV IMPORT
  // ============================================

  test('CSV import maps headers and sends the rows in batches of 500', async ({ page }) => {
    const lines = ['Company,DOMAIN,Industry'];
    for (let i = 1; i <= 1200; i++) lines.push(`"Co ${i}, Inc",co${i}.com,Tools`);
    await getBlock(page, 'enrich').locator('[data-lf-toolbar-button="import"]').click();
    const dialog = page.locator('[data-lf-import-dialog]');
    await dialog.locator('[data-lf-import-file]').setInputFiles({
      name: 'companies.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(`﻿${lines.join('\r\n')}\r\n`),
    });
    await expect(dialog).toContainText('1,200 rows in companies.csv');
    await expect(dialog.locator('[data-lf-import-header="Company"] .ant-select')).toHaveText(
      'Company'
    );
    await expect(dialog.locator('[data-lf-import-header="DOMAIN"] .ant-select')).toHaveText(
      'Domain'
    );
    await expect(dialog.locator('[data-lf-import-header="Industry"] .ant-select')).toHaveText(
      'New text column'
    );
    await page.locator('[data-lf-import-submit]').click();
    await expect(dialog.locator('[data-lf-import-done]')).toContainText('Imported 1,200 rows.');
    await expect(dialog.locator('[data-lf-import-progress]')).toHaveAttribute(
      'data-lf-import-progress',
      '1200/1200'
    );
    const newColumns = [
      {
        key: 'industry',
        title: 'Industry',
        type: 'text',
        kind: 'input',
        editable: true,
        userDefined: true,
      },
    ];
    await expectEvent(page, 'onImport', [
      {
        batchIndex: 0,
        batchCount: 3,
        total: 1200,
        count: 500,
        first: { company: 'Co 1, Inc', domain: 'co1.com', industry: 'Tools' },
        newColumns,
      },
      {
        batchIndex: 1,
        batchCount: 3,
        total: 1200,
        count: 500,
        first: { company: 'Co 501, Inc', domain: 'co501.com', industry: 'Tools' },
        newColumns: [],
      },
      {
        batchIndex: 2,
        batchCount: 3,
        total: 1200,
        count: 200,
        first: { company: 'Co 1001, Inc', domain: 'co1001.com', industry: 'Tools' },
        newColumns: [],
      },
    ]);
  });

  test('CSV import can remap a header and stops at a failed batch', async ({ page }) => {
    const lines = ['name,notes'];
    for (let i = 1; i <= 700; i++) lines.push(`Co ${i},n`);
    await getBlock(page, 'enrich_fail').locator('[data-lf-toolbar-button="import"]').click();
    const dialog = page.locator('[data-lf-import-dialog]');
    await dialog.locator('[data-lf-import-file]').setInputFiles({
      name: 'rows.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(lines.join('\n')),
    });
    await expect(dialog.locator('[data-lf-import-header="name"] .ant-select')).toHaveText(
      'New text column'
    );
    await pick(page, dialog.locator('[data-lf-import-header="name"] .ant-select'), 'Company');
    await pick(page, dialog.locator('[data-lf-import-header="notes"] .ant-select'), 'Skip');
    await page.locator('[data-lf-import-submit]').click();
    await expect(dialog.locator('[data-lf-import-error]')).toContainText('Batch rejected');
    await expect(dialog.locator('[data-lf-import-progress]')).toHaveAttribute(
      'data-lf-import-progress',
      '500/700'
    );
  });
});
