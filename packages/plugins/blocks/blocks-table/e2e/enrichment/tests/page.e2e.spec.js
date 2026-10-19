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
import { getBlock } from '@lowdefy/block-dev-e2e';

import { byName, cellOf, mock, readLeads, reset, settle } from './helpers.js';

// The enrichment page against the whole stack: the Table's enrichment UI, the endpoints, the
// worker, the change stream websocket, MongoDB and the mock services. Cells change only
// through what the server pushes, so every state asserted here came over the websocket.
test.describe.configure({ mode: 'serial' });

const table = (page) => getBlock(page, 'leads_table');
const row = (page, name) =>
  table(page)
    .locator('.lf-table-body [data-row-key]')
    .filter({ has: page.locator('[data-col-key="name"]', { hasText: new RegExp(`^${name}$`) }) });
const cell = (page, name, key) => row(page, name).locator(`[data-lf-cell][data-col-key="${key}"]`);
const status = (page, name, key) => cell(page, name, key).locator('[data-lf-enrich-status]');
const header = (page, key) => table(page).locator(`[data-lf-header][data-col-key="${key}"]`);
const picker = (page) => page.locator('[data-lf-column-picker]');
const details = (page) => page.locator('[data-lf-cell-details]');
const dropdown = (page) => page.locator('.ant-select-dropdown:visible').last();

async function open(page) {
  await page.goto('/enrichment');
  await expect(cell(page, 'Ada Brightwell', 'domain')).toHaveText('brightpath.test');
  // Cell pushes need the subscription: wait until it is live.
  await expect(getBlock(page, 'live_status')).toHaveText('Live');
}

async function openMenu(page, key) {
  await header(page, key).hover();
  await header(page, key).locator('[data-lf-header-menu]').click();
  const menu = page.locator(`[data-lf-header-menu-popup][data-col-key="${key}"]`);
  await expect(menu).toBeVisible();
  return menu;
}

async function runColumn(page, key, mode = 'All rows') {
  const menu = await openMenu(page, key);
  const item = page.getByRole('menuitem', { name: mode, exact: true });
  // The submenu opens on hover; hover again if the first one landed while the menu animated.
  await expect(async () => {
    await menu.getByRole('menuitem', { name: 'Run', exact: true }).hover();
    await expect(item).toBeVisible({ timeout: 1000 });
  }).toPass();
  await item.click();
}

async function selectRow(page, name) {
  await row(page, name).locator('[data-lf-select-cell] input').click();
}

async function pick(page, select, title) {
  await select.click();
  await dropdown(page).getByTitle(title, { exact: true }).click();
}

async function search(page, select, text) {
  await select.click();
  await page.keyboard.type(text);
  await dropdown(page).getByTitle(text, { exact: true }).click();
}

// Enrichment cells may hold links (email); a click beside the value opens the details panel.
async function openDetails(page, name, key) {
  await cell(page, name, key).click({ position: { x: 150, y: 10 } });
  await expect(details(page)).toHaveAttribute('data-lf-cell-details', key);
}

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('a column run shows its cells go queued, running and done, live', async ({
  page,
  request,
}) => {
  await mock.latency(request, { company: 1500 });
  await open(page);
  await expect(status(page, 'Ada Brightwell', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'none'
  );
  await selectRow(page, 'Ada Brightwell');
  await selectRow(page, 'Ben Quill');
  await runColumn(page, 'company');
  await expect(status(page, 'Ada Brightwell', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    /queued|running/
  );
  await expect(status(page, 'Ada Brightwell', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'running'
  );
  await expect(header(page, 'company').locator('[data-lf-enrich-progress]')).toHaveAttribute(
    'aria-label',
    /running/
  );
  await expect(status(page, 'Ada Brightwell', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'ok',
    { timeout: 10000 }
  );
  await expect(cell(page, 'Ada Brightwell', 'company')).toHaveText('Logistics');
  await expect(cell(page, 'Ben Quill', 'company')).toHaveText('Software');
  // The extract column reads the raw result, and the pitch followed through autoRun.
  await expect(cell(page, 'Ada Brightwell', 'employees')).toHaveText('420');
  await expect(status(page, 'Ada Brightwell', 'pitch')).toHaveAttribute(
    'data-lf-enrich-status',
    'ok'
  );
  await expect(cell(page, 'Ada Brightwell', 'pitch')).toContainText(
    'Head of Operations at a Logistics company'
  );
  // Rows outside the selection did not run.
  await expect(status(page, 'Cara Tidewell', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'none'
  );
});

test('a failing cell is retried, then shows its error on hover', async ({ page, request }) => {
  await open(page);
  await selectRow(page, 'Gina Brooks');
  await runColumn(page, 'company');
  await expect(status(page, 'Gina Brooks', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    /queued|running/
  );
  // The retries wait out their backoff; cron ticks run them.
  await settle(request);
  await expect(status(page, 'Gina Brooks', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'error'
  );
  const marker = cell(page, 'Gina Brooks', 'company').locator('[data-lf-enrich-error]');
  await expect(marker).toHaveAttribute('data-lf-enrich-error', 'Provider error (500)');
  await cell(page, 'Gina Brooks', 'company').hover();
  await marker.hover();
  await expect(page.locator('[data-lf-enrich-error-tooltip]')).toHaveText(
    'Failed after 3 attemptsProvider error (500)'
  );
  expect(await mock.log(request, 'company')).toHaveLength(3);
});

test('Rerun in the details panel runs the cell again', async ({ page, request }) => {
  await open(page);
  await selectRow(page, 'Hal Stone');
  await runColumn(page, 'company');
  await expect(status(page, 'Hal Stone', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'error'
  );
  await openDetails(page, 'Hal Stone', 'company');
  await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Error');
  await expect(details(page).locator('[data-lf-details-error]')).toContainText('400');
  await expect(details(page).locator('[data-lf-details-input="domain"]')).toHaveText(
    '"badrequest.test"'
  );
  await details(page).locator('[data-lf-details-rerun]').click();
  await expect.poll(async () => (await mock.log(request, 'company')).length).toBe(2);
  await expect(details(page).locator('[data-lf-details-status]')).toHaveText('Error');
});

test('an edited input makes its cells stale, and refresh reruns them', async ({
  page,
  request,
}) => {
  await open(page);
  await selectRow(page, 'Ben Quill');
  await runColumn(page, 'company');
  await expect(cell(page, 'Ben Quill', 'company')).toHaveText('Software');
  await expect(status(page, 'Ben Quill', 'company')).not.toHaveAttribute(
    'data-lf-enrich-stale',
    ''
  );

  await cell(page, 'Ben Quill', 'domain').dblclick();
  await table(page).locator('[data-lf-editor] input').first().fill('tidewater.test');
  await page.keyboard.press('Enter');
  await expect(cell(page, 'Ben Quill', 'domain')).toHaveText('tidewater.test');
  await expect(status(page, 'Ben Quill', 'company')).toHaveAttribute('data-lf-enrich-stale', '');
  const leads = await readLeads(request);
  expect(byName(leads, 'Ben Quill').domain).toBe('tidewater.test');

  await cell(page, 'Ben Quill', 'company').hover();
  await cell(page, 'Ben Quill', 'company').locator('[data-lf-enrich-rerun]').click();
  await expect(cell(page, 'Ben Quill', 'company')).toHaveText('Retail');
  await expect(status(page, 'Ben Quill', 'company')).not.toHaveAttribute(
    'data-lf-enrich-stale',
    ''
  );
});

test('a rerun that finds no result clears the old value and raw from the row', async ({
  page,
  request,
}) => {
  await open(page);
  await selectRow(page, 'Ben Quill');
  await runColumn(page, 'company');
  await expect(cell(page, 'Ben Quill', 'company')).toHaveText('Software');
  await expect(cell(page, 'Ben Quill', 'employees')).toHaveText(/^1,?200$/);

  // nowhere.test has no company: the rerun is empty, and the server unsets value and raw.
  await cell(page, 'Ben Quill', 'domain').dblclick();
  await table(page).locator('[data-lf-editor] input').first().fill('nowhere.test');
  await page.keyboard.press('Enter');
  await expect(status(page, 'Ben Quill', 'company')).toHaveAttribute('data-lf-enrich-stale', '');
  await cell(page, 'Ben Quill', 'company').hover();
  await cell(page, 'Ben Quill', 'company').locator('[data-lf-enrich-rerun]').click();
  await expect(status(page, 'Ben Quill', 'company')).toHaveAttribute(
    'data-lf-enrich-status',
    'empty'
  );
  const leads = await readLeads(request);
  expect(cellOf(byName(leads, 'Ben Quill'), 'company').value).toBeUndefined();
  // The pushed row replaced the cell: no old raw for the extract column, no stale marker.
  await expect(cell(page, 'Ben Quill', 'employees')).not.toHaveText(/1,?200/);
  await expect(status(page, 'Ben Quill', 'company')).not.toHaveAttribute(
    'data-lf-enrich-stale',
    ''
  );
  await openDetails(page, 'Ben Quill', 'company');
  await expect(details(page).locator('[data-lf-details-status]')).toHaveText('No result');
  await expect(details(page)).not.toContainText('Software');
});

test('"Add as column" in the details panel adds an extract column', async ({ page }) => {
  await open(page);
  await selectRow(page, 'Ada Brightwell');
  await runColumn(page, 'company');
  await expect(cell(page, 'Ada Brightwell', 'company')).toHaveText('Logistics');
  await openDetails(page, 'Ada Brightwell', 'company');
  await expect(details(page).locator('[data-lf-json-node="country"]')).toContainText('"NL"');
  await details(page).locator('[data-lf-json-node="country"] > div').first().hover();
  await details(page).locator('[data-lf-json-add="country"]').click();
  await expect(header(page, 'company_country')).toContainText('Country');
  await expect(cell(page, 'Ada Brightwell', 'company_country')).toHaveText('NL');
  // Placed after its source column.
  const keys = await table(page)
    .locator('[data-lf-header][data-col-key]')
    .evaluateAll((headers) => headers.map((item) => item.getAttribute('data-col-key')));
  expect(keys.indexOf('company_country')).toBe(keys.indexOf('company') + 1);
});

test('the picker adds an enrichment column that runs, and Delete removes it', async ({ page }) => {
  await open(page);
  await table(page).locator('[data-lf-enrich-add-column]').click();
  await expect(picker(page)).toBeVisible();
  await picker(page).locator('[data-lf-picker-kind="provider:company_lookup"]').click();
  await pick(
    page,
    picker(page).locator('[data-lf-picker-input="domain"] .ant-select'),
    'Company domain'
  );
  await pick(page, picker(page).locator('[data-lf-picker-field="output"] .ant-select'), 'Country');
  await picker(page).getByLabel('Title').fill('Country');
  await page.locator('[data-lf-picker-submit]').click();
  await expect(picker(page)).toHaveCount(0);
  await expect(header(page, 'country')).toContainText('Country');

  await selectRow(page, 'Dan Fernsby');
  await runColumn(page, 'country');
  await expect(cell(page, 'Dan Fernsby', 'country')).toHaveText('DE');

  const menu = await openMenu(page, 'country');
  await menu.getByRole('menuitem', { name: 'Delete column', exact: true }).click();
  const dialog = page.locator('.ant-modal:has([data-lf-delete-column="country"])');
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(header(page, 'country')).toHaveCount(0);
});

test('the picker refuses template tags, and shows why the server refused a column', async ({
  page,
}) => {
  await open(page);
  await table(page).locator('[data-lf-enrich-add-column]').click();
  await picker(page).locator('[data-lf-picker-kind="ai"]').click();
  await picker(page).getByLabel('Title').fill('Unsafe');
  // A template tag in a prompt: prompts are filled by substitution and never rendered as
  // templates, so the picker refuses it before the server does.
  const prompt = picker(page).locator('[data-lf-picker-template="prompt"] textarea');
  await prompt.fill('Describe {% for x in range(9) %}{{ x }}{% endfor %}');
  await expect(page.locator('[data-lf-picker-problem]')).toContainText('template tags ({% %})');
  await expect(page.locator('[data-lf-picker-submit]')).toBeDisabled();
  // A title the server takes as too long: the picker shows the server's reason.
  await prompt.fill('Describe the company.');
  await picker(page).getByLabel('Title').fill('U'.repeat(201));
  await page.locator('[data-lf-picker-submit]').click();
  await expect(picker(page).locator('[data-lf-picker-error]')).toContainText(
    'The column title should be text of at most 200 characters.'
  );
  await expect(picker(page)).toBeVisible();
});

test('an AI column from the picker answers with one of its options', async ({ page }) => {
  await open(page);
  await selectRow(page, 'Ada Brightwell');
  await selectRow(page, 'Ben Quill');
  await runColumn(page, 'company');
  await expect(cell(page, 'Ben Quill', 'company')).toHaveText('Software');

  await table(page).locator('[data-lf-enrich-add-column]').click();
  await picker(page).locator('[data-lf-picker-kind="ai"]').click();
  await picker(page).getByLabel('Title').fill('Segment');
  const prompt = picker(page).locator('[data-lf-picker-template="prompt"] textarea');
  await prompt.fill('Which segment is ');
  await picker(page)
    .locator('[data-lf-picker-template="prompt"] [data-lf-picker-chip="company"]')
    .click();
  await search(page, picker(page).locator('[data-lf-picker-field="type"] .ant-select'), 'tag');
  const options = picker(page).getByLabel('Answer options', { exact: true });
  for (const option of ['Software', 'Logistics', 'Retail']) {
    await options.fill(option);
    await options.press('Enter');
  }
  await page.locator('[data-lf-picker-submit]').click();
  await expect(picker(page)).toHaveCount(0);
  await expect(header(page, 'segment')).toContainText('Segment');

  // Run selected in the bulk bar (Ada and Ben are still selected).
  await page.locator('[data-lf-bulk-action="run"]').click();
  await page.locator('.ant-dropdown:visible').getByRole('menuitem', { name: 'Segment' }).click();
  await expect(cell(page, 'Ada Brightwell', 'segment')).toHaveText('Logistics');
  await expect(cell(page, 'Ben Quill', 'segment')).toHaveText('Software');
  // Each option has its own colour.
  const tagFill = (name) =>
    cell(page, name, 'segment')
      .locator('.lf-table-tag')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(await tagFill('Ada Brightwell')).not.toBe(await tagFill('Ben Quill'));
  await expect(status(page, 'Cara Tidewell', 'segment')).toHaveAttribute(
    'data-lf-enrich-status',
    'none'
  );
});

test('a new row runs its autoRun columns', async ({ page }) => {
  await open(page);
  await table(page).locator('[data-lf-new-row]').click();
  const editor = table(page).locator('[data-lf-new-row-editor]');
  await editor.locator('[data-lf-new-row-field="name"] input').fill('Jo Rivers');
  await editor.locator('[data-lf-new-row-field="title"] input').fill('COO');
  await editor.locator('[data-lf-new-row-field="domain"] input').fill('quillsoft.test');
  await page.keyboard.press('Enter');
  await expect(cell(page, 'Jo Rivers', 'domain')).toHaveText('quillsoft.test');
  await expect(cell(page, 'Jo Rivers', 'company')).toHaveText('Software');
  await expect(cell(page, 'Jo Rivers', 'email')).toHaveText('jo.rivers@quillsoft.test');
  await expect(cell(page, 'Jo Rivers', 'pitch')).toContainText('COO at a Software company');
});

test('a CSV import adds the rows and a new column, and runs them', async ({ page, request }) => {
  await open(page);
  const csv = [
    'Person,Company domain,Source',
    'Kim Park,ferncrest.test,Conference',
    'Lee Moss,tidewater.test,Referral',
  ].join('\n');
  await table(page).locator('[data-lf-toolbar-button="import"]').click();
  const dialog = page.locator('[data-lf-import-dialog]');
  await dialog.locator('[data-lf-import-file]').setInputFiles({
    name: 'leads.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`${csv}\n`),
  });
  await expect(dialog.locator('[data-lf-import-header="Source"] .ant-select')).toHaveText(
    'New text column'
  );
  await page.locator('[data-lf-import-submit]').click();
  await expect(dialog.locator('[data-lf-import-done]')).toContainText('Imported 2 rows.');
  await page.locator('[data-lf-import-close]').click();

  await expect(header(page, 'source')).toContainText('Source');
  await expect(cell(page, 'Kim Park', 'source')).toHaveText('Conference');
  await expect(cell(page, 'Kim Park', 'company')).toHaveText('Software');
  await expect(cell(page, 'Lee Moss', 'company')).toHaveText('Retail');
  const leads = await readLeads(request);
  // The new column's values sit under values.<key>, as every user input column's.
  expect(byName(leads, 'Lee Moss').values).toEqual({ source: 'Referral' });
  expect(cellOf(byName(leads, 'Lee Moss'), 'email').status).toBe('ok');
});

test('a row run button runs every enrichment column of the row', async ({ page, request }) => {
  await open(page);
  await cell(page, 'Cara Tidewell', 'name').hover();
  await row(page, 'Cara Tidewell').locator('[data-lf-enrich-run-row]').click();
  await expect(cell(page, 'Cara Tidewell', 'company')).toHaveText('Retail');
  await expect(cell(page, 'Cara Tidewell', 'email')).toHaveText('cara.tidewell@tidewater.test');
  await expect(cell(page, 'Cara Tidewell', 'pitch')).toContainText('Buyer at a Retail company');
  const leads = await settle(request);
  expect(leads.filter((lead) => lead._enrich !== undefined).map((lead) => lead.name)).toEqual([
    'Cara Tidewell',
  ]);
  // The pitch reads the company, so the run leaves it to follow the company: it ran once.
  expect(await mock.log(request, 'ai')).toHaveLength(1);
  expect(cellOf(byName(leads, 'Cara Tidewell'), 'pitch').attempts).toBe(1);
});
