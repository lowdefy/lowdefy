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

const mockGetSessionFromCtx = jest.fn();
jest.unstable_mockModule('better-auth/api', () => ({
  // buildOauthPostLogin (the marker constant's home) imports APIError.
  APIError: class APIError extends Error {},
  getSessionFromCtx: mockGetSessionFromCtx,
}));

const { default: createOauthPostLoginHook } = await import('./createOauthPostLoginHook.js');

beforeEach(() => {
  mockGetSessionFromCtx.mockReset();
});

test('marks the cached session as post-login confirmed and falls through', async () => {
  const session = {
    session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    user: { id: 'user_1' },
  };
  mockGetSessionFromCtx.mockResolvedValue(session);
  const ctx = { body: { postLogin: true }, context: {} };

  const result = await createOauthPostLoginHook()(ctx);

  expect(result).toBeUndefined();
  expect(mockGetSessionFromCtx).toHaveBeenCalledWith(ctx);
  expect(session.session.oauthPostLoginConfirmed).toBe(true);
});

test('leaves a continue that is not a post-login confirmation alone', async () => {
  const result = await createOauthPostLoginHook()({ body: { selected: true }, context: {} });
  expect(result).toBeUndefined();
  expect(mockGetSessionFromCtx).not.toHaveBeenCalled();
});

test('falls through without a session so the endpoint answers unauthorized itself', async () => {
  mockGetSessionFromCtx.mockResolvedValue(null);
  const result = await createOauthPostLoginHook()({ body: { postLogin: true }, context: {} });
  expect(result).toBeUndefined();
});
