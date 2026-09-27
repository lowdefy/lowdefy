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
import { operatorsServer } from '@lowdefy/operators-js';

const compileCalls = [];
jest.unstable_mockModule('@lowdefy/ajv', async () => {
  const actual = await import('../../../../utils/ajv/src/index.js');
  return {
    ...actual,
    compile: jest.fn((args) => {
      compileCalls.push(args);
      return actual.compile(args);
    }),
  };
});

const { default: createEvaluateOperators } = await import(
  '../../context/createEvaluateOperators.js'
);
const { default: runRoutine } = await import('./runRoutine.js');
const { default: testContext } = await import('../../test/testContext.js');

function createTestContext() {
  const context = testContext({ operators: operatorsServer, user: { id: 'user_1' } });
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function validateStep(schema) {
  return {
    id: 'validate:endpointId:check',
    stepId: 'check',
    type: 'ValidateSchema',
    properties: { schema, data: { _payload: 'data' }, throwOnInvalid: false },
  };
}

async function runStep({ step, payload }) {
  const routineContext = { steps: {}, payload, arrayIndices: [], items: {}, endpointDepth: 0 };
  await runRoutine(createTestContext(), routineContext, { routine: step });
  return routineContext.steps.check;
}

beforeEach(() => {
  compileCalls.length = 0;
});

test('ValidateSchema compiles a schema once across calls', async () => {
  const step = validateStep({ type: 'object', required: ['sku'] });
  expect((await runStep({ step, payload: { data: { sku: 'a' } } })).valid).toBe(true);
  expect((await runStep({ step, payload: { data: {} } })).valid).toBe(false);
  expect(compileCalls).toHaveLength(1);
});

test('ValidateSchema checks each call against the schema its operators build', async () => {
  const step = validateStep({ type: 'object', required: [{ _payload: 'field' }] });
  const data = { name: 'a' };
  expect((await runStep({ step, payload: { field: 'name', data } })).valid).toBe(true);
  expect((await runStep({ step, payload: { field: 'code', data } })).valid).toBe(false);
  expect((await runStep({ step, payload: { field: 'name', data } })).valid).toBe(true);
  expect(compileCalls).toHaveLength(2);
});
