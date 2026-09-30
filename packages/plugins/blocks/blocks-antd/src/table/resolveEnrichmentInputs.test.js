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

import findTemplateRefs from './findTemplateRefs.js';
import normalizeColumns from './normalizeColumns.js';
import resolveEnrichmentInputs from './resolveEnrichmentInputs.js';

const { columnsByKey } = normalizeColumns({
  columns: [
    'domain',
    { key: 'company', field: 'org.name' },
    {
      key: 'person',
      kind: 'enrichment',
      provider: 'people',
      inputs: { domain: { column: 'domain' } },
    },
    { key: 'title', field: 'job.title' },
    {
      key: 'email',
      kind: 'enrichment',
      provider: 'findEmail',
      inputs: {
        domain: { column: 'domain' },
        title: { column: 'title' },
        person: { column: 'person' },
        note: { column: 'note', required: false },
        limit: { value: 3 },
        empty: { value: '' },
      },
    },
    { key: 'note' },
    {
      key: 'pitch',
      kind: 'ai',
      prompt: 'Write to {{ title }} at {{ company }}',
      inputs: { title: { column: 'title' }, company: { column: 'company' } },
    },
  ],
});

const row = {
  domain: 'acme.com',
  org: { name: 'Acme' },
  note: '',
  job: { title: 'CTO' },
  _enrich: { person: { status: 'ok', value: 'Ada' } },
};

test('resolveEnrichmentInputs reads column refs and keeps literals as given', () => {
  expect(resolveEnrichmentInputs({ column: columnsByKey.email, row })).toEqual({
    domain: 'acme.com',
    title: 'CTO',
    person: 'Ada',
    limit: 3,
    empty: '',
  });
});

test('resolveEnrichmentInputs reads an enrichment column input only once its cell is ok', () => {
  const running = { ...row, _enrich: { person: { status: 'running', value: 'Old' } } };
  expect(resolveEnrichmentInputs({ column: columnsByKey.email, row: running })).toEqual({
    domain: 'acme.com',
    title: 'CTO',
    limit: 3,
    empty: '',
  });
});

test('resolveEnrichmentInputs gives an ai column its listed inputs', () => {
  expect(resolveEnrichmentInputs({ column: columnsByKey.pitch, row })).toEqual({
    title: 'CTO',
    company: 'Acme',
  });
});

test('resolveEnrichmentInputs leaves missing column inputs out', () => {
  expect(resolveEnrichmentInputs({ column: columnsByKey.email, row: { domain: null } })).toEqual({
    limit: 3,
    empty: '',
  });
});

test('resolveEnrichmentInputs of a plain column is an empty object', () => {
  expect(resolveEnrichmentInputs({ column: columnsByKey.domain, row })).toEqual({});
});

test('findTemplateRefs lists output names once, in order of first use', () => {
  expect(findTemplateRefs('{{ a }} {{b.c}} {{- a | upper }} {% if d %}{{ e }}{% endif %}')).toEqual(
    ['a', 'b', 'e']
  );
  expect(findTemplateRefs(undefined)).toEqual([]);
});
