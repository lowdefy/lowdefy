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

const pinnedOrganization = {
  policy: 'pinned',
  pinned: { id: 'org_pinned', slug: 'default', name: 'Default' },
};

// The floor's only database reads: the caller's member row, the target's member
// row, and the organization named by a slug. The stub answers them from row
// arrays so a test states membership rather than scripting calls.
function createAdapter({ members = [], organizations = [] } = {}) {
  const findOne = jest.fn(async ({ model, where }) => {
    const clause = (field) => where.find((entry) => entry.field === field)?.value;
    if (model === 'member') {
      return (
        members.find(
          (row) =>
            row.userId === clause('userId') && row.organizationId === clause('organizationId')
        ) ?? null
      );
    }
    if (model === 'organization') {
      return organizations.find((row) => row.slug === clause('slug')) ?? null;
    }
    return null;
  });
  return { findOne };
}

// The default step is org-scoped and needs member:update, and the default caller
// is an admin of the pinned organization - the arrangement that passes.
function createStepFn(authority = { scope: 'org', permissions: { member: ['update'] } }) {
  const stepFn = jest.fn().mockResolvedValue({ ok: true });
  stepFn.meta = { authority };
  return stepFn;
}

function createTestContext({
  adapter,
  members = [{ userId: 'user_1', organizationId: 'org_pinned', role: 'admin' }],
  organization = pinnedOrganization,
  organizations = [],
  steps,
  user,
} = {}) {
  const stepAdapter = adapter ?? createAdapter({ members, organizations });
  const context = testContext({
    auth: { $context: Promise.resolve({ adapter: stepAdapter }) },
    logger,
    operators,
    steps,
    user: user === undefined ? { id: 'user_1' } : user,
  });
  // testContext has no organization field of its own - set it directly so
  // tests can opt into a retained organization binding.
  context.organization = organization;
  context.evaluateOperators = createEvaluateOperators(context);
  return { adapter: stepAdapter, context };
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
  const stepFn = createStepFn();
  stepFn.mockResolvedValue({ apiKey: 'key_1' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { name: 'ci key' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.run_step).toEqual({ apiKey: 'key_1' });
  expect(stepFn).toHaveBeenCalledTimes(1);
  expect(stepFn).toHaveBeenCalledWith({
    acting: { system: false, user: { id: 'user_1' } },
    auth: context.auth,
    mcp: null,
    organization: pinnedOrganization,
    organizationId: 'org_pinned',
    properties: { name: 'ci key' },
  });
});

test('AuthStep step does not pass a userAdminRole key to the step function', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(Object.keys(stepFn.mock.calls[0][0]).sort()).toEqual([
    'acting',
    'auth',
    'mcp',
    'organization',
    'organizationId',
    'properties',
  ]);
});

test('AuthStep step passes context.organization through to the step function', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(stepFn.mock.calls[0][0].organization).toBe(pinnedOrganization);
});

test('AuthStep step passes null organization and null organizationId for a system-scoped step', async () => {
  const stepFn = createStepFn({ scope: 'system' });
  const { context } = createTestContext({
    organization: null,
    steps: { TestAuthStep: stepFn },
    user: null,
  });
  context.system = true;
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(stepFn.mock.calls[0][0].organization).toBeNull();
  expect(stepFn.mock.calls[0][0].organizationId).toBeNull();
});

test('AuthStep step runs a caller-scoped step for a caller with no org authority and passes the MCP token outcome', async () => {
  const stepFn = createStepFn({ scope: 'caller' });
  // No member row anywhere - a caller-scoped step needs none.
  const { context } = createTestContext({ members: [], steps: { TestAuthStep: stepFn } });
  context.mcpAuth = {
    clientId: 'client_1',
    organizationId: 'org_1',
    tokenStatus: 'valid',
    parseableJwt: true,
    grantedScopes: ['mcp:read'],
  };
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).not.toBe('error');
  expect(stepFn.mock.calls[0][0]).toMatchObject({
    acting: { system: false, user: { id: 'user_1' } },
    mcp: context.mcpAuth,
    organizationId: null,
  });
});

test('AuthStep step passes null mcp to a step for a caller that did not arrive over MCP', async () => {
  const stepFn = createStepFn({ scope: 'caller' });
  const { context } = createTestContext({ members: [], steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(stepFn.mock.calls[0][0].mcp).toBeNull();
});

test('AuthStep step refuses a caller-scoped step running as the system', async () => {
  const stepFn = createStepFn({ scope: 'caller' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn }, user: null });
  context.system = true;
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" acts on the caller\'s own records and cannot run as the system. Remove system: true, or run it from a caller\'s routine.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when the auth step type is not defined', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ type: 'MissingStep' }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Auth step type "MissingStep" is not defined.');
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when there is no authenticated caller and system is not set', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn }, user: null });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" requires an authenticated caller. Set system: true on the step for caller-less system routines.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when the caller is a hook system context with no id and system is not set', async () => {
  const stepFn = createStepFn();
  // Hook routines run with context.user = {} - no id, so no resolved caller.
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn }, user: {} });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('requires an authenticated caller');
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status when auth is not configured on the context', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  context.auth = null;
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" requires the auth engine - auth is not configured (or dev.mockUser is active).'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step returns error status and stores the handled error when the step function throws', async () => {
  const stepFn = createStepFn();
  stepFn.mockRejectedValue(new Error('Provider unreachable.'));
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Provider unreachable.');
  expect(res.error.handled).toBe(true);
});

test('AuthStep step stores the resolved result under the step id in routineContext.steps', async () => {
  const stepFn = createStepFn();
  stepFn.mockResolvedValue({ organizationId: 'org_1' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStepRoutine({ stepId: 'create_org', id: 'auth:test_endpoint:create_org' }),
  });

  expect(routineContext.steps).toEqual({ create_org: { organizationId: 'org_1' } });
});

test('AuthStep step evaluates properties operators against the routine payload', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext({ payload: { targetEmail: 'a@b.com' } });

  await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { email: { _payload: 'targetEmail' } } }),
  });

  expect(stepFn.mock.calls[0][0].properties).toEqual({ email: 'a@b.com' });
});

test('AuthStep step refuses a step that declares no meta.authority', async () => {
  const stepFn = jest.fn().mockResolvedValue({ ok: true });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" of type "TestAuthStep" declares no "meta.authority" - every auth step must declare the authority it requires.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step refuses a step whose meta carries no authority key', async () => {
  const stepFn = jest.fn().mockResolvedValue({ ok: true });
  stepFn.meta = { checkRead: true };
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('declares no "meta.authority"');
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step runs a system-scoped step in a run-level system context', async () => {
  const stepFn = createStepFn({ scope: 'system' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn }, user: null });
  context.system = true;
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
  expect(stepFn.mock.calls[0][0].acting).toEqual({ system: true, user: null });
});

test('AuthStep step runs a system-scoped step marked system: true even with a caller present', async () => {
  const stepFn = createStepFn({ scope: 'system' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ system: true }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(stepFn.mock.calls[0][0].acting).toEqual({ system: true, user: null });
});

test('AuthStep step refuses a system-scoped step in a caller-bearing run', async () => {
  const stepFn = createStepFn({ scope: 'system' });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" may only run in a caller-less system routine. Set system: true on the step, or run it from a system context.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step runs an org-scoped step when the caller is an admin of the resolved organization', async () => {
  const stepFn = createStepFn();
  const { adapter, context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_pinned' },
    ],
  });
});

test('AuthStep step refuses an org-scoped step when the caller holds only the member role', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.name).toBe('AuthorizationError');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold member: [update] in organization "org_pinned".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step runs an organization:update step when the caller is an admin of the resolved organization', async () => {
  const stepFn = createStepFn({ scope: 'org', permissions: { organization: ['update'] } });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
  expect(stepFn).toHaveBeenCalledTimes(1);
});

test('AuthStep step refuses an organization:update step when the caller holds only the member role', async () => {
  const stepFn = createStepFn({ scope: 'org', permissions: { organization: ['update'] } });
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold organization: [update] in organization "org_pinned".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step refuses an org-scoped step when the caller holds no member row in the resolved organization', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ members: [], steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold member: [update] in organization "org_pinned".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step names every requested resource and action in the refusal', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['ban', 'delete'], session: ['revoke'] },
  });
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold user: [ban, delete], session: [revoke] in organization "org_pinned".'
  );
});

test('AuthStep step authorizes an explicit properties.organizationId instead of the pinned default', async () => {
  const stepFn = createStepFn();
  const { adapter, context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_customer', role: 'admin' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { organizationId: 'org_customer' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_customer' },
    ],
  });
  expect(stepFn.mock.calls[0][0].organizationId).toBe('org_customer');
});

test('AuthStep step refuses when the caller administers the pinned organization but not the explicit one', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({
    members: [
      { userId: 'user_1', organizationId: 'org_pinned', role: 'admin' },
      { userId: 'user_1', organizationId: 'org_customer', role: 'member' },
    ],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { organizationId: 'org_customer' } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold member: [update] in organization "org_customer".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step resolves properties.organizationSlug to an id with one organization read', async () => {
  const stepFn = createStepFn();
  const { adapter, context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_customer', role: 'admin' }],
    organizations: [{ id: 'org_customer', slug: 'customers' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { organizationSlug: 'customers' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  const organizationReads = adapter.findOne.mock.calls.filter(
    ([{ model }]) => model === 'organization'
  );
  expect(organizationReads).toEqual([
    [{ model: 'organization', where: [{ field: 'slug', value: 'customers' }] }],
  ]);
  expect(stepFn.mock.calls[0][0].organizationId).toBe('org_customer');
});

test('AuthStep step throws naming the slug when no organization has it', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({ organizations: [], steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { organizationSlug: 'nope' } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Auth step "run_step" found no organization with slug "nope".');
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step throws under the tenant organizations policy when organizationId is omitted', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({
    organization: { policy: 'tenant', pinned: null },
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step throws when the pinned organization is not resolved', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({
    organization: { policy: 'pinned', pinned: null },
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" could not default "organizationId" - the pinned organization is not resolved. Set organizationId on the step properties, or check that auth organizations are configured and the database is reachable.'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step refuses a targetUser step when the target holds no member row in the resolved organization', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['ban'] },
    targetUser: 'userId',
  });
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'admin' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { userId: 'user_outsider' } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.name).toBe('AuthorizationError');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - user "user_outsider" is not a member of organization "org_pinned".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step runs a targetUser step when the target holds a member row in the resolved organization', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['ban'] },
    targetUser: 'userId',
  });
  const { adapter, context } = createTestContext({
    members: [
      { userId: 'user_1', organizationId: 'org_pinned', role: 'admin' },
      { userId: 'user_2', organizationId: 'org_pinned', role: 'member' },
    ],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { userId: 'user_2' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_2' },
      { field: 'organizationId', value: 'org_pinned' },
    ],
  });
});

test('AuthStep step leaves an absent targetUser property to the step to reject', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['ban'] },
    targetUser: 'userId',
  });
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
  expect(stepFn).toHaveBeenCalledTimes(1);
});

test('AuthStep step lets a self-targeting caller skip both the permission and the membership check', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['update'] },
    targetUser: 'userId',
    selfTargetExempt: 'userId',
  });
  // No member row anywhere: the exemption is evaluated before the scope check,
  // so a person saves their own profile without any org authority.
  const { adapter, context } = createTestContext({ members: [], steps: { TestAuthStep: stepFn } });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { userId: 'user_1' } }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).not.toHaveBeenCalled();
  expect(stepFn.mock.calls[0][0].organizationId).toBe('org_pinned');
});

test('AuthStep step refuses a self-target-exempt step targeting another user without the authority', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['update'] },
    targetUser: 'userId',
    selfTargetExempt: 'userId',
  });
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ properties: { userId: 'user_2' } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe(
    'Auth step "run_step" refused - the caller does not hold user: [update] in organization "org_pinned".'
  );
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step refuses a self-target-exempt step with no target property without the authority', async () => {
  const stepFn = createStepFn({
    scope: 'org',
    permissions: { user: ['update'] },
    targetUser: 'userId',
    selfTargetExempt: 'userId',
  });
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('does not hold user: [update]');
  expect(stepFn).not.toHaveBeenCalled();
});

test('AuthStep step skips the authorization checks for an org-scoped step in a system context', async () => {
  const stepFn = createStepFn();
  const { adapter, context } = createTestContext({
    members: [],
    steps: { TestAuthStep: stepFn },
    user: null,
  });
  context.system = true;
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).not.toHaveBeenCalled();
  // The organization is still resolved - a system-run org step writes into an
  // organization like any other.
  expect(stepFn.mock.calls[0][0].organizationId).toBe('org_pinned');
});

test('AuthStep step skips the authorization checks for an org-scoped step marked system: true', async () => {
  const stepFn = createStepFn();
  const { adapter, context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStepRoutine({ system: true }),
  });

  expect(res).toEqual({ status: 'continue' });
  expect(adapter.findOne).not.toHaveBeenCalled();
  expect(stepFn.mock.calls[0][0].acting).toEqual({ system: true, user: null });
});

test('AuthStep step passes the session caller through to acting.user', async () => {
  const stepFn = createStepFn();
  const sessionUser = { id: 'user_1', roles: ['editor'], activeOrganizationId: 'org_pinned' };
  const { context } = createTestContext({ steps: { TestAuthStep: stepFn }, user: sessionUser });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(stepFn.mock.calls[0][0].acting).toEqual({ system: false, user: sessionUser });
});

test('AuthStep step authorizes an owner through the comma-separated member role', async () => {
  const stepFn = createStepFn();
  const { context } = createTestContext({
    members: [{ userId: 'user_1', organizationId: 'org_pinned', role: 'member,owner' }],
    steps: { TestAuthStep: stepFn },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, { routine: createStepRoutine() });

  expect(res).toEqual({ status: 'continue' });
});
