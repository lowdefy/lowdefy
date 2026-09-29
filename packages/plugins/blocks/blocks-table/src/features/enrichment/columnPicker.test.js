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

import isEnrichmentInputColumn from '@lowdefy/blocks-antd/table/isEnrichmentInputColumn.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import assignOptionColors from './assignOptionColors.js';
import buildColumnConfig from './buildColumnConfig.js';
import createDraft from './createDraft.js';
import draftFromColumn from './draftFromColumn.js';
import generateColumnKey from './generateColumnKey.js';
import getPickerKinds from './getPickerKinds.js';
import syncPromptInputs from './syncPromptInputs.js';
import validateDraft from './validateDraft.js';

const inputKeys = ['name', 'domain'];

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
    outputOptions: [
      { value: 'smb', color: 'blue' },
      { value: 'enterprise', color: 'green' },
    ],
  };
  expect(buildColumnConfig({ draft, key: 'segment' })).toEqual({
    key: 'segment',
    title: 'Segment',
    type: 'tag',
    kind: 'ai',
    userDefined: true,
    prompt,
    inputs: { company: { column: 'company' } },
    output: {
      type: 'tag',
      options: [
        { value: 'smb', color: 'blue' },
        { value: 'enterprise', color: 'green' },
      ],
    },
    autoRun: false,
  });
});

test('assignOptionColors gives new options distinct tones and keeps chosen ones', () => {
  expect(assignOptionColors({ values: ['a', 'b', 'c'] })).toEqual([
    { value: 'a', color: 'blue' },
    { value: 'b', color: 'green' },
    { value: 'c', color: 'orange' },
  ]);
  // A kept colour stays; a new option takes the first tone no other option uses.
  expect(
    assignOptionColors({
      values: ['b', 'd'],
      previous: [
        { value: 'a', color: 'blue' },
        { value: 'b', color: 'blue' },
      ],
    })
  ).toEqual([
    { value: 'b', color: 'blue' },
    { value: 'd', color: 'green' },
  ]);
  // Plain string options (saved before options had colours) get tones.
  expect(assignOptionColors({ values: ['x'], previous: ['x'] })).toEqual([
    { value: 'x', color: 'blue' },
  ]);
});

test('draftFromColumn reads answer options back with their colours', () => {
  const raw = {
    key: 'tier',
    title: 'Tier',
    kind: 'ai',
    userDefined: true,
    prompt: 'Tier of {{ name }}',
    inputs: { name: { column: 'name' } },
    output: { type: 'tag', options: [{ value: 'A', color: 'red' }, 'B'] },
  };
  const { columnsByKey } = normalizeColumns({ columns: ['name', raw] });
  expect(draftFromColumn({ raw, column: columnsByKey.tier }).outputOptions).toEqual([
    { value: 'A', color: 'red' },
    { value: 'B', color: 'blue' },
  ]);
});

test('syncPromptInputs lists exactly the columns the prompt references', () => {
  expect(
    syncPromptInputs({
      // A dot path references the column it starts with; an expression references nothing
      // (validateDraft refuses it).
      prompt:
        'Pitch {{ company }} to {{ title.name }} ({{ company }}, {{ unknown }}, {{ domain | upper }})',
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
  expect(validateDraft({ draft: createDraft(), provider: null, inputKeys })).toBe(
    'Enter a column title.'
  );
  const titled = (kind) => ({ ...createDraft({ kind }), title: 'X' });
  expect(validateDraft({ draft: titled('input'), provider: null, inputKeys })).toBe(null);
  expect(validateDraft({ draft: titled('formula'), provider: null, inputKeys })).toBe(
    'Enter a formula template.'
  );
  expect(validateDraft({ draft: titled('enrichment'), provider: null, inputKeys })).toBe(
    'Choose a provider.'
  );
  expect(validateDraft({ draft: titled('enrichment'), provider, inputKeys })).toBe(
    'Map the required inputs: Domain.'
  );
  expect(
    validateDraft({
      draft: { ...titled('enrichment'), inputs: { domain: { mode: 'value', value: 'a.io' } } },
      provider,
      inputKeys,
    })
  ).toBe(null);
  expect(validateDraft({ draft: titled('ai'), provider: null, inputKeys })).toBe('Enter a prompt.');
  expect(validateDraft({ draft: titled('extract'), provider: null, inputKeys })).toBe(
    'Choose the column to extract from.'
  );
});

test('validateDraft refuses inputs and prompt placeholders from columns the server can not read', () => {
  const enrichment = {
    ...createDraft({ kind: 'enrichment' }),
    title: 'Email',
    inputs: { domain: { mode: 'column', column: 'label' } },
  };
  expect(validateDraft({ draft: enrichment, provider, inputKeys })).toBe(
    'An input can not read "label": use an input, data, enrichment or AI column (formula and extract columns compute in the browser).'
  );
  const ai = {
    ...createDraft({ kind: 'ai' }),
    title: 'Pitch',
    prompt: 'Hi {{ name }} at {{ label }}',
  };
  expect(validateDraft({ draft: ai, provider: null, inputKeys })).toContain('"label"');
  expect(
    validateDraft({ draft: { ...ai, prompt: 'Hi {{ name }}' }, provider: null, inputKeys })
  ).toBe(null);
});

test('isEnrichmentInputColumn offers input, data, enrichment and ai columns, not formula or extract', () => {
  const { columns } = normalizeColumns({
    columns: [
      'name',
      { key: 'notes', kind: 'input' },
      { key: 'email', kind: 'enrichment', provider: 'p', inputs: { n: { column: 'name' } } },
      { key: 'pitch', kind: 'ai', prompt: '{{ name }}', inputs: { name: { column: 'name' } } },
      { key: 'label', kind: 'formula', template: '{{ name }}!' },
      { key: 'city', kind: 'extract', source: 'email', path: 'city' },
      { key: 'actions', type: 'buttons', buttons: [] },
    ],
    providerIds: new Set(['p']),
  });
  expect(columns.filter(isEnrichmentInputColumn).map((column) => column.key)).toEqual([
    'name',
    'notes',
    'email',
    'pitch',
  ]);
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
  expect(
    validateDraft({ draft: { ...formula, template: '{{ name }}!' }, provider: null, inputKeys })
  ).toBe(null);
  expect(
    validateDraft({
      draft: { ...formula, template: '{% if a %}x{% endif %}' },
      provider: null,
      inputKeys,
    })
  ).toContain('template tags ({% %})');
  expect(
    validateDraft({
      draft: { ...formula, template: '{{ name | upper }}' },
      provider: null,
      inputKeys,
    })
  ).toBe('Only {{ column }} placeholders are supported: "{{ name | upper }}" is an expression.');
  const ai = { ...createDraft({ kind: 'ai' }), title: 'Pitch' };
  expect(
    validateDraft({ draft: { ...ai, prompt: 'Hi {# x #}' }, provider: null, inputKeys })
  ).toContain('comments ({# #})');
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
    outputOptions: [{ value: 'A', color: 'blue' }],
  };
  expect(buildColumnConfig({ draft, key: 'tier' }).output).toEqual({ type: 'text' });
  expect(buildColumnConfig({ draft: { ...draft, type: 'tag' }, key: 'tier' }).output).toEqual({
    type: 'tag',
    options: [{ value: 'A', color: 'blue' }],
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
