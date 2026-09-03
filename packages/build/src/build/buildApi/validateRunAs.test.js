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
import { ConfigError } from '@lowdefy/errors';

import buildApi from './buildApi.js';
import validateRunAs from './validateRunAs.js';
import testContext from '../../test-utils/testContext.js';

const logger = { warn: jest.fn(), log: jest.fn() };

const location = 'Api endpoint "jobs"';
const configKey = 'endpoint.1';

const stateMessage = `Api endpoint "jobs" "runAs.organizationId" reads "_state" — _state is empty when an endpoint's runAs is evaluated, before any step has run. Use _user, _secret or a step-level runAs.`;

function payloadMessage(operator) {
  return `Api endpoint "jobs" "runAs.organizationId" reads "${operator}" — the organization a routine runs as can not come from the caller. A browser or an API client controls the payload, so any caller could name another organization and read its rows. Derive it from a previous step (_step), from the caller (_user), or from a secret or environment value.`;
}

test('validateRunAs accepts an undefined or null runAs', () => {
  // Matches resolveRunAs, which reads both as "no runAs declared".
  expect(() => validateRunAs({ runAs: undefined, location, configKey })).not.toThrow();
  expect(() => validateRunAs({ runAs: null, location, configKey })).not.toThrow();
});

test('validateRunAs accepts a literal organization id', () => {
  expect(() =>
    validateRunAs({ runAs: { organizationId: 'org_1' }, location, configKey })
  ).not.toThrow();
});

test('validateRunAs accepts _step, _user, _secret and _env sources', () => {
  expect(() =>
    validateRunAs({
      runAs: { organizationId: { _step: 'job.organization_id' } },
      location,
      configKey,
    })
  ).not.toThrow();
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _user: 'organization_id' } }, location, configKey })
  ).not.toThrow();
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _secret: 'SYSTEM_ORG' } }, location, configKey })
  ).not.toThrow();
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _env: 'SYSTEM_ORG' } }, location, configKey })
  ).not.toThrow();
});

test('validateRunAs accepts an unknown operator by default (scan, not allowlist)', () => {
  expect(() =>
    validateRunAs({
      runAs: { organizationId: { _new_operator: { _step: 'job.organization_id' } } },
      location,
      configKey,
    })
  ).not.toThrow();
});

test('validateRunAs throws when runAs is not an object', () => {
  expect(() => validateRunAs({ runAs: 'org_1', location, configKey })).toThrow(
    'Api endpoint "jobs" "runAs" should be an object with an "organizationId".'
  );
  expect(() => validateRunAs({ runAs: 3, location, configKey })).toThrow(ConfigError);
});

test('validateRunAs throws when organizationId is null', () => {
  expect(() => validateRunAs({ runAs: { organizationId: null }, location, configKey })).toThrow(
    'Api endpoint "jobs" "runAs" should be an object with an "organizationId".'
  );
});

test('validateRunAs throws when organizationId is an empty string', () => {
  let error;
  try {
    validateRunAs({ runAs: { organizationId: '  ' }, location, configKey });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toBe(
    'Api endpoint "jobs" "runAs.organizationId" is an empty string. A routine can not run as an unnamed organization - remove the runAs, or give it the id of the organization the routine should be scoped to.'
  );
  expect(error.checkSlug).toBe('tenant-run-as');
});

test('validateRunAs throws when organizationId is missing', () => {
  expect(() => validateRunAs({ runAs: {}, location, configKey })).toThrow(
    'Api endpoint "jobs" "runAs" should be an object with an "organizationId".'
  );
  let error;
  try {
    validateRunAs({ runAs: { organization_id: 'org_1' }, location, configKey });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.configKey).toBe(configKey);
  expect(error.checkSlug).toBe('tenant-run-as');
});

test('validateRunAs throws when organizationId reads _payload at the top level', () => {
  let error;
  try {
    validateRunAs({ runAs: { organizationId: { _payload: 'orgId' } }, location, configKey });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toBe(payloadMessage('_payload'));
  expect(error.configKey).toBe(configKey);
  expect(error.checkSlug).toBe('tenant-run-as');
  expect(error.received).toEqual({ _payload: 'orgId' });
});

test('validateRunAs throws with its own message when an endpoint runAs reads _state', () => {
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _state: 'orgId' } }, location, configKey })
  ).toThrow(stateMessage);
});

test('validateRunAs accepts _state in a step-level runAs', () => {
  // On the server `state` starts {} and only a :set_state step writes it, so a
  // step-level _state is as server-authored as _step.
  expect(() =>
    validateRunAs({
      runAs: { organizationId: { _state: 'orgId' } },
      location: 'Step "rows" at endpoint "jobs"',
      configKey,
      level: 'step',
    })
  ).not.toThrow();
});

test('validateRunAs still refuses _payload in a step-level runAs', () => {
  expect(() =>
    validateRunAs({
      runAs: { organizationId: { _payload: 'orgId' } },
      location,
      configKey,
      level: 'step',
    })
  ).toThrow(payloadMessage('_payload'));
});

test('validateRunAs throws on the dotted _payload.x and _state.x shorthand keys', () => {
  expect(() =>
    validateRunAs({ runAs: { organizationId: { '_payload.orgId': true } }, location, configKey })
  ).toThrow(payloadMessage('_payload'));
  expect(() =>
    validateRunAs({ runAs: { organizationId: { '_state.orgId': true } }, location, configKey })
  ).toThrow(stateMessage);
});

test('validateRunAs does not match operators that merely start with the same letters', () => {
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _payloadish: 'x' } }, location, configKey })
  ).not.toThrow();
  expect(() =>
    validateRunAs({ runAs: { organizationId: { _statement: 'x' } }, location, configKey })
  ).not.toThrow();
});

test('validateRunAs finds _payload nested inside _js args', () => {
  expect(() =>
    validateRunAs({
      runAs: {
        organizationId: {
          _js: {
            code: 'function (a) { return a.orgId; }',
            args: [{ _payload: true }],
          },
        },
      },
      location,
      configKey,
    })
  ).toThrow(payloadMessage('_payload'));
});

test('validateRunAs finds _state nested inside an _if branch', () => {
  expect(() =>
    validateRunAs({
      runAs: {
        organizationId: {
          _if: {
            test: { _eq: [{ _user: 'roles' }, []] },
            then: { _secret: 'SYSTEM_ORG' },
            else: { _state: 'orgId' },
          },
        },
      },
      location,
      configKey,
    })
  ).toThrow(stateMessage);
});

// Wiring: the endpoint and step positions in the build.

test('buildApi accepts runAs on an endpoint and keeps it on the built endpoint', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        runAs: { organizationId: { _step: 'job.organization_id' } },
        routine: [{ id: 'job', type: 'MongoDBFindOne', connectionId: 'connection' }],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].runAs).toEqual({ organizationId: { _step: 'job.organization_id' } });
});

test('buildApi throws when an endpoint runAs reads _payload', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        runAs: { organizationId: { _payload: 'orgId' } },
        routine: [{ id: 'job', type: 'MongoDBFindOne', connectionId: 'connection' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(payloadMessage('_payload'));
});

test('buildApi throws when an endpoint runAs is malformed', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        runAs: 'org_1',
        routine: [{ id: 'job', type: 'MongoDBFindOne', connectionId: 'connection' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Api endpoint "jobs" "runAs" should be an object with an "organizationId".'
  );
});

test('buildApi accepts runAs on a request step', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          { id: 'job', type: 'MongoDBFindOne', connectionId: 'connection', tenant: 'none' },
          {
            id: 'rows',
            type: 'MongoDBFind',
            connectionId: 'connection',
            runAs: { organizationId: { _step: 'job.organization_id' } },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[1].runAs).toEqual({
    organizationId: { _step: 'job.organization_id' },
  });
});

test('buildApi accepts a step runAs that reads _state', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          {
            id: 'rows',
            type: 'MongoDBFind',
            connectionId: 'connection',
            runAs: { organizationId: { _state: 'orgId' } },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].runAs).toEqual({ organizationId: { _state: 'orgId' } });
});

test('buildApi throws when a step declares both runAs and tenant none', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          {
            id: 'rows',
            type: 'MongoDBFind',
            connectionId: 'connection',
            tenant: 'none',
            runAs: { organizationId: 'org_1' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "rows" at endpoint "jobs" declares both "runAs" and "tenant: none" — one scopes the step to an organization, the other switches the wall off. Remove "tenant: none".'
  );
});

test('buildApi throws when a step runAs is malformed', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          {
            id: 'rows',
            type: 'MongoDBFind',
            connectionId: 'connection',
            runAs: { organization_id: 'org_1' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "rows" at endpoint "jobs" "runAs" should be an object with an "organizationId".'
  );
});

test('buildApi throws when runAs is declared on a CallApi step', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          {
            id: 'child',
            type: 'CallApi',
            properties: { endpointId: 'child_ep' },
            runAs: { organizationId: 'org_1' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "child" at endpoint "jobs" declares "runAs", which only applies to request steps'
  );
});

test('buildApi refuses runAs on a step that names no connection, whatever its type', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'jobs',
        type: 'Api',
        routine: [
          {
            id: 'rows',
            type: 'FutureNativeStep',
            runAs: { organizationId: 'org_1' },
          },
        ],
      },
    ],
  };
  // A request step is one that names a connection: a step type this build does
  // not know is not silently treated as a request step.
  expect(() => buildApi({ components, context })).toThrow(
    'Step "rows" at endpoint "jobs" declares "runAs", which only applies to request steps'
  );
});
