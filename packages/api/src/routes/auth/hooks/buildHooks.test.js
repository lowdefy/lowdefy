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

// The generic hook-mechanism tests below bind their own user.create.before
// hooks and invoke the composed slot directly. Default to the tenant policy so
// the engine-tier admission gate (bound only under pinned + invite-only) does
// not compose ahead of them - the gate's own behavior is covered separately.
function buildTestHooks({ endpointConfigs, hooks, organizations = { policy: 'tenant' } }) {
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
  const { afterEmailVerification, databaseHooks } = buildTestHooks({
    hooks: [],
  });
  expect(databaseHooks.session.create.before).toBeInstanceOf(Function);
  expect(databaseHooks.user).toBeUndefined();
  expect(afterEmailVerification).toBeUndefined();
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
    authConfig: { organizations: { policy: 'tenant' } },
    createSystemContext: createMockSystemContextFactory(),
    getAuth: () => ({}),
  });
  expect(databaseHooks.user).toBeUndefined();
});

test('buildHooks binds the engine admission gate on user.create.before under pinned + invite-only', () => {
  const { databaseHooks } = buildHooks({
    authConfig: { hooks: [], organizations: defaultOrganizations },
    createSystemContext: createMockSystemContextFactory(),
    getAuth: () => ({}),
  });
  expect(databaseHooks.user.create.before).toBeInstanceOf(Function);
});

test('buildHooks binds no admission gate under pinned + open signup', () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [],
    organizations: { policy: 'pinned', org: 'default', signup: 'open' },
  });
  // Only the auto-join after-hook is bound under open signup, never the gate.
  expect(databaseHooks.user.create.before).toBeUndefined();
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
  expect(result).toEqual({
    data: { user: { name: 'A', email: 'a@b.c' }, point: 'user.create.before' },
  });
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

test('two before hooks on one point run in array order and thread the record through both', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [
      { id: 'crm/link:user.create.before', point: 'user.create.before', endpointId: 'auth/first' },
      { id: 'app-normalize', point: 'user.create.before', endpointId: 'auth/second' },
    ],
    endpointConfigs: {
      'auth/first': {
        endpointId: 'auth/first',
        type: 'InternalApi',
        routine: { ':return': { name: 'from-first', threaded: true } },
      },
      'auth/second': {
        endpointId: 'auth/second',
        type: 'InternalApi',
        // The second hook reads the record as returned by the first - proof
        // the fold threads the record in array order.
        routine: {
          ':return': { final: true, threadedSeen: { _payload: 'user.threaded' } },
        },
      },
    },
  });
  const result = await databaseHooks.user.create.before({ name: 'Original', email: 'a@b.c' });
  expect(result).toEqual({ data: { final: true, threadedSeen: true } });
  const dispatchedHookIds = logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_auth_hook')
    .map((call) => call[0].hookId);
  expect(dispatchedHookIds).toEqual(['crm/link:user.create.before', 'app-normalize']);
});

test('the first before hook to reject short-circuits later hooks on the point', async () => {
  const { databaseHooks } = buildTestHooks({
    hooks: [
      { id: 'veto', point: 'user.create.before', endpointId: 'auth/veto' },
      { id: 'never-runs', point: 'user.create.before', endpointId: 'auth/second' },
    ],
    endpointConfigs: {
      'auth/veto': {
        endpointId: 'auth/veto',
        type: 'InternalApi',
        routine: { ':reject': 'Signups are closed.' },
      },
      'auth/second': {
        endpointId: 'auth/second',
        type: 'InternalApi',
        routine: { ':return': { ran: true } },
      },
    },
  });
  await expect(databaseHooks.user.create.before({ email: 'a@b.c' })).rejects.toThrow(
    'Signups are closed.'
  );
  const dispatchedHookIds = logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_auth_hook')
    .map((call) => call[0].hookId);
  expect(dispatchedHookIds).toEqual(['veto']);
});

test('two hooks on a synthetic point both fire in array order', async () => {
  const { afterEmailVerification } = buildTestHooks({
    hooks: [
      { id: 'crm/link:email.verified', point: 'email.verified', endpointId: 'auth/module-hook' },
      { id: 'app-on-verified', point: 'email.verified', endpointId: 'auth/app-hook' },
    ],
    endpointConfigs: {
      'auth/module-hook': {
        endpointId: 'auth/module-hook',
        type: 'InternalApi',
        routine: [{ ':log': 'module hook fired' }],
      },
      'auth/app-hook': {
        endpointId: 'auth/app-hook',
        type: 'InternalApi',
        routine: [{ ':log': 'app hook fired' }],
      },
    },
  });
  await expect(afterEmailVerification({ id: 'user_1', email: 'a@b.c' })).resolves.toBeUndefined();
  const dispatchedHookIds = logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_auth_hook')
    .map((call) => call[0].hookId);
  expect(dispatchedHookIds).toEqual(['crm/link:email.verified', 'app-on-verified']);
});

test('one endpoint bound at two points fires at both', async () => {
  const { afterEmailVerification, databaseHooks } = buildTestHooks({
    hooks: [
      { id: 'link-on-signup', point: 'user.create.before', endpointId: 'auth/link' },
      { id: 'link-on-verified', point: 'email.verified', endpointId: 'auth/link' },
    ],
    endpointConfigs: {
      'auth/link': {
        endpointId: 'auth/link',
        type: 'InternalApi',
        routine: { ':return': { linked: true } },
      },
    },
  });
  const result = await databaseHooks.user.create.before({ email: 'a@b.c' });
  expect(result).toEqual({ data: { linked: true } });
  await expect(afterEmailVerification({ id: 'user_1', email: 'a@b.c' })).resolves.toBeUndefined();
  const dispatchedHookIds = logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_auth_hook')
    .map((call) => call[0].hookId);
  expect(dispatchedHookIds).toEqual(['link-on-signup', 'link-on-verified']);
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

test('phone slots are undefined when no phone points are bound', () => {
  const { phoneVerified, sendPhoneOtp, sendPhonePasswordResetOtp } = buildTestHooks({
    hooks: [],
  });
  expect(phoneVerified).toBeUndefined();
  expect(sendPhoneOtp).toBeUndefined();
  expect(sendPhonePasswordResetOtp).toBeUndefined();
});

test('phone.otp.send builds the sendPhoneOtp callback with the catalog payload', async () => {
  const { databaseHooks, sendPhoneOtp } = buildTestHooks({
    hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    endpointConfigs: {
      'auth/send-otp-sms': {
        endpointId: 'auth/send-otp-sms',
        type: 'InternalApi',
        routine: {
          ':reject': {
            '_string.concat': ['otp:', { _payload: 'phoneNumber' }, ':', { _payload: 'code' }],
          },
        },
      },
    },
  });
  expect(databaseHooks.user).toBeUndefined();
  await expect(sendPhoneOtp({ phoneNumber: '+27831234567', code: '123456' })).rejects.toThrow(
    'otp:+27831234567:123456'
  );
});

test('phone.passwordReset.send builds the sendPhonePasswordResetOtp callback', async () => {
  const { sendPhoneOtp, sendPhonePasswordResetOtp } = buildTestHooks({
    hooks: [
      { id: 'send-reset-sms', point: 'phone.passwordReset.send', endpointId: 'auth/send-reset' },
    ],
    endpointConfigs: {
      'auth/send-reset': {
        endpointId: 'auth/send-reset',
        type: 'InternalApi',
        routine: {
          ':reject': { '_string.concat': ['reset:', { _payload: 'code' }] },
        },
      },
    },
  });
  expect(sendPhoneOtp).toBeUndefined();
  await expect(
    sendPhonePasswordResetOtp({ phoneNumber: '+27831234567', code: '654321' })
  ).rejects.toThrow('reset:654321');
});

test('phone.verified builds the phoneVerified callback with user and phoneNumber payload', async () => {
  const { phoneVerified } = buildTestHooks({
    hooks: [{ id: 'on-phone-verified', point: 'phone.verified', endpointId: 'auth/on-verified' }],
    endpointConfigs: {
      'auth/on-verified': {
        endpointId: 'auth/on-verified',
        type: 'InternalApi',
        routine: {
          ':reject': {
            '_string.concat': [
              'verified:',
              { _payload: 'user.id' },
              ':',
              { _payload: 'phoneNumber' },
            ],
          },
        },
      },
    },
  });
  await expect(
    phoneVerified({ phoneNumber: '+27831234567', user: { id: 'user_1' } })
  ).rejects.toThrow('verified:user_1:+27831234567');
});
