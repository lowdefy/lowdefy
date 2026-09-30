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

import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import getInputRows from './getInputRows.js';

const { columns } = normalizeColumns({
  columns: [
    { key: 'person', title: 'Person' },
    { key: 'domain', title: '<b>Company</b> domain' },
    {
      key: 'email',
      kind: 'enrichment',
      provider: 'finder',
      inputs: {
        full_name: { column: 'person' },
        domain: { column: 'domain' },
        region: { value: 'EU' },
        seniority_level: { value: 'senior' },
      },
    },
    {
      key: 'pitch',
      kind: 'ai',
      prompt: 'Write to {{ person }}',
      inputs: { person: { column: 'person' } },
    },
  ],
  providerIds: new Set(['finder']),
});
const columnsByKey = new Map(columns.map((column) => [column.key, column]));
const provider = {
  id: 'finder',
  inputs: [
    { key: 'full_name', title: 'Full name' },
    { key: 'domain', title: 'Domain' },
    { key: 'region', title: 'Region' },
  ],
};

test('getInputRows titles provider inputs from the catalogue and their columns by title', () => {
  const rows = getInputRows({
    column: columnsByKey.get('email'),
    row: { person: 'Ada', domain: '' },
    columnsByKey,
    provider,
  });
  expect(rows).toEqual([
    { param: 'full_name', label: 'Full name', columnTitle: 'Person', value: 'Ada', missing: false },
    {
      param: 'domain',
      label: 'Domain',
      columnTitle: 'Company domain',
      value: undefined,
      missing: true,
    },
    { param: 'region', label: 'Region', literal: true, value: 'EU', missing: false },
    {
      param: 'seniority_level',
      label: 'Seniority level',
      literal: true,
      value: 'senior',
      missing: false,
    },
  ]);
});

test('getInputRows names an ai column input by its prompt placeholder', () => {
  const rows = getInputRows({
    column: columnsByKey.get('pitch'),
    row: { person: 'Ada' },
    columnsByKey,
    provider: undefined,
  });
  expect(rows).toEqual([
    { param: 'person', label: '{{ person }}', columnTitle: 'Person', value: 'Ada', missing: false },
  ]);
});
