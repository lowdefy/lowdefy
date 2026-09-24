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

import UnbanUser from './UnbanUser.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('UnbanUser passes userId through as body to the admin unbanUser endpoint', async () => {
  const unbanUser = jest.fn().mockResolvedValue({ user: { id: 'user-2', banned: false } });
  const { auth } = createMockAuth({ adminEndpoints: { unbanUser } });
  const result = await UnbanUser({ acting, auth, properties: { userId: 'user-2' } });
  expect(result).toEqual({ user: { id: 'user-2', banned: false } });
  expect(unbanUser.mock.calls[0][0].body).toEqual({ userId: 'user-2' });
});

test('UnbanUser throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(UnbanUser({ acting, auth, properties: {} })).rejects.toThrow(
    'UnbanUser requires a "userId" property.'
  );
});
