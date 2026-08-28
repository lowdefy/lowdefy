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

const mockBeginTwoFactorChallenge = jest.fn(async () => 'challenged');
jest.unstable_mockModule('./beginTwoFactorChallenge.js', () => ({
  default: mockBeginTwoFactorChallenge,
}));

const { default: createTwoFactorChallengeHook } = await import('./createTwoFactorChallengeHook.js');

const enrolledSession = {
  user: { id: 'user_1', twoFactorEnabled: true },
  session: { token: 'session_token_1' },
};

function createHook({ exit = jest.fn(() => ({ challenged: true })) } = {}) {
  return {
    exit,
    registration: createTwoFactorChallengeHook({
      id: 'testTwoFactorChallenge',
      matches: (path) => path === '/magic-link/verify',
      exit,
    }),
  };
}

beforeEach(() => {
  mockBeginTwoFactorChallenge.mockClear();
  mockBeginTwoFactorChallenge.mockImplementation(async () => 'challenged');
});

test('createTwoFactorChallengeHook returns a registration matching only its own path', () => {
  const { registration } = createHook();
  expect(registration.id).toBe('testTwoFactorChallenge');
  expect(registration.matches('/magic-link/verify')).toBe(true);
  expect(registration.matches('/sign-in/email')).toBe(false);
});

test('createTwoFactorChallengeHook falls through when no session was minted on the request', async () => {
  const { exit, registration } = createHook();

  const result = await registration.handler({ context: { newSession: null } });

  expect(result).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
});

test('createTwoFactorChallengeHook falls through when the user has not enrolled a second factor', async () => {
  const { exit, registration } = createHook();

  const result = await registration.handler({
    context: { newSession: { user: { id: 'user_1', twoFactorEnabled: false } } },
  });

  expect(result).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
});

test('createTwoFactorChallengeHook runs the exit for an enrolled user', async () => {
  const { exit, registration } = createHook();
  const ctx = { context: { newSession: enrolledSession } };

  const result = await registration.handler(ctx);

  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledWith({ ctx, newSession: enrolledSession });
  expect(exit).toHaveBeenCalledWith(ctx);
  expect(result).toEqual({ challenged: true });
});

test('createTwoFactorChallengeHook leaves the endpoint response alone when the device is trusted', async () => {
  mockBeginTwoFactorChallenge.mockImplementation(async () => 'trusted');
  const { exit, registration } = createHook();

  const result = await registration.handler({ context: { newSession: enrolledSession } });

  expect(result).toBeUndefined();
  expect(exit).not.toHaveBeenCalled();
});
