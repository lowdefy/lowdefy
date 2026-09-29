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

import { byName, callEndpoint, cellOf, reset, rowKeys, settle } from './helpers.js';

// User-defined columns through the columns endpoints, and the merged column list the page and
// the worker read (the get_columns request, run here by the endpoints' shared routine).
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await reset(request);
});

async function addColumn(request, column, position) {
  return callEndpoint(request, 'columns_add', { column, position });
}

test('added columns are stored and merged with the declared columns by position', async ({
  request,
}) => {
  const added = await addColumn(request, {
    key: 'company_country',
    title: 'Country',
    kind: 'enrichment',
    provider: 'company_lookup',
    inputs: { domain: { column: 'domain' } },
    output: 'country',
  });
  expect(added.column).toEqual({
    key: 'company_country',
    title: 'Country',
    type: 'text',
    kind: 'enrichment',
    config: {
      provider: 'company_lookup',
      inputs: { domain: { column: 'domain' } },
      output: 'country',
      field: '_enrich.company_country.value',
      autoRun: false,
    },
  });
  // Between the declared title (20) and domain (30) columns.
  await addColumn(request, { key: 'notes', kind: 'input', type: 'text' }, 25);
  const updated = await callEndpoint(request, 'columns_update', {
    column: { key: 'notes', title: 'Notes', kind: 'input', type: 'text' },
  });
  expect(updated.column.title).toBe('Notes');

  const columns = await callEndpoint(request, 'test_columns');
  expect(columns.map((column) => column.key)).toEqual([
    'name',
    'title',
    'notes',
    'domain',
    'company',
    'employees',
    'email',
    'pitch',
    'company_country',
  ]);
  expect(columns.find((column) => column.key === 'notes')).toEqual({
    key: 'notes',
    title: 'Notes',
    type: 'text',
    kind: 'input',
    position: 25,
    field: 'values.notes',
    userDefined: true,
  });
  expect(columns.find((column) => column.key === 'company').userDefined).toBeUndefined();

  // The new column runs like a declared one.
  const selection = await rowKeys(request, ['Ada Brightwell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['company_country'], selection });
  const leads = await settle(request);
  expect(cellOf(byName(leads, 'Ada Brightwell'), 'company_country')).toMatchObject({
    status: 'ok',
    value: 'NL',
  });
});

test('a user input column feeds an enrichment column', async ({ request }) => {
  await addColumn(request, { key: 'website', title: 'Website', kind: 'input', type: 'url' });
  await addColumn(request, {
    key: 'website_industry',
    kind: 'enrichment',
    provider: 'company_lookup',
    inputs: { domain: { column: 'website' } },
    autoRun: true,
  });
  const [ivy] = await rowKeys(request, ['Ivy Lane']);
  const update = await callEndpoint(request, 'leads_update', {
    rowKey: ivy,
    values: { website: 'tidewater.test' },
  });
  expect(update.matched).toBe(1);
  await callEndpoint(request, 'enrichment_run', {
    columns: ['website_industry'],
    selection: [ivy],
  });
  const leads = await settle(request);
  const lead = byName(leads, 'Ivy Lane');
  // Stored under values.<key>, so a user column can never name another field of the row.
  expect(lead.values).toEqual({ website: 'tidewater.test' });
  expect(cellOf(lead, 'website_industry')).toMatchObject({ status: 'ok', value: 'Retail' });
});

test('invalid columns are refused with the reason', async ({ request }) => {
  const cases = [
    [{ key: 'bad key', kind: 'input' }, 'The column key should be 1 to 128 letters'],
    [{ key: 'company', kind: 'input' }, 'A column with key "company" already exists.'],
    [{ key: 'x', kind: 'script' }, 'The column kind should be one of'],
    [
      { key: 'x', kind: 'enrichment', provider: 'http_get', inputs: {} },
      'Provider "http_get" is not in the provider catalogue.',
    ],
    [
      { key: 'x', kind: 'enrichment', provider: 'company_lookup', inputs: {} },
      'Provider "company_lookup" needs input "domain".',
    ],
    [
      {
        key: 'x',
        kind: 'enrichment',
        provider: 'company_lookup',
        inputs: { domain: { column: 'domain' }, url: { value: 'http://example.test' } },
      },
      'Provider "company_lookup" has no input "url".',
    ],
    [
      {
        key: 'x',
        kind: 'enrichment',
        provider: 'company_lookup',
        inputs: { domain: { column: 'passwordHash' } },
      },
      'Input "domain" reads "passwordHash", which is not a column the server can read.',
    ],
    [
      {
        key: 'x',
        kind: 'enrichment',
        provider: 'company_lookup',
        inputs: { domain: { column: 'employees' } },
      },
      'Input "domain" reads "employees", which is not a column the server can read.',
    ],
    [
      {
        key: 'x',
        kind: 'ai',
        prompt: 'Describe {{ name }} at {{ domain }}',
        inputs: { name: { column: 'name' } },
      },
      'The prompt uses {{ domain }}, which is not an input.',
    ],
    [
      { key: 'x', kind: 'ai', prompt: '{{ range.constructor }}', inputs: {} },
      'An AI prompt can only reference columns, as {{ column }}.',
    ],
    [
      { key: 'x', kind: 'ai', prompt: 'Pick', output: { type: 'options', options: [] } },
      'An AI column with output options needs a list of text options.',
    ],
    [
      { key: 'x', kind: 'extract', source: 'name', path: 'a' },
      'An extract column needs the key of an enrichment or ai column as its source.',
    ],
  ];
  for (const [column, message] of cases) {
    const refused = await addColumn(request, column);
    expect(refused.error, JSON.stringify(column)).toContain(message);
  }
  const columns = await callEndpoint(request, 'test_columns');
  expect(columns.filter((column) => column.userDefined)).toEqual([]);
});

test('declared columns can not be changed or deleted', async ({ request }) => {
  const update = await callEndpoint(request, 'columns_update', {
    column: { key: 'company', kind: 'input' },
  });
  expect(update.error).toBe('Only user-defined columns can be changed.');
  const deleted = await callEndpoint(request, 'columns_delete', { column: { key: 'company' } });
  expect(deleted.error).toContain('is read by');
  const email = await callEndpoint(request, 'columns_delete', { column: { key: 'email' } });
  expect(email.error).toBe('Only user-defined columns can be deleted.');
});

test('an update that makes columns read each other is refused', async ({ request }) => {
  await addColumn(request, {
    key: 'first',
    kind: 'ai',
    prompt: 'About {{ name }}',
    inputs: { name: { column: 'name' } },
  });
  await addColumn(request, {
    key: 'second',
    kind: 'ai',
    prompt: 'About {{ first }}',
    inputs: { first: { column: 'first' } },
  });
  const refused = await callEndpoint(request, 'columns_update', {
    column: {
      key: 'first',
      kind: 'ai',
      prompt: 'About {{ second }}',
      inputs: { second: { column: 'second' } },
    },
  });
  expect(refused.error).toBe('The column inputs read the column itself.');
});

test('deleting a column removes its cells, unless another column reads it', async ({ request }) => {
  await addColumn(request, {
    key: 'founded',
    kind: 'enrichment',
    provider: 'company_lookup',
    inputs: { domain: { column: 'domain' } },
    output: 'founded',
  });
  await addColumn(request, {
    key: 'founded_note',
    kind: 'ai',
    prompt: 'Founded {{ year }}',
    inputs: { year: { column: 'founded' } },
  });
  const selection = await rowKeys(request, ['Ada Brightwell']);
  await callEndpoint(request, 'enrichment_run', { columns: ['founded'], selection });
  const before = await settle(request);
  expect(cellOf(byName(before, 'Ada Brightwell'), 'founded').value).toBe(2004);

  const refused = await callEndpoint(request, 'columns_delete', { column: { key: 'founded' } });
  expect(refused.error).toBe(
    'Column "founded" is read by founded_note. Change those columns first.'
  );
  expect(
    (await callEndpoint(request, 'columns_delete', { column: { key: 'founded_note' } })).deleted
  ).toBe('founded_note');
  expect(
    (await callEndpoint(request, 'columns_delete', { column: { key: 'founded' } })).deleted
  ).toBe('founded');
  const leads = await callEndpoint(request, 'test_leads');
  expect(byName(leads, 'Ada Brightwell')._enrich.founded).toBeUndefined();
  const columns = await callEndpoint(request, 'test_columns');
  expect(columns.map((column) => column.key)).not.toContain('founded');
});
