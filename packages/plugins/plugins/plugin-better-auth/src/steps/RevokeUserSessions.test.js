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

import RevokeUserSessions from './RevokeUserSessions.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('RevokeUserSessions passes userId through as body to the admin revokeUserSessions endpoint', async () => {
  const revokeUserSessions = jest.fn().mockResolvedValue({ success: true });
  const { auth } = createMockAuth({ adminEndpoints: { revokeUserSessions } });
  const result = await RevokeUserSessions({ acting, auth, properties: { userId: 'user-2' } });
  expect(result).toEqual({ success: true });
  expect(revokeUserSessions.mock.calls[0][0].body).toEqual({ userId: 'user-2' });
});

test('RevokeUserSessions throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(RevokeUserSessions({ acting, auth, properties: {} })).rejects.toThrow(
    'RevokeUserSessions requires a "userId" property.'
  );
});
