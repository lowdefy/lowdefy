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

import sanitizeSessionResponse from './sanitizeSessionResponse.js';

test('sanitizeSessionResponse removes the token from the session', () => {
  const result = sanitizeSessionResponse({
    user: { id: 'user-1' },
    session: { id: 'session-1', token: 'secret-token' },
  });
  expect(result.session).not.toHaveProperty('token');
});

test('sanitizeSessionResponse returns the user untouched', () => {
  const user = { id: 'user-1', email: 'user-1@example.com', attributes: { plan: 'pro' } };
  const result = sanitizeSessionResponse({
    user,
    session: { id: 'session-1', token: 'secret-token' },
  });
  expect(result.user).toEqual(user);
});

test('sanitizeSessionResponse preserves non-token session fields', () => {
  const result = sanitizeSessionResponse({
    user: { id: 'user-1' },
    session: {
      id: 'session-1',
      token: 'secret-token',
      expiresAt: '2026-08-13T00:00:00.000Z',
      activeOrganizationId: 'org-1',
      ipAddress: '10.0.0.1',
      userAgent: 'jest',
    },
  });
  expect(result.session).toEqual({
    id: 'session-1',
    expiresAt: '2026-08-13T00:00:00.000Z',
    activeOrganizationId: 'org-1',
    ipAddress: '10.0.0.1',
    userAgent: 'jest',
  });
});

test('sanitizeSessionResponse handles an undefined session without throwing', () => {
  const result = sanitizeSessionResponse({ user: { id: 'user-1' }, session: undefined });
  expect(result).toEqual({ user: { id: 'user-1' }, session: {} });
});
