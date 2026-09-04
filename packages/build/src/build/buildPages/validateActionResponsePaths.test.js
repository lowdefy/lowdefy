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

import validateActionResponsePaths from './validateActionResponsePaths.js';

const responseSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } },
    },
    total: { type: 'integer' },
  },
  required: ['results', 'total'],
};

const endpointConfigs = [
  { id: 'endpoint:search', endpointId: 'search', type: 'Api', responseSchema },
  { id: 'endpoint:untyped', endpointId: 'untyped', type: 'Api' },
];

function makePage({ actionsPath, endpointId = 'search', ignore } = {}) {
  return {
    id: 'page:home',
    pageId: 'home',
    type: 'Box',
    ...(ignore ? { '~ignoreBuildChecks': ignore } : {}),
    events: {
      onClick: [
        { id: 'search', type: 'CallAPI', params: { endpointId }, '~k': 'k_action' },
        {
          id: 'store',
          type: 'SetState',
          params: { value: { _actions: actionsPath, '~k': 'k_ref' } },
        },
      ],
    },
  };
}

function makeContext() {
  return { errors: [], keyMap: {} };
}

test('validateActionResponsePaths does nothing when no endpoint declares a responseSchema', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.nope' }),
    endpointConfigs: [{ id: 'endpoint:search', endpointId: 'search', type: 'Api' }],
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths accepts a path that resolves through items and properties', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.results[0].title' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths accepts the object form of the operator', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: { key: 'search.response.total' } }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths reports a mistyped leaf with the response-schema slug and a suggestion', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.totl' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toHaveLength(1);
  const error = context.errors[0];
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toBe(
    '_actions "search.response.totl" reads "totl" from endpoint "search", whose responseSchema does not declare it. Declared: results, total. Did you mean "total"?'
  );
  expect(error.checkSlug).toBe('response-schema');
  expect(error.configKey).toBe('k_ref');
});

test('validateActionResponsePaths reports a nested property the items schema does not declare', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.results[0].name' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('reads "results[0].name" from endpoint "search"');
});

test('validateActionResponsePaths leaves the action record fields alone', () => {
  const context = makeContext();
  ['search.type', 'search.index', 'search.error.message', 'search.response'].forEach(
    (actionsPath) => {
      validateActionResponsePaths({ page: makePage({ actionsPath }), endpointConfigs, context });
    }
  );
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths reports an api record field read through the collapsed envelope', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.success' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('reads "success" from endpoint "search"');
});

test('validateActionResponsePaths skips an operator-valued endpointId', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({
      actionsPath: 'search.response.nope',
      endpointId: { _state: 'which' },
    }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths ignores actions targeting endpoints without a responseSchema', () => {
  const context = makeContext();
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.nope', endpointId: 'untyped' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateActionResponsePaths is suppressed by ~ignoreBuildChecks response-schema', () => {
  const context = makeContext();
  context.keyMap = { k_ref: { '~ignoreBuildChecks': ['response-schema'] } };
  validateActionResponsePaths({
    page: makePage({ actionsPath: 'search.response.totl' }),
    endpointConfigs,
    context,
  });
  expect(context.errors).toEqual([]);
});
