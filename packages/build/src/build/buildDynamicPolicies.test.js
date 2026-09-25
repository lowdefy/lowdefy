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

import buildDynamicPolicies from './buildDynamicPolicies.js';
import testContext from '../test-utils/testContext.js';

function createContext() {
  const warnings = [];
  return {
    ...testContext(),
    handleWarning: (warning) => warnings.push(warning),
    warnings,
    errors: [],
    keyMap: {},
    typesMap: {
      blocks: { Box: {}, Dynamic: {}, TextInput: {} },
      actions: { SetState: {} },
      operators: { client: { _state: {}, _operator: {}, _string: {} } },
    },
  };
}

function build(dynamicPolicies) {
  const context = createContext();
  buildDynamicPolicies({ components: { dynamicPolicies }, context });
  return context;
}

test('buildDynamicPolicies applies defaults to a policy', () => {
  const context = build([{ id: 'form', blocks: ['Box'] }]);
  expect(context.errors).toEqual([]);
  expect(context.dynamicPolicies.form).toEqual({
    id: 'form',
    blocks: ['Box'],
    actions: [],
    operators: [],
    endpoints: [],
    requests: [],
    links: { pages: [], origins: [] },
    state: null,
    html: false,
    limits: { depth: 10, blocks: 500, bytes: 262144, actionsPerEvent: 20 },
  });
});

test('buildDynamicPolicies keeps declared lists and limits', () => {
  const context = build([
    {
      id: 'form',
      blocks: ['Box', 'TextInput'],
      actions: ['SetState'],
      operators: ['_state'],
      links: { pages: ['thanks'], origins: ['https://example.com'] },
      state: 'form',
      html: true,
      limits: { depth: 4 },
    },
  ]);
  expect(context.errors).toEqual([]);
  expect(context.dynamicPolicies.form.limits.depth).toBe(4);
  expect(context.dynamicPolicies.form.links.origins).toEqual(['https://example.com']);
  expect(context.dynamicPolicies.form.html).toBe(true);
});

test('buildDynamicPolicies writes an empty map when no policies are declared', () => {
  const context = build(undefined);
  expect(context.dynamicPolicies).toEqual({});
});

test.each([
  [
    [
      { id: 'a', blocks: ['Box'] },
      { id: 'a', blocks: ['Box'] },
    ],
    'Duplicate dynamic policy id "a".',
  ],
  [[{ blocks: ['Box'] }], 'Dynamic policy "id" should be a string.'],
  [
    [{ id: 'a', blocks: ['Nope'] }],
    'Dynamic policy "a" "blocks" lists "Nope", which is not an installed type.',
  ],
  [
    [{ id: 'a', blocks: ['Box'], actions: ['Logout'] }],
    'Dynamic policy "a" "actions" lists "Logout", which is not an installed type.',
  ],
  [
    [{ id: 'a', blocks: ['Box'], operators: ['_operator'] }],
    'Dynamic policy "a" cannot list "_operator"',
  ],
  [[{ id: 'a', blocks: ['Box'], operators: ['_string.concat'] }], 'List operator base names'],
  [
    [{ id: 'a', blocks: ['Box'], links: { origins: ['https://example.com/path'] } }],
    'Origins are a scheme, host and optional port',
  ],
  [[{ id: 'a', blocks: ['Box'], limits: { depth: 0 } }], '"limits.depth" should be one of'],
  [[{ id: 'a', blocks: 'Box' }], 'Dynamic policy "a" "blocks" should be an array of strings.'],
  [[{ id: 'a', blocks: ['Dynamic'] }], 'Dynamic policy "a" cannot list "Dynamic"'],
])('buildDynamicPolicies rejects invalid policy %#', (dynamicPolicies, message) => {
  const context = build(dynamicPolicies);
  expect(context.errors[0].message).toContain(message);
});

test('buildDynamicPolicies warns when a policy without HTML lists string-producing operators', () => {
  const context = build([{ id: 'form', blocks: ['Box'], operators: ['_state', '_string'] }]);
  expect(context.errors).toEqual([]);
  expect(context.warnings[0].message).toContain(
    'Dynamic policy "form" does not allow HTML but lists "_string"'
  );
  expect(
    build([{ id: 'form', blocks: ['Box'], operators: ['_string'], html: true }]).warnings
  ).toEqual([]);
});
