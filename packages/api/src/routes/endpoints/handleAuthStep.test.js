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

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockStepFn = jest.fn();

function createTestContext({ auth = {}, organization, steps, user } = {}) {
  const context = testContext({
    auth,
    logger,
    operators,
    steps: steps === undefined ? { TestAuthStep: mockStepFn } : steps,
    user: user === undefined ? { id: 'user_1', roles: ['member'] } : user,
  });
  // testContext has no organization field of its own - set it directly so
  // tests can opt into a retained organization binding.
  context.organization = organization;
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext(overrides = {}) {
  return {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
    ...overrides,
  };
}

function createStepRoutine(overrides = {}) {
  return {
    id: 'auth:test_endpoint:run_step',
    type: 'TestAuthStep',
    stepId: 'run_step',
    endpointId: 'test_endpoint',
    properties: {},
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('AuthStep step runs the step function and stores the result in steps', async () => {
  mockStepFn.mockResolvedValue({ apiKey: 'key_1' });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { name: 'ci key' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.run_step).toEqual({ apiKey: 'key_1' });
  expect(mockStepFn).toHaveBeenCalledTimes(1);
  expect(mockStepFn).toHaveBeenCalledWith({
    acting: { system: false, user: { id: 'user_1', roles: ['member'] } },
    auth: context.auth,
    organization: null,
    properties: { name: 'ci key' },
  });
});

test('AuthStep step passes context.organization through to the step function', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const organization = {
    policy: 'pinned',
    pinned: { id: 'org_1', slug: 'default', name: 'Default' },
  };
  const context = createTestContext({ organization });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(mockStepFn.mock.calls[0][0].organization).toBe(organization);
});

test('AuthStep step passes null organization to the step function when context.organization is not set', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(mockStepFn.mock.calls[0][0].organization).toBeNull();
});

test('AuthStep step returns error status when the auth step type is not defined', async () => {
  mockStepFn.mockResolvedValue({});
  const context = createTestContext();
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ type: 'MissingStep' }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Auth step type "MissingStep" is not defined.');
  expect(mockStepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when there is no authenticated caller and system is not set', async () => {
  mockStepFn.mockResolvedValue({});
  const context = createTestContext({ user: null });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine(),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" requires an authenticated caller. Set system: true on the step for caller-less system routines.'
  );
  expect(mockStepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when the caller is a hook system context with no id and system is not set', async () => {
  mockStepFn.mockResolvedValue({});
  // Hook routines run with context.user = {} - no id, so no resolved caller.
  const context = createTestContext({ user: {} });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine(),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('requires an authenticated caller');
  expect(mockStepFn).not.toHaveBeenCalled();
});

test('AuthStep step runs caller-less as the system when step.system is true, even with a caller present', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const context = createTestContext({ user: { id: 'user_1', roles: ['member'] } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ system: true }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(mockStepFn.mock.calls[0][0].acting).toEqual({ system: true, user: null });
});

test('AuthStep step allows step.system true to run caller-less with no caller at all', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const context = createTestContext({ user: {} });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ system: true }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(mockStepFn.mock.calls[0][0].acting).toEqual({ system: true, user: null });
});

test('AuthStep step passes the session caller through to acting.user', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const sessionUser = { id: 'user_2', roles: ['admin'], activeOrganizationId: 'org_1' };
  const context = createTestContext({ user: sessionUser });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(mockStepFn.mock.calls[0][0].acting).toEqual({ system: false, user: sessionUser });
});

test('AuthStep step evaluates properties operators against the routine payload', async () => {
  mockStepFn.mockResolvedValue({ ok: true });
  const context = createTestContext();
  const routineContext = createRoutineContext({ payload: { targetEmail: 'a@b.com' } });

  await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { email: { _payload: 'targetEmail' } } }),
  });

  expect(mockStepFn.mock.calls[0][0].properties).toEqual({ email: 'a@b.com' });
});

test('AuthStep step returns error status when auth is not configured on the context', async () => {
  mockStepFn.mockResolvedValue({});
  const context = createTestContext({ auth: null });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine(),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" requires the auth engine - auth is not configured (or dev.mockUser is active).'
  );
  expect(mockStepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status and stores the handled error when the step function throws', async () => {
  mockStepFn.mockRejectedValue(new Error('Provider unreachable.'));
  const context = createTestContext();
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine(),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Provider unreachable.');
  expect(res.error.handled).toBe(true);
});

test('AuthStep step stores the resolved result under the step id in routineContext.steps', async () => {
  mockStepFn.mockResolvedValue({ organizationId: 'org_1' });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStepRoutine({ stepId: 'create_org', id: 'auth:test_endpoint:create_org' }),
  });

  expect(routineContext.steps).toEqual({ create_org: { organizationId: 'org_1' } });
});
