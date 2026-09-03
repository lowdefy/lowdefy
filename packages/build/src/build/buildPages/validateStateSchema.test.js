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

import { jest } from '@jest/globals';

import { ConfigError } from '@lowdefy/errors';

import validateStateSchema from './validateStateSchema.js';
import testContext from '../../test-utils/testContext.js';

const blockMetas = {
  TextInput: { category: 'input' },
  Selector: { category: 'input-container' },
  List: { category: 'list' },
  Paragraph: { category: 'display' },
  Button: { category: 'display' },
};

const stateSchema = {
  'data.address': {
    type: 'object',
    properties: { formatted_address: { type: 'string' } },
    required: ['formatted_address'],
  },
  'data.status': { enum: ['draft', 'submitted', 'approved'] },
  evidence_ids: { type: 'array', items: { type: 'string' } },
};

function run(page, { keyMap } = {}) {
  const context = testContext({ blockMetas });
  context.errors = [];
  if (keyMap) context.keyMap = keyMap;
  validateStateSchema({ page, context });
  return context.errors;
}

test('validateStateSchema does nothing when the page declares no contract', () => {
  const errors = run({
    pageId: 'p',
    blocks: [
      { blockId: 'anything', type: 'TextInput', properties: { title: { _state: 'other' } } },
    ],
  });
  expect(errors).toEqual([]);
});

test('validateStateSchema accepts a nested _state, an input block id, a SetState key and items navigation', () => {
  const errors = run({
    pageId: 'p',
    stateSchema,
    blocks: [
      { blockId: 'data.address.formatted_address', type: 'TextInput' },
      {
        blockId: 'title',
        type: 'Paragraph',
        properties: { content: { _state: 'data.address.formatted_address' } },
      },
      {
        blockId: 'first',
        type: 'Paragraph',
        properties: { content: { _state: 'evidence_ids[0]' } },
      },
      {
        blockId: 'evidence_ids',
        type: 'List',
        blocks: [{ blockId: 'evidence_ids.$', type: 'TextInput' }],
      },
      {
        blockId: 'save',
        type: 'Button',
        events: { onClick: [{ type: 'SetState', params: { 'data.status': 'submitted' } }] },
      },
    ],
  });
  expect(errors).toEqual([]);
});

test('validateStateSchema errors on a mistyped nested path with a suggestion and the state-schema slug', () => {
  const errors = run({
    pageId: 'answer-detail',
    stateSchema,
    blocks: [
      {
        blockId: 'title',
        type: 'Paragraph',
        properties: { content: { _state: 'data.address.formated_address', '~k': 'ref-key' } },
      },
    ],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toBeInstanceOf(ConfigError);
  expect(errors[0].message).toEqual(
    'Page "answer-detail" declares a state contract and "data.address.formated_address" is not part of it. Declared paths: data.address, data.status, evidence_ids. Did you mean "data.address.formatted_address"?'
  );
  expect(errors[0].configKey).toEqual('ref-key');
  expect(errors[0].checkSlug).toEqual('state-schema');
});

test('validateStateSchema errors on an undeclared input block id and an undeclared SetState key', () => {
  const errors = run({
    pageId: 'p',
    stateSchema,
    blocks: [
      { blockId: 'notes', type: 'TextInput', '~k': 'b1' },
      { blockId: 'label', type: 'Paragraph' },
      {
        blockId: 'save',
        type: 'Button',
        events: { onClick: [{ type: 'SetState', params: { flag: true }, '~k': 'a1' }] },
      },
    ],
  });
  expect(errors.map((e) => [e.configKey, e.message])).toEqual([
    [
      'b1',
      'Page "p" declares a state contract and "notes" is not part of it. Declared paths: data.address, data.status, evidence_ids.',
    ],
    [
      'a1',
      'Page "p" declares a state contract and "flag" is not part of it. Declared paths: data.address, data.status, evidence_ids.',
    ],
  ]);
});

test('validateStateSchema errors on a path below a scalar and on a non-index below an array', () => {
  const errors = run({
    pageId: 'p',
    stateSchema,
    blocks: [
      { blockId: 'a', type: 'Paragraph', properties: { content: { _state: 'data.status.code' } } },
      {
        blockId: 'b',
        type: 'Paragraph',
        properties: { content: { _state: 'evidence_ids.first' } },
      },
    ],
  });
  expect(errors.map((e) => e.message)).toEqual([
    'Page "p" declares a state contract and "data.status.code" is not part of it. Declared paths: data.address, data.status, evidence_ids.',
    'Page "p" declares a state contract and "evidence_ids.first" is not part of it. Declared paths: data.address, data.status, evidence_ids.',
  ]);
});

test('validateStateSchema errors when a fragment is not a compilable JSON schema', () => {
  const errors = run({
    pageId: 'p',
    stateSchema: { 'data.status': { type: 'strng', '~k': 'frag-key' } },
    blocks: [],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toMatch(
    /^Page "p" state contract for "data.status" is not a valid JSON schema: .+\.$/
  );
  expect(errors[0].configKey).toEqual('frag-key');
  expect(errors[0].checkSlug).toEqual('state-schema');
});

test('validateStateSchema is suppressed by ~ignoreBuildChecks: [state-schema]', () => {
  const keyMap = {
    'ref-key': { '~ignoreBuildChecks': ['state-schema'] },
  };
  const errors = run(
    {
      pageId: 'p',
      stateSchema,
      blocks: [
        {
          blockId: 'title',
          type: 'Paragraph',
          properties: { content: { _state: 'nope', '~k': 'ref-key' } },
        },
      ],
    },
    { keyMap }
  );
  expect(errors).toEqual([]);
});

test('validateStateSchema checks the id of an input-container block against the contract', () => {
  const errors = run({
    pageId: 'p',
    stateSchema,
    blocks: [{ blockId: 'undeclared_selector', type: 'Selector' }],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain(
    'Page "p" declares a state contract and "undeclared_selector" is not part of it.'
  );
});
