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

import buildColumnConfig from './buildColumnConfig.js';
import createDraft from './createDraft.js';
import draftFromColumn from './draftFromColumn.js';
import generateColumnKey from './generateColumnKey.js';
import getPickerKinds from './getPickerKinds.js';
import syncPromptInputs from './syncPromptInputs.js';
import validateDraft from './validateDraft.js';

const provider = {
  id: 'findEmail',
  title: 'Find email',
  inputs: [
    { key: 'domain', title: 'Domain', required: true },
    { key: 'name', title: 'Name' },
  ],
  outputs: [{ path: 'email', title: 'Email', type: 'email' }],
};

test('generateColumnKey makes a snake case key from the title, unique among the keys', () => {
  expect(generateColumnKey({ title: 'Work email', existingKeys: [] })).toBe('work_email');
  expect(generateColumnKey({ title: 'Work email', existingKeys: ['work_email'] })).toBe(
    'work_email_2'
  );
  expect(
    generateColumnKey({ title: 'Work email', existingKeys: ['work_email', 'work_email_2'] })
  ).toBe('work_email_3');
  expect(generateColumnKey({ title: 'Café  Größe!', existingKeys: [] })).toBe('cafe_gro_e');
  expect(generateColumnKey({ title: '2024 revenue', existingKeys: [] })).toBe('_2024_revenue');
  expect(generateColumnKey({ title: '!!!', existingKeys: ['column'] })).toBe('column_2');
});

test('generateColumnKey never gives a reserved name or a key the server refuses', () => {
  expect(generateColumnKey({ title: 'Constructor', existingKeys: [] })).toBe('constructor_2');
  expect(generateColumnKey({ title: 'prototype', existingKeys: [] })).toBe('prototype_2');
  expect(generateColumnKey({ title: '__proto__', existingKeys: [] })).toBe('proto');
  const long = generateColumnKey({ title: 'word '.repeat(60), existingKeys: [] });
  expect(long.length).toBeLessThanOrEqual(120);
  [long, generateColumnKey({ title: 'ÄÖÜ ß — 日本', existingKeys: [] })].forEach((key) => {
    expect(key).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
  });
});

test('buildColumnConfig builds an editable input column', () => {
  const draft = { ...createDraft(), title: ' Notes ', type: 'text' };
  expect(buildColumnConfig({ draft, key: 'notes' })).toEqual({
    key: 'notes',
    title: 'Notes',
    type: 'text',
    kind: 'input',
    userDefined: true,
    editable: true,
  });
});

test('buildColumnConfig builds a formula column', () => {
  const draft = { ...createDraft({ kind: 'formula' }), title: 'Full', template: '{{ a }} {{ b }}' };
  expect(buildColumnConfig({ draft, key: 'full' })).toEqual({
    key: 'full',
    title: 'Full',
    type: 'text',
    kind: 'formula',
    userDefined: true,
    template: '{{ a }} {{ b }}',
  });
});

test('buildColumnConfig builds an enrichment column with column and literal inputs', () => {
  const draft = {
    ...createDraft({ kind: 'enrichment', provider: 'findEmail' }),
    title: 'Email',
    type: 'email',
    inputs: {
      domain: { mode: 'column', column: 'domain' },
      name: { mode: 'value', value: 'Ada' },
      unused: { mode: 'column', column: '' },
    },
    output: 'email',
    autoRun: true,
  };
  expect(buildColumnConfig({ draft, key: 'email' })).toEqual({
    key: 'email',
    title: 'Email',
    type: 'email',
    kind: 'enrichment',
    userDefined: true,
    provider: 'findEmail',
    inputs: { domain: { column: 'domain' }, name: { value: 'Ada' } },
    output: 'email',
    autoRun: true,
  });
});

test('buildColumnConfig builds an ai column whose output type is the column type', () => {
  const prompt = 'Segment of {{ company }}?';
  const draft = {
    ...createDraft({ kind: 'ai' }),
    title: 'Segment',
    type: 'tag',
    prompt,
    inputs: syncPromptInputs({ prompt, columnKeys: ['company'] }),
    outputOptions: ['smb', 'enterprise'],
  };
  expect(buildColumnConfig({ draft, key: 'segment' })).toEqual({
    key: 'segment',
    title: 'Segment',
    type: 'tag',
    kind: 'ai',
    userDefined: true,
    prompt,
    inputs: { company: { column: 'company' } },
    output: { type: 'tag', options: ['smb', 'enterprise'] },
    autoRun: false,
  });
});

test('syncPromptInputs lists exactly the columns the prompt references', () => {
  expect(
    syncPromptInputs({
      prompt: 'Pitch {{ company }} to {{ title | upper }} ({{ company }}, {{ unknown }})',
      columnKeys: ['company', 'title', 'domain'],
    })
  ).toEqual({
    company: { mode: 'column', column: 'company' },
    title: { mode: 'column', column: 'title' },
  });
  expect(syncPromptInputs({ prompt: 'No refs', columnKeys: ['company'] })).toEqual({});
});

test('buildColumnConfig builds an extract column', () => {
  const draft = {
    ...createDraft({ kind: 'extract' }),
    title: 'City',
    source: 'person',
    path: ' address.city ',
  };
  expect(buildColumnConfig({ draft, key: 'city' })).toEqual({
    key: 'city',
    title: 'City',
    type: 'text',
    kind: 'extract',
    userDefined: true,
    source: 'person',
    path: 'address.city',
  });
});

test('every built column config normalises', () => {
  const configs = [
    buildColumnConfig({ draft: { ...createDraft(), title: 'Domain' }, key: 'domain' }),
    buildColumnConfig({
      draft: {
        ...createDraft({ kind: 'enrichment', provider: 'findEmail' }),
        title: 'Email',
        inputs: { domain: { mode: 'column', column: 'domain' } },
      },
      key: 'email',
    }),
    buildColumnConfig({
      draft: { ...createDraft({ kind: 'ai' }), title: 'Pitch', prompt: 'Hi {{ domain }}' },
      key: 'pitch',
    }),
    buildColumnConfig({
      draft: { ...createDraft({ kind: 'extract' }), title: 'Raw', source: 'email' },
      key: 'raw',
    }),
    buildColumnConfig({
      draft: { ...createDraft({ kind: 'formula' }), title: 'F', template: '{{ domain }}' },
      key: 'f',
    }),
  ];
  expect(() => normalizeColumns({ columns: configs })).not.toThrow();
});

test('validateDraft asks for what the kind needs', () => {
  expect(validateDraft({ draft: createDraft(), provider: null })).toBe('Enter a column title.');
  const titled = (kind) => ({ ...createDraft({ kind }), title: 'X' });
  expect(validateDraft({ draft: titled('input'), provider: null })).toBe(null);
  expect(validateDraft({ draft: titled('formula'), provider: null })).toBe(
    'Enter a formula template.'
  );
  expect(validateDraft({ draft: titled('enrichment'), provider: null })).toBe('Choose a provider.');
  expect(validateDraft({ draft: titled('enrichment'), provider })).toBe(
    'Map the required inputs: Domain.'
  );
  expect(
    validateDraft({
      draft: { ...titled('enrichment'), inputs: { domain: { mode: 'value', value: 'a.io' } } },
      provider,
    })
  ).toBe(null);
  expect(validateDraft({ draft: titled('ai'), provider: null })).toBe('Enter a prompt.');
  expect(validateDraft({ draft: titled('extract'), provider: null })).toBe(
    'Choose the column to extract from.'
  );
});

test('draftFromColumn reads a column config back into a draft that rebuilds it', () => {
  const raw = {
    key: 'email',
    title: 'Email',
    type: 'email',
    kind: 'enrichment',
    userDefined: true,
    provider: 'findEmail',
    inputs: { domain: { column: 'domain' }, name: { value: 'Ada' } },
    output: 'email',
    autoRun: true,
  };
  const { columnsByKey } = normalizeColumns({ columns: ['domain', raw] });
  const draft = draftFromColumn({ raw, column: columnsByKey.email });
  expect(buildColumnConfig({ draft, key: 'email' })).toEqual(raw);
});

test('validateDraft refuses templates and prompts that are more than column placeholders', () => {
  const formula = { ...createDraft({ kind: 'formula' }), title: 'Label' };
  expect(validateDraft({ draft: { ...formula, template: '{{ name }}!' }, provider: null })).toBe(
    null
  );
  expect(
    validateDraft({ draft: { ...formula, template: '{% if a %}x{% endif %}' }, provider: null })
  ).toContain('template tags ({% %})');
  expect(
    validateDraft({ draft: { ...formula, template: '{{ name | upper }}' }, provider: null })
  ).toBe('Only {{ column }} placeholders are supported: "{{ name | upper }}" is an expression.');
  const ai = { ...createDraft({ kind: 'ai' }), title: 'Pitch' };
  expect(validateDraft({ draft: { ...ai, prompt: 'Hi {# x #}' }, provider: null })).toContain(
    'comments ({# #})'
  );
});

test('getPickerKinds shows a catalogue ai provider once, as the AI kind', () => {
  const entries = getPickerKinds({
    kinds: ['input', 'enrichment', 'ai'],
    providers: [provider, { id: 'ai', title: 'Claude', description: 'Our model.' }],
    hasSources: false,
  });
  expect(entries.map((entry) => entry.id)).toEqual(['input', 'provider:findEmail', 'ai']);
  expect(entries[2]).toEqual({ id: 'ai', kind: 'ai', label: 'Claude', description: 'Our model.' });
});

test('an ai draft keeps answer options only for tag and tags', () => {
  const draft = {
    ...createDraft({ kind: 'ai' }),
    title: 'Tier',
    prompt: 'Tier of {{ name }}',
    outputOptions: ['A', 'B'],
  };
  expect(buildColumnConfig({ draft, key: 'tier' }).output).toEqual({ type: 'text' });
  expect(buildColumnConfig({ draft: { ...draft, type: 'tag' }, key: 'tier' }).output).toEqual({
    type: 'tag',
    options: ['A', 'B'],
  });
});

test('draftFromColumn of an error column takes the kind and type its config asked for', () => {
  const raw = {
    key: 'score',
    title: 'Score',
    kind: 'ai',
    userDefined: true,
    prompt: 'Score {{ name }}',
    output: { type: 'number' },
    provider: 'missing',
  };
  const { columnsByKey } = normalizeColumns({
    columns: ['name', raw],
    providerIds: new Set(['findEmail']),
  });
  expect(columnsByKey.score.invalid).toContain('provider "missing"');
  const draft = draftFromColumn({ raw, column: columnsByKey.score });
  expect(draft).toMatchObject({ kind: 'ai', type: 'number', prompt: 'Score {{ name }}' });
});

test('buildColumnConfig gives a new input column its field under inputFieldPrefix', () => {
  const draft = { ...createDraft({ kind: 'input' }), title: 'Notes' };
  expect(buildColumnConfig({ draft, key: 'notes', inputFieldPrefix: 'values' })).toMatchObject({
    key: 'notes',
    kind: 'input',
    field: 'values.notes',
  });
  expect(buildColumnConfig({ draft, key: 'notes' })).not.toHaveProperty('field');
});
