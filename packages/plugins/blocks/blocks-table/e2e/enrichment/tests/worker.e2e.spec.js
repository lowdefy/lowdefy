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

import {
  byName,
  callEndpoint,
  cellOf,
  date,
  mock,
  readLeads,
  reset,
  rowKeys,
  runCron,
  settle,
  waitForLeads,
} from './helpers.js';

// The enrichment run queue end to end, at the API level: the app's endpoints, the worker, a
// real MongoDB replica set and the mock services. The specs share one database.
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('a run takes cells from queued through running to ok', async ({ request }) => {
  await mock.latency(request, { company: 1500 });
  const selection = await rowKeys(request, ['Ada Brightwell', 'Ben Quill']);
  const run = await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  expect(run).toMatchObject({ queued: 2, skipped: 0, missingInputs: 0 });

  // Queued by the enqueue, then running once the detached worker claims them.
  const queued = await readLeads(request);
  expect(['queued', 'running']).toContain(
    cellOf(byName(queued, 'Ada Brightwell'), 'company').status
  );
  expect(cellOf(byName(queued, 'Cara Tidewell'), 'company').status).toBeUndefined();
  const running = await waitForLeads(request, (leads) => {
    expect(cellOf(byName(leads, 'Ada Brightwell'), 'company').status).toBe('running');
  });
  const lease = cellOf(byName(running, 'Ada Brightwell'), 'company');
  expect(lease.attempts).toBe(1);
  expect(date(lease.leaseUntil).getTime()).toBeGreaterThan(Date.now());

  const done = await waitForLeads(request, (leads) => {
    expect(cellOf(byName(leads, 'Ada Brightwell'), 'company').status).toBe('ok');
    expect(cellOf(byName(leads, 'Ben Quill'), 'company').status).toBe('ok');
  });
  const ada = cellOf(byName(done, 'Ada Brightwell'), 'company');
  expect(ada).toMatchObject({
    value: 'Logistics',
    raw: { name: 'Brightpath Freight', employees: 420, country: 'NL' },
    attempts: 1,
  });
  expect(ada.inputHash).toMatch(/^[0-9a-f]{14}$/);
  expect(ada.error).toBeUndefined();
  expect(cellOf(byName(done, 'Ben Quill'), 'company').value).toBe('Software');
  expect((await mock.log(request, 'company')).map((entry) => entry.query.domain).sort()).toEqual([
    'brightpath.test',
    'quillsoft.test',
  ]);
});

test('a provider without a result leaves the cell empty', async ({ request }) => {
  const selection = await rowKeys(request, ['Finn Marsh', 'Ivy Lane']);
  const run = await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  // Ivy has no domain: her cell is empty at once, and nothing is called for it.
  expect(run).toMatchObject({ queued: 1, missingInputs: 1 });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Finn Marsh'), 'company')).toMatchObject({
    status: 'empty',
    raw: { status: 404 },
  });
  expect(cellOf(byName(leads, 'Ivy Lane'), 'company')).toMatchObject({
    status: 'empty',
    error: 'Missing input: domain',
    attempts: 0,
  });
  expect(await mock.log(request, 'company')).toHaveLength(1);
});

test('a failing provider is retried with backoff, then the cell fails', async ({ request }) => {
  const selection = await rowKeys(request, ['Gina Brooks']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  const retried = await waitForLeads(request, (leads) => {
    const cell = cellOf(byName(leads, 'Gina Brooks'), 'company');
    expect(cell).toMatchObject({ status: 'queued', attempts: 1 });
    expect(cell.error).toContain('500');
  });
  // The failed attempt is queued again, due after the backoff.
  const [firstCall] = await mock.log(request, 'company');
  const cell = cellOf(byName(retried, 'Gina Brooks'), 'company');
  expect(date(cell.queuedAt).getTime()).toBeGreaterThanOrEqual(firstCall.at + 300);

  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Gina Brooks'), 'company')).toMatchObject({
    status: 'error',
    attempts: 3,
  });
  const calls = (await mock.log(request, 'company')).map((entry) => entry.at);
  expect(calls).toHaveLength(3);
  // backoffMs 300, doubled per attempt made.
  expect(calls[1] - calls[0]).toBeGreaterThanOrEqual(300);
  expect(calls[2] - calls[1]).toBeGreaterThanOrEqual(600);
});

test('a rate limited call is retried and then succeeds', async ({ request }) => {
  const selection = await rowKeys(request, ['Eve Honeywell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Eve Honeywell'), 'company')).toMatchObject({
    status: 'ok',
    value: 'Retail',
    attempts: 2,
  });
  expect((await mock.log(request, 'company')).map((entry) => entry.status)).toEqual([429, 200]);
});

test('a bad request or invalid inputs fail at once, without a retry', async ({ request }) => {
  const [ada] = await rowKeys(request, ['Ada Brightwell']);
  await callEndpoint(request, 'leads_update', {
    rowKey: ada,
    values: { domain: 'not a domain' },
  });
  const selection = await rowKeys(request, ['Hal Stone', 'Ada Brightwell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Hal Stone'), 'company')).toMatchObject({
    status: 'error',
    attempts: 1,
  });
  expect(cellOf(byName(leads, 'Hal Stone'), 'company').error).toContain('400');
  // The provider checks its inputs, so the service is never called with them.
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'company')).toMatchObject({
    status: 'error',
    attempts: 1,
    error: 'Invalid input: domain should be a domain name, like example.com.',
  });
  expect((await mock.log(request, 'company')).map((entry) => entry.query.domain)).toEqual([
    'badrequest.test',
  ]);
});

test('the email waterfall returns the first source with a hit', async ({ request }) => {
  const selection = await rowKeys(request, ['Ada Brightwell', 'Ben Quill', 'Finn Marsh']);
  await callEndpoint(request, 'enrichment_run', { columns: ['email'], selection });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'email')).toMatchObject({
    status: 'ok',
    value: 'ada.brightwell@brightpath.test',
    raw: { source: 'source_a' },
  });
  expect(cellOf(byName(leads, 'Ben Quill'), 'email')).toMatchObject({
    status: 'ok',
    value: 'ben.quill@quillsoft.test',
    raw: { source: 'source_b', response: { result: { score: 71 } } },
  });
  expect(cellOf(byName(leads, 'Finn Marsh'), 'email')).toMatchObject({
    status: 'empty',
    raw: { tried: ['source_a', 'source_b'] },
  });
  const calls = (await mock.log(request)).map((entry) => `${entry.service}:${entry.query.domain}`);
  // Source B is only asked when source A has nothing.
  expect(calls.filter((call) => call.endsWith('brightpath.test'))).toEqual([
    'email_a:brightpath.test',
  ]);
  expect(calls.filter((call) => call.endsWith('quillsoft.test'))).toEqual([
    'email_a:quillsoft.test',
    'email_b:quillsoft.test',
  ]);
});

test('an upstream cell that completes runs its autoRun columns', async ({ request }) => {
  const selection = await rowKeys(request, ['Ada Brightwell', 'Finn Marsh']);
  // Only company runs; the pitch reads it, and follows.
  const run = await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  expect(run.queued).toBe(2);
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'pitch')).toMatchObject({
    status: 'ok',
    value:
      'Mock reply to: Write a one line opener for Ada Brightwell, Head of Operations at a Logistics company.',
  });
  // Finn's company is empty, so his pitch never ran.
  expect(cellOf(byName(leads, 'Finn Marsh'), 'pitch').status).toBeUndefined();
  const prompts = (await mock.log(request, 'ai')).map((entry) => entry.prompt);
  expect(prompts).toEqual([
    'Write a one line opener for Ada Brightwell, Head of Operations at a Logistics company.',
  ]);
});

test('a stale run recomputes only the cells whose inputs changed', async ({ request }) => {
  const selection = await rowKeys(request, ['Ada Brightwell', 'Ben Quill', 'Cara Tidewell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  const before = await settle(request);
  const [ben] = await rowKeys(request, ['Ben Quill']);
  await callEndpoint(request, 'leads_update', {
    rowKey: ben,
    values: { domain: 'tidewater.test' },
  });
  await mock.reset(request);

  const run = await callEndpoint(request, 'enrichment_run', {
    columns: ['company'],
    selection,
    mode: 'stale',
  });
  expect(run).toMatchObject({ queued: 1, skipped: 2 });
  await waitForLeads(request, (leads) => {
    // The pitch reads the company, so it follows the new value.
    expect(cellOf(byName(leads, 'Ben Quill'), 'pitch').value).toContain('CTO at a Retail company');
  });
  const leads = await settle(request);
  const cell = cellOf(byName(leads, 'Ben Quill'), 'company');
  expect(cell).toMatchObject({ status: 'ok', value: 'Retail' });
  expect(cell.inputHash).not.toBe(cellOf(byName(before, 'Ben Quill'), 'company').inputHash);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'company').finishedAt).toEqual(
    cellOf(byName(before, 'Ada Brightwell'), 'company').finishedAt
  );
  expect((await mock.log(request, 'company')).map((entry) => entry.query.domain)).toEqual([
    'tidewater.test',
  ]);
});

test('concurrent workers never run the same cell twice', async ({ request }) => {
  await mock.latency(request, { company: 120, email_a: 60, email_b: 60 });
  const rows = Array.from({ length: 24 }, (_, index) => ({
    name: `Import Person ${index}`,
    domain: `import-${index}.test`,
  }));
  // The import queues the autoRun columns (company and email) and starts a worker; two more
  // workers and a cron tick run at the same time.
  const imported = await callEndpoint(request, 'leads_import', { rows });
  expect(imported.insertedCount).toBe(24);
  await Promise.all([callEndpoint(request, 'test_start_workers'), runCron(request)]);
  const leads = await settle(request, { timeout: 30000 });

  const importedLeads = leads.filter((lead) => lead.name.startsWith('Import Person'));
  importedLeads.forEach((lead) => {
    expect(cellOf(lead, 'company')).toMatchObject({ status: 'empty', attempts: 1 });
    expect(cellOf(lead, 'email')).toMatchObject({ status: 'empty', attempts: 1 });
  });
  const log = await mock.log(request);
  for (const service of ['company', 'email_a', 'email_b']) {
    const domains = log.filter((entry) => entry.service === service).map((e) => e.query.domain);
    expect(domains, service).toHaveLength(24);
    expect(new Set(domains).size, service).toBe(24);
  }
});

test('a cell whose worker crashed is claimed again when its lease runs out', async ({
  request,
}) => {
  const [ada, ben] = await rowKeys(request, ['Ada Brightwell', 'Ben Quill']);
  const past = { '~d': Date.now() - 1000 };
  const crashed = {
    status: 'running',
    runId: 'crashed-run',
    attempts: 1,
    claimToken: `${'a'.repeat(24)}:${'0'.repeat(14)}`,
    queuedAt: past,
    startedAt: past,
    leaseUntil: past,
  };
  await callEndpoint(request, 'test_set_cell', {
    rowKey: ada,
    columnKey: 'company',
    cell: crashed,
  });
  // On its last attempt, a lost lease is final.
  await callEndpoint(request, 'test_set_cell', {
    rowKey: ben,
    columnKey: 'company',
    cell: { ...crashed, attempts: 3 },
  });

  const tick = await runCron(request);
  expect(tick.cells).toBeGreaterThanOrEqual(1);
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'company')).toMatchObject({
    status: 'ok',
    value: 'Logistics',
    attempts: 2,
  });
  expect(cellOf(byName(leads, 'Ben Quill'), 'company')).toMatchObject({
    status: 'error',
    attempts: 3,
  });
  expect((await mock.log(request, 'company')).map((entry) => entry.query.domain)).toEqual([
    'brightpath.test',
  ]);
});

test('a new row runs its autoRun columns', async ({ request }) => {
  const added = await callEndpoint(request, 'leads_add', {
    values: { name: 'Jo Rivers', title: 'COO', domain: 'ferncrest.test' },
  });
  expect(added.insertedId._oid).toMatch(/^[0-9a-f]{24}$/);
  const leads = await settle(request);
  const jo = byName(leads, 'Jo Rivers');
  expect(cellOf(jo, 'company')).toMatchObject({ status: 'ok', value: 'Software' });
  expect(cellOf(jo, 'email')).toMatchObject({ status: 'ok', value: 'jo.rivers@ferncrest.test' });
  expect(cellOf(jo, 'pitch')).toMatchObject({ status: 'ok' });
  expect(cellOf(jo, 'pitch').value).toContain('Jo Rivers, COO at a Software company');
  // No other row ran.
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'company').status).toBeUndefined();
});

test('a new row can only set input fields', async ({ request }) => {
  const refused = await callEndpoint(request, 'leads_add', {
    values: { name: 'Mallory', _enrich: 'x', secret: 'y' },
  });
  expect(refused.error).toContain('"_enrich" is not an input column.');
  expect(refused.error).toContain('"secret" is not an input column.');
});

test('an AI prompt fills a dotted placeholder from the input it starts with', async ({
  request,
}) => {
  const column = {
    key: 'firm_note',
    kind: 'ai',
    prompt: 'Note {{ firm.name }} in {{ firm.address.city }} for {{name}}, not {{ firm.missing }}.',
    inputs: {
      name: { column: 'name' },
      firm: { value: { name: 'Acme', address: { city: 'Cape Town' } } },
    },
  };
  const added = await callEndpoint(request, 'columns_add', { column });
  expect(added.error).toBeUndefined();
  const selection = await rowKeys(request, ['Ada Brightwell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['firm_note'], selection });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'firm_note')).toMatchObject({
    status: 'ok',
    raw: { prompt: 'Note Acme in Cape Town for Ada Brightwell, not .' },
  });
});

test('AI columns return values of their output type', async ({ request }) => {
  const columns = [
    {
      key: 'fit_score',
      title: 'Fit score',
      kind: 'ai',
      prompt: 'Rate {{ industry }} out of 10.',
      inputs: { industry: { column: 'company' } },
      output: { type: 'number' },
    },
    {
      key: 'is_software',
      kind: 'ai',
      prompt: 'Is {{ industry }} a tech business?',
      inputs: { industry: { column: 'company' } },
      output: { type: 'boolean' },
    },
    {
      key: 'segment',
      kind: 'ai',
      prompt: 'Which segment is {{ industry }}?',
      inputs: { industry: { column: 'company' } },
      output: { type: 'tag', options: ['Software', 'Logistics', 'Retail'] },
    },
    {
      key: 'summary',
      kind: 'ai',
      // An ai column may name its provider: `ai`, the built-in one, here.
      provider: 'ai',
      prompt: 'Summarise {{ name }}.',
      inputs: { name: { column: 'name' } },
    },
  ];
  for (const column of columns) {
    const added = await callEndpoint(request, 'columns_add', { column });
    expect(added.error).toBeUndefined();
  }
  const selection = await rowKeys(request, ['Ada Brightwell', 'Ben Quill']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company'], selection });
  await settle(request);
  await callEndpoint(request, 'enrichment_run', {
    columns: ['fit_score', 'is_software', 'segment', 'summary'],
    selection,
  });
  const leads = await settle(request);
  const ada = byName(leads, 'Ada Brightwell');
  const ben = byName(leads, 'Ben Quill');
  expect(cellOf(ada, 'fit_score')).toMatchObject({ status: 'ok', value: 10 });
  expect(cellOf(ada, 'is_software')).toMatchObject({ status: 'ok', value: false });
  expect(cellOf(ben, 'is_software')).toMatchObject({ status: 'ok', value: true });
  expect(cellOf(ada, 'segment')).toMatchObject({ status: 'ok', value: 'Logistics' });
  expect(cellOf(ben, 'segment')).toMatchObject({ status: 'ok', value: 'Software' });
  expect(cellOf(ada, 'summary')).toMatchObject({
    status: 'ok',
    value: 'Mock reply to: Summarise Ada Brightwell.',
    raw: { prompt: 'Summarise Ada Brightwell.' },
  });
  // A prompt is filled in by plain substitution: a value that looks like a template stays text.
  const [cara] = await rowKeys(request, ['Cara Tidewell']);
  await callEndpoint(request, 'leads_update', {
    rowKey: cara,
    values: { name: "{{ 7 * 7 }} {% raw %}{{ range.constructor('return 1')() }}" },
  });
  await callEndpoint(request, 'enrichment_run', { columns: ['summary'], selection: [cara] });
  const after = await settle(request);
  expect(
    cellOf(byName(after, "{{ 7 * 7 }} {% raw %}{{ range.constructor('return 1')() }}"), 'summary')
      .raw.prompt
  ).toBe("Summarise {{ 7 * 7 }} {% raw %}{{ range.constructor('return 1')() }}.");
});
