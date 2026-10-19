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

import UpdateUserAttributes from './UpdateUserAttributes.js';
import createMockAuth from '../../test/createMockAuth.js';

test('UpdateUserAttributes updates the user row directly through the adapter', async () => {
  const updated = { id: 'user-2', attributes: { plan: 'pro' } };
  const adapter = { update: jest.fn().mockResolvedValue(updated) };
  const { auth } = createMockAuth({ adapter });
  const result = await UpdateUserAttributes({
    auth,
    properties: { userId: 'user-2', attributes: { plan: 'pro' } },
  });
  expect(result).toEqual(updated);
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-2' }],
    update: { attributes: { plan: 'pro' } },
  });
});

test('UpdateUserAttributes throws when userId matches no user', async () => {
  const adapter = { update: jest.fn().mockResolvedValue(null) };
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateUserAttributes({ auth, properties: { userId: 'missing', attributes: { plan: 'pro' } } })
  ).rejects.toThrow('UpdateUserAttributes found no user with id "missing".');
});

test('UpdateUserAttributes throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(UpdateUserAttributes({ auth, properties: { attributes: {} } })).rejects.toThrow(
    'UpdateUserAttributes requires a "userId" property.'
  );
});

test('UpdateUserAttributes throws when attributes is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserAttributes({ auth, properties: { userId: 'user-2', attributes: 'pro' } })
  ).rejects.toThrow('UpdateUserAttributes requires an "attributes" object.');
  await expect(
    UpdateUserAttributes({ auth, properties: { userId: 'user-2', attributes: ['pro'] } })
  ).rejects.toThrow('UpdateUserAttributes requires an "attributes" object.');
  await expect(UpdateUserAttributes({ auth, properties: { userId: 'user-2' } })).rejects.toThrow(
    'UpdateUserAttributes requires an "attributes" object.'
  );
});
