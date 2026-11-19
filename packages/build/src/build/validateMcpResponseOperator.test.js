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

import { expect, test } from 'vitest';

import countOperators from '../utils/countOperators.js';
import testContext from '../test-utils/testContext.js';
import validateMcpResponseOperator from './validateMcpResponseOperator.js';

function setup() {
  const context = testContext();
  context.errors = [];
  context.mcpViewConfig = { viewPages: [], viewEndpoints: [] };
  const view = {
    pageId: 'task',
    pathParams: { space: { _response: 'space.key' } },
    urlQuery: { ref: { '_response.key': 'ref', '~k': 'query-key' } },
  };
  countOperators(view, { counter: context.typeCounters.operators.server });
  const components = { mcp: { endpoints: [{ id: 'open_task', view }, { id: 'list_tasks' }] } };
  return { components, context };
}

test('validateMcpResponseOperator accepts _response in view pathParams and urlQuery', () => {
  const { components, context } = setup();
  validateMcpResponseOperator({ components, context });
  expect(context.errors).toEqual([]);
});

test('validateMcpResponseOperator refuses _response in an endpoint routine', () => {
  const { components, context } = setup();
  const step = { properties: { value: { _response: 'id', '~k': 'step-key' } } };
  countOperators(step, { counter: context.typeCounters.operators.server });
  validateMcpResponseOperator({ components, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    '_response can only be used in the "pathParams" and "urlQuery" of an MCP endpoint "view".',
  ]);
  expect(context.errors[0].configKey).toBe('step-key');
});

test('validateMcpResponseOperator refuses _response on a web page and on a mobile page', () => {
  const { components, context } = setup();
  countOperators(
    { properties: { title: { _response: 'title', '~k': 'web-key' } } },
    { counter: context.typeCounters.operators.client }
  );
  countOperators(
    { properties: { title: { _response: 'title', '~k': 'mobile-key' } } },
    { counter: context.typeCountersMobile.operators.client }
  );
  validateMcpResponseOperator({ components, context });
  expect(context.errors.map((error) => error.configKey)).toEqual(['web-key', 'mobile-key']);
});

test('validateMcpResponseOperator refuses _response elsewhere in a view', () => {
  const { components, context } = setup();
  components.mcp.endpoints[1].annotations = { title: { _response: 'title', '~k': 'title-key' } };
  countOperators(components.mcp.endpoints[1].annotations, {
    counter: context.typeCounters.operators.server,
  });
  validateMcpResponseOperator({ components, context });
  expect(context.errors.map((error) => error.configKey)).toEqual(['title-key']);
});
