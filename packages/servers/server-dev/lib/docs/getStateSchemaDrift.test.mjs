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

import getStateSchemaDrift from './getStateSchemaDrift.js';

const stateSchema = {
  'data.address': {
    type: 'object',
    properties: { formatted_address: { type: 'string' } },
    required: ['formatted_address'],
  },
  'data.status': { enum: ['draft', 'submitted'] },
};

test('getStateSchemaDrift returns an empty array for conforming state', () => {
  const state = { data: { address: { formatted_address: '1 Main St' }, status: 'draft' } };
  expect(getStateSchemaDrift({ stateSchema, state })).toEqual([]);
});

test('getStateSchemaDrift reports each violation with path, message, declared fragment and received value', () => {
  const state = { data: { address: {}, status: 'nope' } };
  expect(getStateSchemaDrift({ stateSchema, state })).toEqual([
    {
      path: 'data.address.formatted_address',
      message: "must have required property 'formatted_address'",
      declared: { type: 'string' },
      received: undefined,
    },
    {
      path: 'data.status',
      message: 'must be equal to one of the allowed values',
      declared: { enum: ['draft', 'submitted'] },
      received: 'nope',
    },
  ]);
});
