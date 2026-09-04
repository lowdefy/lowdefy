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
import { AuthenticationError, ConfigError } from '@lowdefy/errors';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

// A walled connection type: the request records the tenant verdict the wall
// handed it, which is what a real connection filters and stamps with.
const mockTenantRequest = jest.fn(({ request, tenant }) => ({
  response: request.response ?? null,
  tenant,
}));
mockTenantRequest.schema = {};
mockTenantRequest.meta = { checkRead: false, checkWrite: false };

const connections = {
  TestTenantConnection: {
    schema: {},
    meta: { tenant: true },
    requests: { TenantRequest: mockTenantRequest },
  },
};

const connectionConfig = {
  id: 'connection:app_data',
  type: 'TestTenantConnection',
  connectionId: 'app_data',
  '~k': 'connection.0',
};

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

function createContext({ user = null, endpoints = {}, handleDevNotice } = {}) {
  const readConfigFile = jest.fn((path) => {
    if (path === 'connections/app_data.json') return connectionConfig;
    const match = path.match(/^api\/(.*)\.json$/);
    if (match && endpoints[match[1]]) return endpoints[match[1]];
    return null;
  });
  const context = testContext({
    connections,
    logger,
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile,
    secrets: { SYSTEM_ORG: 'org-secret' },
    system: true,
    user,
  });
  context.endpointId = 'jobs';
  context.evaluateOperators = createEvaluateOperators(context);
  context.handleDevNotice = handleDevNotice;
  return context;
}

function requestStep(stepId, extra = {}) {
  return {
    id: `request:jobs:${stepId}`,
    stepId,
    type: 'TenantRequest',
    connectionId: 'app_data',
    '~k': `step.${stepId}`,
    ...extra,
  };
}

async function run(context, { routine, runAs, payload = {} }) {
  const routineContext = {
    steps: {},
    payload,
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
    runAs,
  };
  const res = await runRoutine(context, routineContext, { routine });
  return { res, routineContext };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('a walled step with no caller organization and no runAs fails closed', async () => {
  const context = createContext();
  const { res } = await run(context, { routine: [requestStep('rows')] });
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(AuthenticationError);
  expect(mockTenantRequest).not.toHaveBeenCalled();
});

test('an endpoint-level runAs reaches every walled step of the routine', async () => {
  const context = createContext();
  const { res } = await run(context, {
    routine: [requestStep('first'), requestStep('second')],
    runAs: { organizationId: 'org-9', configKey: 'endpoint.1', source: 'endpoint' },
  });
  expect(res.status).toBe('continue');
  expect(mockTenantRequest).toHaveBeenCalledTimes(2);
  expect(mockTenantRequest.mock.calls[0][0].tenant).toEqual({
    field: 'organization_id',
    value: 'org-9',
  });
  expect(mockTenantRequest.mock.calls[1][0].tenant).toEqual({
    field: 'organization_id',
    value: 'org-9',
  });
});

test('a step-level runAs overrides the endpoint-level scope for that step only', async () => {
  const context = createContext();
  await run(context, {
    routine: [
      requestStep('first', { runAs: { organizationId: 'org-step' } }),
      requestStep('second'),
    ],
    runAs: { organizationId: 'org-endpoint', configKey: 'endpoint.1', source: 'endpoint' },
  });
  expect(mockTenantRequest.mock.calls[0][0].tenant.value).toBe('org-step');
  expect(mockTenantRequest.mock.calls[1][0].tenant.value).toBe('org-endpoint');
});

test('_step in a step-level runAs reads the previous step result', async () => {
  const context = createContext();
  const { res, routineContext } = await run(context, {
    routine: [
      requestStep('job', {
        tenant: 'none',
        properties: { response: { organization_id: 'org-7' } },
      }),
      requestStep('rows', { runAs: { organizationId: { _step: 'job.response.organization_id' } } }),
    ],
  });
  expect(res.status).toBe('continue');
  expect(routineContext.steps.job.response).toEqual({ organization_id: 'org-7' });
  expect(mockTenantRequest.mock.calls[0][0].tenant).toBe(null);
  expect(mockTenantRequest.mock.calls[1][0].tenant).toEqual({
    field: 'organization_id',
    value: 'org-7',
  });
});

test('runAs may read _secret and _user but never changes context.user', async () => {
  const user = { id: 'user_1', organization_id: 'org-caller', roles: [] };
  const context = createContext({ user });
  await run(context, {
    routine: [
      requestStep('from_secret', { runAs: { organizationId: { _secret: 'SYSTEM_ORG' } } }),
      requestStep('from_user', { runAs: { organizationId: { _user: 'organization_id' } } }),
    ],
  });
  expect(mockTenantRequest.mock.calls[0][0].tenant.value).toBe('org-secret');
  expect(mockTenantRequest.mock.calls[1][0].tenant.value).toBe('org-caller');
  expect(context.user).toBe(user);
});

test('a runAs whose _step path resolves to nothing fails the step with a ConfigError, not an AuthenticationError', async () => {
  const context = createContext();
  const { res } = await run(context, {
    routine: [
      requestStep('job', { tenant: 'none', properties: { response: {} } }),
      requestStep('rows', { runAs: { organizationId: { _step: 'job.response.missing' } } }),
    ],
  });
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(ConfigError);
  expect(res.error.message).toBe(
    'Step "rows" declares "runAs" but "organizationId" evaluated to null. It must be a non-empty organization id string.'
  );
  expect(res.error.configKey).toBe('step.rows');
  expect(mockTenantRequest).toHaveBeenCalledTimes(1);
});

test('the dev notice names the step that ran and the runAs organization', async () => {
  const handleDevNotice = jest.fn();
  const context = createContext({ handleDevNotice });
  await run(context, {
    routine: [requestStep('rows')],
    runAs: { organizationId: 'org-9', configKey: 'endpoint.1', source: 'endpoint' },
  });
  expect(handleDevNotice).toHaveBeenCalledTimes(1);
  expect(handleDevNotice.mock.calls[0][0]).toEqual({
    name: 'RunAsScope',
    level: 'info',
    message: 'Step "rows" ran scoped to organization "org-9" (runAs).',
    configKey: 'step.rows',
    details: {
      connectionId: 'app_data',
      stepId: 'rows',
      field: 'organization_id',
      organizationId: 'org-9',
      source: 'endpoint',
    },
  });
});

test('a CallApi child runs under its own runAs declaration, not the parent scope', async () => {
  const context = createContext({
    endpoints: {
      child_scoped: {
        endpointId: 'child_scoped',
        type: 'Api',
        auth: { public: true },
        runAs: { organizationId: 'org-child' },
        routine: [requestStep('child_rows'), { ':return': { _step: 'child_rows' } }],
      },
      child_unscoped: {
        endpointId: 'child_unscoped',
        type: 'Api',
        auth: { public: true },
        routine: [requestStep('child_rows'), { ':return': { _step: 'child_rows' } }],
      },
    },
  });
  const { res } = await run(context, {
    routine: [
      {
        id: 'endpoint:jobs:call_scoped',
        stepId: 'call_scoped',
        type: 'CallApi',
        properties: { endpointId: 'child_scoped' },
      },
      {
        id: 'endpoint:jobs:call_unscoped',
        stepId: 'call_unscoped',
        type: 'CallApi',
        properties: { endpointId: 'child_unscoped' },
      },
    ],
    runAs: { organizationId: 'org-parent', configKey: 'endpoint.1', source: 'endpoint' },
  });
  expect(mockTenantRequest).toHaveBeenCalledTimes(1);
  expect(mockTenantRequest.mock.calls[0][0].tenant.value).toBe('org-child');
  // The parent's scope does not flow into the second child, so it fails
  // closed exactly as it would when called directly by a caller-less run.
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(AuthenticationError);
});

// Write validation: a routine step resolves the collection contract from the
// evaluated connection collection and hands it to the resolver, like a page
// request does.
test('a step resolves collectionSchema from the evaluated connection collection', async () => {
  // Only write types consult the contract.
  mockTenantRequest.meta.checkWrite = true;
  const collectionsArtifact = {
    answers: {
      fields: { test_id: { type: 'string' } },
      relations: {},
      indexes: [],
      connections: [],
    },
    controls: { tenant: 'shared', relations: {}, indexes: [], connections: [] },
  };
  const readConfigFile = jest.fn((path) => {
    if (path === 'collections.json') return collectionsArtifact;
    if (path === 'connections/answers.json') {
      return {
        id: 'connection:answers',
        type: 'TestTenantConnection',
        connectionId: 'answers',
        properties: { write: true, collection: { _secret: 'COLLECTION' } },
        '~k': 'connection.1',
      };
    }
    if (path === 'connections/controls.json') {
      return {
        id: 'connection:controls',
        type: 'TestTenantConnection',
        connectionId: 'controls',
        properties: { write: true, collection: 'controls' },
        '~k': 'connection.2',
      };
    }
    return null;
  });
  const context = testContext({
    connections,
    logger,
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile,
    secrets: { COLLECTION: 'answers' },
    system: true,
  });
  context.endpointId = 'jobs';
  context.evaluateOperators = createEvaluateOperators(context);
  const { res } = await run(context, {
    routine: [
      requestStep('write', { connectionId: 'answers' }),
      requestStep('read', { connectionId: 'controls' }),
    ],
    runAs: { organizationId: 'org-9', configKey: 'endpoint.1', source: 'endpoint' },
  });
  expect(res.status).toBe('continue');
  expect(mockTenantRequest).toHaveBeenCalledTimes(2);
  expect(mockTenantRequest.mock.calls[0][0].connection).toEqual({
    write: true,
    collection: 'answers',
  });
  expect(mockTenantRequest.mock.calls[0][0].collectionSchema).toEqual({
    name: 'answers',
    fields: collectionsArtifact.answers.fields,
    required: [],
  });
  expect(mockTenantRequest.mock.calls[1][0].collectionSchema).toBe(null);
  mockTenantRequest.meta.checkWrite = false;
});
