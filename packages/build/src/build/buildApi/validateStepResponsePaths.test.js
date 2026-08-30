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

import { ConfigError } from '@lowdefy/errors';

import buildApi from './buildApi.js';
import testContext from '../../test-utils/testContext.js';

const responseSchema = {
  type: 'object',
  properties: {
    user: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
    count: { type: 'integer' },
  },
};

function makeComponents({ stepPath, endpointId = 'get_user', ignore } = {}) {
  return {
    api: [
      {
        id: 'caller',
        type: 'Api',
        routine: [
          {
            id: 'fetch',
            type: 'CallApi',
            properties: { endpointId },
            '~k': 'k_step',
          },
          {
            ':return': {
              value: {
                _step: stepPath,
                '~k': 'k_ref',
                ...(ignore ? { '~ignoreBuildChecks': ignore } : {}),
              },
            },
          },
        ],
      },
      { id: 'get_user', type: 'InternalApi', responseSchema, routine: { ':return': {} } },
    ],
  };
}

function makeContext() {
  const context = testContext();
  context.errors = [];
  return context;
}

test('validateStepResponsePaths does nothing when the target declares no responseSchema', () => {
  const context = makeContext();
  const components = makeComponents({ stepPath: 'fetch.nope' });
  delete components.api[1].responseSchema;
  buildApi({ components, context });
  expect(context.errors).toEqual([]);
});

test('validateStepResponsePaths accepts a _step path the responseSchema declares', () => {
  const context = makeContext();
  buildApi({ components: makeComponents({ stepPath: 'fetch.user.name' }), context });
  expect(context.errors).toEqual([]);
});

test('validateStepResponsePaths accepts a bare step reference and the object form', () => {
  const context = makeContext();
  buildApi({ components: makeComponents({ stepPath: 'fetch' }), context });
  buildApi({ components: makeComponents({ stepPath: { key: 'fetch.count' } }), context });
  expect(context.errors).toEqual([]);
});

test('validateStepResponsePaths reports an undeclared _step path with slug and suggestion', () => {
  const context = makeContext();
  buildApi({ components: makeComponents({ stepPath: 'fetch.user.nme' }), context });
  expect(context.errors).toHaveLength(1);
  const error = context.errors[0];
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toBe(
    '_step "fetch.user.nme" reads "user.nme" from endpoint "get_user", whose responseSchema does not declare it. Declared: count, user. Did you mean "name"?'
  );
  expect(error.checkSlug).toBe('response-schema');
  expect(error.configKey).toBe('k_ref');
});

test('validateStepResponsePaths skips an operator-valued endpointId', () => {
  const context = makeContext();
  buildApi({
    components: makeComponents({ stepPath: 'fetch.nope', endpointId: { _payload: 'target' } }),
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateStepResponsePaths is suppressed by ~ignoreBuildChecks response-schema', () => {
  const context = makeContext();
  context.keyMap = { k_ref: { '~ignoreBuildChecks': ['response-schema'] } };
  buildApi({ components: makeComponents({ stepPath: 'fetch.nope' }), context });
  expect(context.errors).toEqual([]);
});
