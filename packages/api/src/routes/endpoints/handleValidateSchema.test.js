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

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createTestContext() {
  const context = testContext({
    operators: operatorsServer,
    logger,
    session: { user: { id: 'user_1' } },
  });
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext(overrides = {}) {
  return {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('valid data continues and records valid step result', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  const step = {
    id: 'validate:endpointId:check_input',
    stepId: 'check_input',
    type: 'ValidateSchema',
    properties: {
      schema: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      data: { name: 'Ada' },
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps).toEqual({
    check_input: { valid: true, errors: [] },
  });
  expect(logger.error).not.toHaveBeenCalled();
});

test('invalid data throws by default', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  const step = {
    id: 'validate:endpointId:check_input',
    stepId: 'check_input',
    type: 'ValidateSchema',
    properties: {
      schema: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      data: {},
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });

  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(Error);
  expect(res.error.message).toMatch(/ValidateSchema step "check_input" failed/);
  expect(Array.isArray(res.error.cause)).toBe(true);
  expect(res.error.cause.length).toBeGreaterThan(0);
  expect(routineContext.steps.check_input.valid).toBe(false);
  expect(routineContext.steps.check_input.errors.length).toBeGreaterThan(0);
  expect(logger.error).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'error_validate_schema',
      stepId: 'check_input',
    })
  );
});

test('invalid data with throwOnInvalid:false continues and stores errors', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  const step = {
    id: 'validate:endpointId:check_input',
    stepId: 'check_input',
    type: 'ValidateSchema',
    properties: {
      schema: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      data: { name: 42 },
      throwOnInvalid: false,
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.check_input.valid).toBe(false);
  expect(routineContext.steps.check_input.errors.length).toBeGreaterThan(0);
  expect(logger.error).not.toHaveBeenCalled();
});

test('ajv-formats email format is registered and enforced', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  const step = {
    id: 'validate:endpointId:check_email',
    stepId: 'check_email',
    type: 'ValidateSchema',
    properties: {
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      },
      data: { email: 'not-an-email' },
      throwOnInvalid: false,
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.check_email.valid).toBe(false);
  expect(routineContext.steps.check_email.errors[0]).toEqual(
    expect.objectContaining({ keyword: 'format', params: expect.objectContaining({ format: 'email' }) })
  );
});

test('schema and data resolve through operators', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext({
    payload: { user: { name: 'Ada', age: 30 } },
  });
  const step = {
    id: 'validate:endpointId:check_payload',
    stepId: 'check_payload',
    type: 'ValidateSchema',
    properties: {
      schema: {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0 },
        },
      },
      data: { _payload: 'user' },
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.check_payload).toEqual({ valid: true, errors: [] });
});
