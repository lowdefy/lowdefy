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
import { APIError } from 'better-auth/api';
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import buildHooks from './buildHooks.js';
import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import testContext from '../../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createMockReadConfigFile(endpointConfigs = {}) {
  return jest.fn((path) => {
    const match = path.match(/^api\/(.+)\.json$/);
    if (match && endpointConfigs[match[1]]) {
      const config = endpointConfigs[match[1]];
      if (!config.auth) config.auth = { public: true };
      return config;
    }
    return null;
  });
}

// A factory producing a fresh system-like context per fire, the way the
// servers' createSystemContext does - empty user, authorize bypassed.
function createMockSystemContextFactory({ endpointConfigs = {} } = {}) {
  return function createSystemContext() {
    const context = testContext({
      operators,
      logger,
      readConfigFile: createMockReadConfigFile(endpointConfigs),
      user: {},
      secrets: { HOOK_KEY: 'hook-secret-value' },
    });
    context.authorize = () => true;
    context.evaluateOperators = createEvaluateOperators(context);
    return context;
  };
}

const defaultOrganizations = { policy: 'pinned', org: 'default', signup: 'invite-only' };

function buildTestHooks({ endpointConfigs, hooks, organizations = defaultOrganizations }) {
  return buildHooks({
    authConfig: { hooks, organizations },
    createSystemContext: createMockSystemContextFactory({ endpointConfigs }),
    getAuth: () => ({}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('buildHooks always registers the engine session.create.before policy slot', () => {
  const { afterEmailVerification, databaseHooks, sendInvitationEmail } = buildTestHooks({
    hooks: [],
  });
  expect(databaseHooks.session.create.before).toBeInstanceOf(Function);
  expect(databaseHooks.user).toBeUndefined();
  expect(afterEmailVerification).toBeUndefined();
  expect(sendInvitationEmail).toBeUndefined();
});

test('buildHooks registers the auto-join user.create.after slot for open signup under pinned', () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [],
    organizations: { policy: 'pinned', org: 'default', signup: 'open' },
  });
  expect(databaseHooks.user.create.after).toBeInstanceOf(Function);
});

test('buildHooks registers no auto-join slot under the tenant policy', () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [],
    organizations: { policy: 'tenant' },
  });
  expect(databaseHooks.user).toBeUndefined();
  expect(databaseHooks.session.create.before).toBeInstanceOf(Function);
});

test('buildHooks tolerates an authConfig without a hooks array', () => {
  const { databaseHooks } = buildHooks({
    authConfig: { organizations: defaultOrganizations },
    createSystemContext: createMockSystemContextFactory(),
    getAuth: () => ({}),
  });
  expect(databaseHooks.user).toBeUndefined();
});

test('buildHooks throws when hooks are configured without a createSystemContext factory', () => {
  expect(() =>
    buildHooks({
      authConfig: {
        hooks: [{ id: 'h', point: 'user.create.before', endpointId: 'auth/h' }],
        organizations: defaultOrganizations,
      },
      getAuth: () => ({}),
    })
  ).toThrow(LowdefyInternalError);
});

test('a before hook :return replaces the record handed back as { data }', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'normalize', point: 'user.create.before', endpointId: 'auth/normalize' }],
    endpointConfigs: {
      'auth/normalize': {
        endpointId: 'auth/normalize',
        type: 'InternalApi',
        routine: { ':return': { name: 'Replaced Name', flagged: true } },
      },
    },
  });
  const result = await databaseHooks.user.create.before({ name: 'Original', email: 'a@b.c' });
  expect(result).toEqual({ data: { name: 'Replaced Name', flagged: true } });
});

test('a before hook that falls through leaves the record unchanged', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'noop', point: 'user.create.before', endpointId: 'auth/noop' }],
    endpointConfigs: {
      'auth/noop': {
        endpointId: 'auth/noop',
        type: 'InternalApi',
        routine: [{ ':log': 'observed' }],
      },
    },
  });
  const record = { name: 'Original', email: 'a@b.c' };
  const result = await databaseHooks.user.create.before(record);
  expect(result).toEqual({ data: record });
});

test('a before hook :reject aborts the write with an APIError carrying the reject message', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'veto', point: 'user.create.before', endpointId: 'auth/veto' }],
    endpointConfigs: {
      'auth/veto': {
        endpointId: 'auth/veto',
        type: 'InternalApi',
        routine: { ':reject': 'Signups are closed.' },
      },
    },
  });
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow(APIError);
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow(
    'Signups are closed.'
  );
});

test('a throw inside a before hook routine propagates and aborts the write', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'boom', point: 'user.create.before', endpointId: 'auth/boom' }],
    endpointConfigs: {
      'auth/boom': {
        endpointId: 'auth/boom',
        type: 'InternalApi',
        routine: { ':throw': 'boom' },
      },
    },
  });
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow('boom');
});

test('a before hook :return that is not an object throws a ConfigError', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'bad-return', point: 'user.create.before', endpointId: 'auth/bad' }],
    endpointConfigs: {
      'auth/bad': {
        endpointId: 'auth/bad',
        type: 'InternalApi',
        routine: { ':return': 'not-an-object' },
      },
    },
  });
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow(ConfigError);
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow(
    'Auth hook "bad-return" at point "user.create.before" returned a string.'
  );
});

test('the point payload reaches the routine as _payload - user.create.before hands { user }', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'echo', point: 'user.create.before', endpointId: 'auth/echo' }],
    endpointConfigs: {
      'auth/echo': {
        endpointId: 'auth/echo',
        type: 'InternalApi',
        routine: { ':return': { _payload: true } },
      },
    },
  });
  const result = await databaseHooks.user.create.before({ name: 'A', email: 'a@b.c' });
  expect(result).toEqual({ data: { user: { name: 'A', email: 'a@b.c' } } });
});

test('inside a hook routine _user is empty and _secret resolves', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'ops', point: 'user.create.before', endpointId: 'auth/ops' }],
    endpointConfigs: {
      'auth/ops': {
        endpointId: 'auth/ops',
        type: 'InternalApi',
        routine: {
          ':return': {
            sessionUserId: { _user: 'id' },
            secret: { _secret: 'HOOK_KEY' },
          },
        },
      },
    },
  });
  const result = await databaseHooks.user.create.before({ email: 'a@b.c' });
  expect(result.data.sessionUserId).toBeNull();
  expect(result.data.secret).toBe('hook-secret-value');
});

test('an after hook fires without affecting the result and ignores :return data', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' }],
    endpointConfigs: {
      'auth/audit': {
        endpointId: 'auth/audit',
        type: 'InternalApi',
        routine: { ':return': { ignored: true } },
      },
    },
  });
  await expect(
    databaseHooks.session.create.after({ id: 'session_1', userId: 'user_1' })
  ).resolves.toBeUndefined();
  expect(logger.debug).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'debug_auth_hook',
      hookId: 'audit',
      point: 'session.create.after',
      status: 'return',
    })
  );
});

test('a :reject in an after hook surfaces as an APIError on the operation', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' }],
    endpointConfigs: {
      'auth/audit': {
        endpointId: 'auth/audit',
        type: 'InternalApi',
        routine: { ':reject': 'audit failed' },
      },
    },
  });
  await expect(
    databaseHooks.session.create.after({ id: 'session_1', userId: 'user_1' })
  ).rejects.toThrow(APIError);
});

test('session points fetch the subject user through the internal adapter', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' }],
    endpointConfigs: {
      'auth/audit': {
        endpointId: 'auth/audit',
        type: 'InternalApi',
        routine: { ':reject': { '_string.concat': ['email:', { _payload: 'user.email' }] } },
      },
    },
  });
  const findUserById = jest.fn(async () => ({ id: 'user_1', email: 'a@b.c' }));
  const ctx = { context: { internalAdapter: { findUserById } } };
  await expect(
    databaseHooks.session.create.after({ id: 'session_1', userId: 'user_1' }, ctx)
  ).rejects.toThrow('email:a@b.c');
  expect(findUserById).toHaveBeenCalledWith('user_1');
});

test('session points hand a null user when no endpoint context is available', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [{ id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' }],
    endpointConfigs: {
      'auth/audit': {
        endpointId: 'auth/audit',
        type: 'InternalApi',
        routine: { ':reject': { _if_none: [{ _payload: 'user' }, 'user-is-null'] } },
      },
    },
  });
  await expect(
    databaseHooks.session.create.after({ id: 'session_1', userId: 'user_1' }, null)
  ).rejects.toThrow('user-is-null');
});

test('email.verified builds an afterEmailVerification callback, not a database hook', async () => {
  const { afterEmailVerification, databaseHooks } = buildTestHooks({
    hooks: [{ id: 'on-verified', point: 'email.verified', endpointId: 'auth/on-verified' }],
    endpointConfigs: {
      'auth/on-verified': {
        endpointId: 'auth/on-verified',
        type: 'InternalApi',
        routine: { ':reject': { '_string.concat': ['verified:', { _payload: 'user.email' }] } },
      },
    },
  });
  expect(databaseHooks.user).toBeUndefined();
  await expect(afterEmailVerification({ id: 'user_1', email: 'a@b.c' })).rejects.toThrow(
    'verified:a@b.c'
  );
});

test('invitation.send builds the sendInvitationEmail callback with the catalog payload', async () => {
  const { databaseHooks, sendInvitationEmail } = buildTestHooks({
    hooks: [{ id: 'invite', point: 'invitation.send', endpointId: 'auth/invite' }],
    endpointConfigs: {
      'auth/invite': {
        endpointId: 'auth/invite',
        type: 'InternalApi',
        routine: {
          ':reject': { '_string.concat': ['invite:', { _payload: 'invitation.email' }] },
        },
      },
    },
  });
  expect(databaseHooks.invitation).toBeUndefined();
  await expect(
    sendInvitationEmail({
      id: 'inv_1',
      role: 'member',
      email: 'a@b.c',
      invitation: { id: 'inv_1', email: 'a@b.c' },
      organization: { id: 'org_1', name: 'Org One' },
      inviter: { user: { email: 'inviter@b.c' } },
    })
  ).rejects.toThrow('invite:a@b.c');
});

test('multiple hooks assemble slots at their own points', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [
      { id: 'normalize', point: 'user.create.before', endpointId: 'auth/normalize' },
      { id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' },
    ],
    endpointConfigs: {
      'auth/normalize': {
        endpointId: 'auth/normalize',
        type: 'InternalApi',
        routine: { ':return': { name: 'N' } },
      },
      'auth/audit': {
        endpointId: 'auth/audit',
        type: 'InternalApi',
        routine: [{ ':log': 'audit' }],
      },
    },
  });
  expect(databaseHooks.user.create.before).toBeInstanceOf(Function);
  expect(databaseHooks.session.create.after).toBeInstanceOf(Function);
  expect(databaseHooks.user.create.after).toBeUndefined();
});
