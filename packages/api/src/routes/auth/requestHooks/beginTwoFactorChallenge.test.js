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

import crypto from 'node:crypto';
import { jest } from '@jest/globals';

// deleteSessionCookie walks ctx.context.authCookies, ctx.context.oauthConfig and
// the session cookie store; mocking the two cookie helpers keeps the fake ctx to
// the surface this helper is responsible for.
const mockDeleteSessionCookie = jest.fn();
const mockExpireCookie = jest.fn();
jest.unstable_mockModule('better-auth/cookies', () => ({
  deleteSessionCookie: mockDeleteSessionCookie,
  expireCookie: mockExpireCookie,
}));

const { default: beginTwoFactorChallenge } = await import('./beginTwoFactorChallenge.js');

const SECRET = 'test-secret-value';
const USER_ID = 'user_1';

function signTrust({ secret = SECRET, trustIdentifier, userId = USER_ID }) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}!${trustIdentifier}`, 'utf8')
    .digest('base64url');
}

function createCtx({ secret = SECRET, trustCookie, verificationRecord = null } = {}) {
  return {
    context: {
      secret,
      createAuthCookie: jest.fn((name, options) => ({
        name: `better-auth.${name}`,
        attributes: { maxAge: options?.maxAge, path: '/' },
      })),
      setNewSession: jest.fn(),
      internalAdapter: {
        findVerificationValue: jest.fn(async () => verificationRecord),
        createVerificationValue: jest.fn(async (data) => data),
        deleteVerificationByIdentifier: jest.fn(async () => undefined),
        deleteSession: jest.fn(async () => undefined),
      },
    },
    getSignedCookie: jest.fn(async () => trustCookie),
    setSignedCookie: jest.fn(async () => undefined),
  };
}

function createNewSession({ userId = USER_ID, twoFactorEnabled = true } = {}) {
  return {
    user: { id: userId, twoFactorEnabled },
    session: { token: 'session_token_1' },
  };
}

beforeEach(() => {
  mockDeleteSessionCookie.mockClear();
  mockExpireCookie.mockClear();
});

test('beginTwoFactorChallenge tears down the new session and returns challenged when no trust cookie is present', async () => {
  const ctx = createCtx();
  const newSession = createNewSession();

  const outcome = await beginTwoFactorChallenge({ ctx, newSession });

  expect(outcome).toBe('challenged');
  expect(mockDeleteSessionCookie).toHaveBeenCalledWith(ctx, true);
  expect(ctx.context.internalAdapter.deleteSession).toHaveBeenCalledWith('session_token_1');
  expect(ctx.context.setNewSession).toHaveBeenCalledWith(null);
});

test('beginTwoFactorChallenge creates the challenge verification record keyed by a 2fa- identifier', async () => {
  const ctx = createCtx();

  await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  const [challenge] = ctx.context.internalAdapter.createVerificationValue.mock.calls[0];
  expect(challenge.identifier).toMatch(/^2fa-.{20}$/);
  expect(challenge.value).toBe(USER_ID);
  expect(challenge.expiresAt instanceof Date).toBe(true);
});

test('beginTwoFactorChallenge creates the 2fa-attempts record - without it every correct code is rejected', async () => {
  // beginAttempt (two-factor/verify-two-factor.mjs) consumes
  // `2fa-attempts-{identifier}` and throws INVALID_TWO_FACTOR_COOKIE when it is
  // missing, so a challenge without this record rejects every code the user
  // types and blames the cookie. Do not delete this test.
  const ctx = createCtx();

  await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(ctx.context.internalAdapter.createVerificationValue).toHaveBeenCalledTimes(2);
  const [challenge] = ctx.context.internalAdapter.createVerificationValue.mock.calls[0];
  const [attempts] = ctx.context.internalAdapter.createVerificationValue.mock.calls[1];
  expect(attempts.identifier).toBe(`2fa-attempts-${challenge.identifier}`);
  expect(attempts.value).toBe('0');
  expect(attempts.expiresAt).toEqual(challenge.expiresAt);
});

test('beginTwoFactorChallenge sets the signed two_factor cookie to the challenge identifier', async () => {
  const ctx = createCtx();

  await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  const [challenge] = ctx.context.internalAdapter.createVerificationValue.mock.calls[0];
  expect(ctx.setSignedCookie).toHaveBeenCalledWith(
    'better-auth.two_factor',
    challenge.identifier,
    SECRET,
    { maxAge: 600, path: '/' }
  );
});

test('beginTwoFactorChallenge returns trusted and rotates the record and cookie for a valid trust device cookie', async () => {
  const trustIdentifier = 'trust-device-old';
  const ctx = createCtx({
    trustCookie: `${signTrust({ trustIdentifier })}!${trustIdentifier}`,
    verificationRecord: {
      value: USER_ID,
      identifier: trustIdentifier,
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  const outcome = await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(outcome).toBe('trusted');
  expect(ctx.context.internalAdapter.deleteVerificationByIdentifier).toHaveBeenCalledWith(
    trustIdentifier
  );
  expect(ctx.context.internalAdapter.createVerificationValue).toHaveBeenCalledTimes(1);
  const [rotated] = ctx.context.internalAdapter.createVerificationValue.mock.calls[0];
  expect(rotated.identifier).toMatch(/^trust-device-.{32}$/);
  expect(rotated.value).toBe(USER_ID);
  expect(ctx.setSignedCookie).toHaveBeenCalledWith(
    'better-auth.trust_device',
    `${signTrust({ trustIdentifier: rotated.identifier })}!${rotated.identifier}`,
    SECRET,
    { maxAge: 2592000, path: '/' }
  );
});

test('beginTwoFactorChallenge leaves the session intact on the trusted path', async () => {
  const trustIdentifier = 'trust-device-old';
  const ctx = createCtx({
    trustCookie: `${signTrust({ trustIdentifier })}!${trustIdentifier}`,
    verificationRecord: {
      value: USER_ID,
      identifier: trustIdentifier,
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  expect(ctx.context.internalAdapter.deleteSession).not.toHaveBeenCalled();
  expect(ctx.context.setNewSession).not.toHaveBeenCalled();
  expect(mockExpireCookie).not.toHaveBeenCalled();
  const created = ctx.context.internalAdapter.createVerificationValue.mock.calls.map(
    ([data]) => data.identifier
  );
  expect(created.some((identifier) => identifier.startsWith('2fa-'))).toBe(false);
});

test('beginTwoFactorChallenge expires the trust cookie and challenges when its token does not verify', async () => {
  const ctx = createCtx({
    trustCookie: 'not-the-right-token!trust-device-old',
    verificationRecord: {
      value: USER_ID,
      identifier: 'trust-device-old',
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  const outcome = await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(outcome).toBe('challenged');
  expect(mockExpireCookie).toHaveBeenCalledTimes(1);
  expect(ctx.context.internalAdapter.findVerificationValue).not.toHaveBeenCalled();
});

test('beginTwoFactorChallenge challenges when the trust device record has expired', async () => {
  const trustIdentifier = 'trust-device-old';
  const ctx = createCtx({
    trustCookie: `${signTrust({ trustIdentifier })}!${trustIdentifier}`,
    verificationRecord: {
      value: USER_ID,
      identifier: trustIdentifier,
      expiresAt: new Date(Date.now() - 1000),
    },
  });

  const outcome = await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(outcome).toBe('challenged');
  expect(mockExpireCookie).toHaveBeenCalledTimes(1);
});

test('beginTwoFactorChallenge challenges when the trust device record belongs to another user', async () => {
  const trustIdentifier = 'trust-device-old';
  const ctx = createCtx({
    trustCookie: `${signTrust({ trustIdentifier })}!${trustIdentifier}`,
    verificationRecord: {
      value: 'user_2',
      identifier: trustIdentifier,
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  const outcome = await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(outcome).toBe('challenged');
  expect(mockExpireCookie).toHaveBeenCalledTimes(1);
});

test('beginTwoFactorChallenge challenges when the trust cookie has no identifier half', async () => {
  const ctx = createCtx({ trustCookie: 'only-a-token-no-separator' });

  const outcome = await beginTwoFactorChallenge({ ctx, newSession: createNewSession() });

  expect(outcome).toBe('challenged');
  expect(mockExpireCookie).toHaveBeenCalledTimes(1);
  expect(ctx.context.internalAdapter.findVerificationValue).not.toHaveBeenCalled();
});

test('beginTwoFactorChallenge accepts a trust token signed to the @better-auth/utils golden vector', async () => {
  // Golden vector: createHMAC('SHA-256', 'base64urlnopad').sign(secret, data) from
  // @better-auth/utils 0.4.2, the implementation better-auth's trust-device
  // cookie uses. Both sides were run and agreed.
  // If node:crypto ever stops reproducing this, the cookie the engine signs is
  // not the cookie better-auth verifies, and every trusted device is silently
  // re-challenged - or worse, a cookie the engine writes is rejected as forged.
  const secret = 's3cr3t-value-abc';
  const userId = 'user-id-123';
  const trustIdentifier = 'trust-device-XYZ';
  const goldenToken = 'wbaDMu1JCLn24iOTaM7OUFm7AgrcCYsLbs3pqWMOucU';

  const ctx = createCtx({
    secret,
    trustCookie: `${goldenToken}!${trustIdentifier}`,
    verificationRecord: {
      value: userId,
      identifier: trustIdentifier,
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  const outcome = await beginTwoFactorChallenge({
    ctx,
    newSession: createNewSession({ userId }),
  });

  expect(outcome).toBe('trusted');
});
