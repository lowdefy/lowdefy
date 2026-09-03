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

import checkValidateActionSchemas from './checkValidateActionSchemas.js';
import testContext from '../../test-utils/testContext.js';

const stateSchema = {
  'data.address': { type: 'object', properties: { formatted_address: { type: 'string' } } },
  count: { type: 'number' },
};

function page({ params, stateSchema: declared }) {
  return {
    pageId: 'p',
    ...(declared ? { stateSchema: declared } : {}),
    blocks: [
      {
        blockId: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'validate', type: 'Validate', params, '~k': 'k_validate' }],
        },
      },
    ],
  };
}

function run(config) {
  const context = testContext();
  context.errors = [];
  checkValidateActionSchemas({ page: config, context });
  return context.errors;
}

test('checkValidateActionSchemas errors when the page declares no state contract', () => {
  const errors = run(page({ params: { schema: true } }));
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toBe(
    'Action "validate" validates the state contract of page "p", which declares no "state".'
  );
  expect(errors[0]).toMatchObject({ configKey: 'k_validate', checkSlug: 'state-schema' });
});

test('checkValidateActionSchemas accepts schema: true when the page declares a contract', () => {
  expect(run(page({ params: { schema: true }, stateSchema }))).toEqual([]);
});

test('checkValidateActionSchemas accepts a declared path and suggests a near miss', () => {
  expect(run(page({ params: { schema: 'data.address' }, stateSchema }))).toEqual([]);
  const errors = run(page({ params: { schema: 'data.adress' }, stateSchema }));
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toBe(
    'Action "validate" validates "data.adress", which is not part of the state contract of page "p". Declared paths: data.address, count. Did you mean "data.address"?'
  );
});

test('checkValidateActionSchemas ignores a Validate action with no schema param', () => {
  expect(run(page({ params: { blockIds: ['count'] }, stateSchema }))).toEqual([]);
  expect(run(page({ params: { blockIds: ['count'] } }))).toEqual([]);
});
