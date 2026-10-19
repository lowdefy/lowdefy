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

import {
  byName,
  callEndpoint,
  cellOf,
  date,
  mock,
  reset,
  rowKeys,
  settle,
  waitForLeads,
} from './helpers.js';

// A treg-backed provider (find_work_email_treg) end to end: the TregConnection, the provider
// endpoint, the worker and MongoDBEnrichmentComplete, against the treg mock. The mock answers
// by domain (see mocks/mockServices.mjs): brightpath.test at once, quillsoft.test through an
// async task, tidewater.test out of capacity once, ferncrest.test after the connection gave
// up, busybee.test out of balance, nowhere.test with no result.
test.describe.configure({ mode: 'serial' });

const column = {
  key: 'work_email',
  title: 'Work email',
  kind: 'enrichment',
  provider: 'find_work_email_treg',
  inputs: { full_name: { column: 'name' }, domain: { column: 'domain' } },
  output: 'email',
};

async function run(request, names) {
  const selection = await rowKeys(request, names);
  return callEndpoint(request, 'enrichment_run', { columns: ['work_email'], selection });
}

async function tregCalls(request, domain) {
  const log = await mock.log(request, 'treg');
  return log.filter(
    (entry) => entry.endpoint === 'treg.people.email.find' && entry.body?.domain === domain
  );
}

// The Idempotency-Key the worker sends for a cell: runId:columnKey:rowKey:inputHash.
function keyOf(lead) {
  const cell = cellOf(lead, 'work_email');
  return `${cell.runId}:work_email:${lead._id._oid}:${cell.inputHash}`;
}

test.beforeEach(async ({ request }) => {
  await reset(request);
  const added = await callEndpoint(request, 'columns_add', { column });
  expect(added.error).toBeUndefined();
});

test('a treg call stores the email and the cost treg charged', async ({ request }) => {
  expect(await run(request, ['Ada Brightwell', 'Finn Marsh'])).toMatchObject({ queued: 2 });
  const leads = await settle(request);
  const ada = byName(leads, 'Ada Brightwell');
  expect(cellOf(ada, 'work_email')).toMatchObject({
    status: 'ok',
    value: 'ada.brightwell@brightpath.test',
    cost: 4000,
    attempts: 1,
    raw: {
      servedBy: 'mockmail.people.email.find',
      replayed: false,
      response: { source: 'mockmail' },
    },
  });
  // A routed miss: every provider tried, none had the person, nothing charged.
  expect(cellOf(byName(leads, 'Finn Marsh'), 'work_email')).toMatchObject({
    status: 'empty',
    cost: 0,
    raw: { outcome: 'miss' },
  });
  const [call] = await tregCalls(request, 'brightpath.test');
  expect(call).toMatchObject({ status: 200, charged: 4000, replayed: false });
  expect(call.idempotencyKey).toBe(keyOf(ada));
});

test('out of treg balance is a final error with the balance message', async ({ request }) => {
  await run(request, ['Eve Honeywell']);
  const leads = await settle(request);
  const cell = cellOf(byName(leads, 'Eve Honeywell'), 'work_email');
  expect(cell).toMatchObject({ status: 'error', attempts: 1 });
  expect(cell.error).toContain('treg balance too low: needs ~$0.004, has $0.001.');
  // The top-up link is only in the server log.
  expect(cell.error).not.toContain('topup');
  const calls = await tregCalls(request, 'busybee.test');
  expect(calls.map((entry) => entry.status)).toEqual([402]);
});

test('a provider out of capacity is retried after the retry_after treg sent', async ({
  request,
}) => {
  await run(request, ['Cara Tidewell']);
  const retried = await waitForLeads(request, (leads) => {
    const cell = cellOf(byName(leads, 'Cara Tidewell'), 'work_email');
    expect(cell).toMatchObject({ status: 'queued', attempts: 1 });
    expect(cell.error).toContain('503');
  });
  // retry_after is 2 seconds; the queue's own backoff is 300 ms.
  const [first] = await tregCalls(request, 'tidewater.test');
  const delay = date(cellOf(byName(retried, 'Cara Tidewell'), 'work_email').queuedAt) - first.at;
  expect(delay).toBeGreaterThanOrEqual(2000);
  expect(delay).toBeLessThan(3500);

  const leads = await settle(request);
  const cara = byName(leads, 'Cara Tidewell');
  expect(cellOf(cara, 'work_email')).toMatchObject({
    status: 'ok',
    value: 'cara.tidewell@tidewater.test',
    attempts: 2,
    cost: 4000,
  });
  const calls = await tregCalls(request, 'tidewater.test');
  expect(calls.map((entry) => entry.status)).toEqual([503, 200]);
  expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(2000);
  // Both attempts sent the cell's key; nothing was charged for the refused one.
  expect(calls.map((entry) => entry.idempotencyKey)).toEqual([keyOf(cara), keyOf(cara)]);
  expect(calls.map((entry) => entry.charged)).toEqual([0, 4000]);
});

test('a retry reuses the idempotency key, so a lost answer is replayed, charged once', async ({
  request,
}) => {
  await run(request, ['Dan Fernsby']);
  const leads = await settle(request);
  const dan = byName(leads, 'Dan Fernsby');
  // The first answer came after the connection timeout; the retry got treg's stored answer.
  expect(cellOf(dan, 'work_email')).toMatchObject({
    status: 'ok',
    value: 'dan.fernsby@ferncrest.test',
    attempts: 2,
    cost: 0,
    raw: { replayed: true },
  });
  const calls = await tregCalls(request, 'ferncrest.test');
  expect(calls).toHaveLength(2);
  expect(calls[0]).toMatchObject({ lost: true, replayed: false, charged: 4000 });
  expect(calls[1]).toMatchObject({ replayed: true, charged: 0 });
  expect(calls.map((entry) => entry.idempotencyKey)).toEqual([keyOf(dan), keyOf(dan)]);
});

test('a new run of a cell sends a new idempotency key', async ({ request }) => {
  await run(request, ['Ada Brightwell']);
  await settle(request);
  await run(request, ['Ada Brightwell']);
  const leads = await settle(request);
  const calls = await tregCalls(request, 'brightpath.test');
  expect(calls).toHaveLength(2);
  expect(calls[0].idempotencyKey).not.toBe(calls[1].idempotencyKey);
  expect(calls[1].idempotencyKey).toBe(keyOf(byName(leads, 'Ada Brightwell')));
  expect(calls.map((entry) => entry.charged)).toEqual([4000, 4000]);
});

test('an async treg task is awaited, and costs what it reserved', async ({ request }) => {
  await run(request, ['Ben Quill']);
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ben Quill'), 'work_email')).toMatchObject({
    status: 'ok',
    value: 'ben.quill@quillsoft.test',
    attempts: 1,
    cost: 6000,
    raw: { output: { status: 'finished' } },
  });
  const log = await mock.log(request, 'treg');
  expect(log.map((entry) => [entry.endpoint, entry.status])).toEqual([
    ['treg.people.email.find', 202],
    ['mocktasks.email.status', 200],
    ['mocktasks.email.status', 200],
  ]);
  expect(log[1].query).toEqual({ id: 'task_1' });
});

test('the details panel shows the cost of a treg cell', async ({ page, request }) => {
  await run(request, ['Ada Brightwell']);
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'work_email').status).toBe('ok');

  await page.goto('/enrichment');
  const row = getBlock(page, 'leads_table')
    .locator('.lf-table-body [data-row-key]')
    .filter({ has: page.locator('[data-col-key="name"]', { hasText: /^Ada Brightwell$/ }) });
  const cell = row.locator('[data-lf-cell][data-col-key="work_email"]');
  await expect(cell.locator('[data-lf-enrich-status]')).toHaveAttribute(
    'data-lf-enrich-status',
    'ok'
  );
  // The value is a link (an email); a click beside it opens the details panel.
  await cell.click({ position: { x: 150, y: 10 } });
  const details = page.locator('[data-lf-cell-details]');
  await expect(details).toHaveAttribute('data-lf-cell-details', 'work_email');
  await expect(details.locator('[data-lf-details-timing="cost"]')).toHaveText('$0.004');
  await expect(details.locator('[data-lf-details-timing="attempts"]')).toHaveText('1');
});
