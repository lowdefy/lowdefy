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

import BanUser from './BanUser.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('BanUser passes properties through as body to the admin banUser endpoint', async () => {
  const banUser = jest.fn().mockResolvedValue({ user: { id: 'user-2', banned: true } });
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  const result = await BanUser({
    acting,
    auth,
    properties: { userId: 'user-2', banReason: 'Spam', banExpiresIn: 3600 },
  });
  expect(result).toEqual({ user: { id: 'user-2', banned: true } });
  expect(banUser.mock.calls[0][0].body).toEqual({
    userId: 'user-2',
    banReason: 'Spam',
    banExpiresIn: 3600,
  });
});

test('BanUser throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(BanUser({ acting, auth, properties: {} })).rejects.toThrow(
    'BanUser requires a "userId" property.'
  );
});
