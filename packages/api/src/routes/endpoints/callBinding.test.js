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
import { serializer } from '@lowdefy/helpers';

import callEndpoint from './callEndpoint.js';
import runDetachedEndpoint from './runDetachedEndpoint.js';
import runScheduledEndpoint from './runScheduledEndpoint.js';
import runWebhookEndpoint from './runWebhookEndpoint.js';
import testContext from '../../test/testContext.js';

// A CallApi step naming `organization` (and `caller`) runs its target as a
// system run bound to that organization. The walled connection here records
// the tenant verdict each request ran with, standing in for MongoDB (the
// *.mongodb.test.js suite runs the same flow against a real database).

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const walledRequest = jest.fn(({ request, tenant }) => ({ request, tenant }));
walledRequest.schema = {};
walledRequest.meta = { checkRead: false, checkWrite: false };
const verify = ({ request }) => request.token === 'good';
verify.schema = {};
verify.meta = { checkRead: false, checkWrite: false };
const connections = {
  WalledConnection: {
    schema: true,
    meta: { tenant: true },
    requests: { WalledRequest: walledRequest },
  },
  VerifyConnection: {
    schema: true,
    meta: { tenant: false },
    requests: { Verify: verify },
  },
};

const github = { id: 'github', name: 'GitHub' };

function callStep({ stepId = 'call', endpointId = 'process', properties = {} }) {
  return {
    id: `endpoint:caller:${stepId}`,
    stepId,
    type: 'CallApi',
    properties: { endpointId, ...properties },
  };
}

function bindingSteps(properties) {
  return [
    callStep({ properties: { organization: 'org-1', caller: github, ...properties } }),
    { ':return': { result: { _step: 'call' }, after: { _user: true } } },
  ];
}

const endpoints = {
  // What the bound endpoint sees: _user, a walled write and a walled read.
  process: {
    endpointId: 'process',
    type: 'Api',
    auth: { public: false },
    routine: [
      {
        id: 'request:process:write',
        stepId: 'write',
        type: 'WalledRequest',
        connectionId: 'walled',
        properties: { doc: { title: 'event' } },
      },
      {
        id: 'request:process:read',
        stepId: 'read',
        type: 'WalledRequest',
        connectionId: 'walled',
        properties: { query: {} },
      },
      callStep({ stepId: 'nested', endpointId: 'whoami' }),
      {
        ':return': {
          user: { _user: true },
          writeTenant: { _step: 'write.tenant' },
          readTenant: { _step: 'read.tenant' },
          nested: { _step: 'nested' },
        },
      },
    ],
  },
  whoami: {
    endpointId: 'whoami',
    type: 'InternalApi',
    auth: { public: false },
    routine: [
      {
        id: 'request:whoami:read',
        stepId: 'read',
        type: 'WalledRequest',
        connectionId: 'walled',
        properties: {},
      },
      { ':return': { user: { _user: true }, tenant: { _step: 'read.tenant' } } },
    ],
  },
};

function createContext({ entry, user = null, extra = [] }) {
  const all = [...Object.values(endpoints), ...extra, entry];
  const files = {
    ...Object.fromEntries(all.map((config) => [`api/${config.endpointId}.json`, config])),
    'connections/walled.json': {
      id: 'connection:walled',
      type: 'WalledConnection',
      connectionId: 'walled',
      properties: {},
    },
    'connections/verifier.json': {
      id: 'connection:verifier',
      type: 'VerifyConnection',
      connectionId: 'verifier',
      properties: {},
    },
  };
  return testContext({
    logger,
    connections,
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile: jest.fn((path) => files[path] ?? null),
    user,
  });
}

function verifiedWebhook(routine) {
  return {
    endpointId: 'hook',
    type: 'Api',
    auth: { public: true },
    webhook: {
      verify: {
        connectionId: 'verifier',
        type: 'Verify',
        properties: { token: { _payload: 'query.token' } },
      },
    },
    routine,
  };
}

const standIn = { id: 'github', name: 'GitHub', organization_id: 'org-1', system: true };
const orgVerdict = { field: 'organization_id', value: 'org-1' };

beforeEach(() => {
  jest.clearAllMocks();
});

test('a verified webhook calls an endpoint bound to an organization as a named stand-in caller', async () => {
  const context = createContext({ entry: verifiedWebhook(bindingSteps()) });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    body: {},
    query: { token: 'good' },
    headers: {},
  });
  expect(result.status).toBe(200);
  expect(result.body.result).toEqual({
    user: standIn,
    writeTenant: orgVerdict,
    readTenant: orgVerdict,
    // A nested CallApi that names no binding keeps the same organization and caller.
    nested: { user: standIn, tenant: orgVerdict },
  });
  // The calling run carries on as itself once the bound call returns.
  expect(result.body.after).toBe(null);
  expect(context.user).toBe(null);
  expect(context.boundOrganizationId).toBe(null);
});

test('a scheduled run binds to an organization with no caller, so _user is null and the wall still scopes', async () => {
  const context = createContext({
    entry: {
      endpointId: 'nightly',
      type: 'Api',
      auth: { public: false },
      schedules: [{ cron: '0 2 * * *' }],
      routine: [
        callStep({ endpointId: 'whoami', properties: { organization: 'org-2' } }),
        { ':return': { _step: 'call' } },
      ],
    },
  });
  const result = await runScheduledEndpoint(context, { endpointId: 'nightly', cron: '0 2 * * *' });
  expect(result.success).toBe(true);
  expect(serializer.deserialize(result.response)).toEqual({
    user: null,
    tenant: { field: 'organization_id', value: 'org-2' },
  });
});

test('an unbound system run still fails closed on a walled request', async () => {
  const context = createContext({
    entry: {
      endpointId: 'nightly',
      type: 'Api',
      auth: { public: false },
      schedules: [{ cron: '0 2 * * *' }],
      routine: [callStep({ endpointId: 'whoami' }), { ':return': { _step: 'call' } }],
    },
  });
  const result = await runScheduledEndpoint(context, { endpointId: 'nightly', cron: '0 2 * * *' });
  expect(result.success).toBe(false);
  expect(serializer.deserialize(result.error).message).toContain('no caller organization');
  expect(walledRequest).not.toHaveBeenCalled();
});

test('a signed-in caller can not bind a CallApi to an organization', async () => {
  const context = createContext({
    entry: { endpointId: 'save', type: 'Api', auth: { public: false }, routine: bindingSteps() },
    user: { id: 'user-1', organization_id: 'org-1', roles: [] },
  });
  const result = await callEndpoint(context, { blockId: 'b', endpointId: 'save', pageId: 'p' });
  expect(result.success).toBe(false);
  expect(logger.error.mock.calls[0][0].message).toBe(
    'CallApi step "call" names an "organization", which is accepted only in a trusted system run (a schedule, an auth hook, a webhook whose verifier passed, or a detached run from one). This run has a signed-in caller, or is a webhook with no passing verifier.'
  );
  expect(walledRequest).not.toHaveBeenCalled();
});

test('a webhook with no verifier can not bind a CallApi to an organization', async () => {
  const context = createContext({
    entry: {
      endpointId: 'hook',
      type: 'Api',
      auth: { public: true },
      webhook: true,
      routine: bindingSteps(),
    },
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    body: {},
    query: {},
    headers: {},
  });
  expect(result.status).toBe(500);
  expect(logger.error.mock.calls[0][0].message).toContain('accepted only in a trusted system run');
  expect(walledRequest).not.toHaveBeenCalled();
});

test('a webhook whose verifier fails is refused before the binding CallApi runs', async () => {
  const context = createContext({ entry: verifiedWebhook(bindingSteps()) });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    body: {},
    query: { token: 'forged' },
    headers: {},
  });
  expect(result.status).toBe(401);
  expect(walledRequest).not.toHaveBeenCalled();
  expect(context.readConfigFile).not.toHaveBeenCalledWith('api/process.json');
});

test('a bound run can restate its binding but not name another organization or caller', async () => {
  const restating = {
    endpointId: 'restate',
    type: 'InternalApi',
    auth: { public: false },
    routine: [
      callStep({ endpointId: 'whoami', properties: { organization: 'org-1' } }),
      { ':return': { _step: 'call' } },
    ],
  };
  const otherOrganization = {
    ...restating,
    endpointId: 'other_org',
    routine: [callStep({ endpointId: 'whoami', properties: { organization: 'org-2' } })],
  };
  const otherCaller = {
    ...restating,
    endpointId: 'other_caller',
    routine: [
      callStep({
        endpointId: 'whoami',
        properties: { organization: 'org-1', caller: { id: 'slack', name: 'Slack' } },
      }),
    ],
  };
  async function run(endpointId) {
    const context = createContext({
      entry: verifiedWebhook([
        callStep({ endpointId, properties: { organization: 'org-1', caller: github } }),
        { ':return': { _step: 'call' } },
      ]),
      extra: [restating, otherOrganization, otherCaller],
    });
    return runWebhookEndpoint(context, {
      endpointId: 'hook',
      body: {},
      query: { token: 'good' },
      headers: {},
    });
  }
  const restated = await run('restate');
  expect(restated.body).toEqual({ user: standIn, tenant: orgVerdict });
  await run('other_org');
  expect(logger.error.mock.calls[0][0].message).toBe(
    'CallApi step "call" names organization "org-2", but this run is already bound to organization "org-1" and can not name another.'
  );
  await run('other_caller');
  expect(logger.error.mock.calls[1][0].message).toBe(
    'CallApi step "call" names caller "slack", but this run is already bound with caller "github" and can not name another.'
  );
});

test('a detached CallApi carries the binding and the stand-in caller to the detached run', async () => {
  process.env.CRON_SECRET = 'shhh';
  const fetchMock = jest.fn(async () => ({ status: 200 }));
  global.fetch = fetchMock;
  const context = createContext({
    entry: verifiedWebhook([
      callStep({
        endpointId: 'whoami',
        properties: { organization: 'org-1', caller: github, detached: true },
      }),
      { ':return': { user: { _user: true } } },
    ]),
  });
  context.origin = 'https://app.test';
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    body: {},
    query: { token: 'good' },
    headers: {},
  });
  expect(result.body).toEqual({ user: null });
  await new Promise((resolve) => setImmediate(resolve));
  const { principal } = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(principal.system).toBe(true);
  expect(principal.organizationId).toBe('org-1');
  expect(serializer.deserialize(principal.user)).toEqual(standIn);

  const detachedContext = createContext({ entry: endpoints.whoami });
  const detached = await runDetachedEndpoint(detachedContext, {
    endpointId: 'whoami',
    payload: serializer.serialize({}),
    principal,
  });
  expect(detached.success).toBe(true);
  expect(serializer.deserialize(detached.response)).toEqual({ user: standIn, tenant: orgVerdict });
  delete process.env.CRON_SECRET;
});
