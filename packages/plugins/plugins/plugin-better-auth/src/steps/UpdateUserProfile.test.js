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

import UpdateUserProfile from './UpdateUserProfile.js';
import createMockAuth from '../../test/createMockAuth.js';

function createAdapter({ user = { id: 'user-1' } } = {}) {
  return {
    findOne: jest.fn().mockResolvedValue(user),
    update: jest.fn().mockImplementation(async ({ update }) => ({ id: 'user-1', ...update })),
  };
}

test('UpdateUserProfile merges new profile keys onto the existing profile bag', async () => {
  const adapter = createAdapter({
    user: { id: 'user-1', profile: { contactId: 'contact-1', locale: 'en' } },
  });
  const { auth } = createMockAuth({ adapter });
  const result = await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', profile: { plan: 'pro', locale: 'de' } },
  });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { profile: { contactId: 'contact-1', locale: 'de', plan: 'pro' } },
  });
  expect(result.profile).toEqual({ contactId: 'contact-1', locale: 'de', plan: 'pro' });
});

test('UpdateUserProfile removes a profile key set to null', async () => {
  const adapter = createAdapter({
    user: { id: 'user-1', profile: { contactId: 'contact-1', locale: 'en' } },
  });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', profile: { locale: null } },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { profile: { contactId: 'contact-1' } },
  });
});

test('UpdateUserProfile writes the profile as the bag when the user has no existing profile', async () => {
  const adapter = createAdapter({ user: { id: 'user-1' } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', profile: { contactId: 'contact-1' } },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { profile: { contactId: 'contact-1' } },
  });
});

test('UpdateUserProfile sets the name and image display copies', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { contactId: 'contact-1' } } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', name: 'New Name', image: 'https://img.example/a.png' },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { name: 'New Name', image: 'https://img.example/a.png' },
  });
});

test('UpdateUserProfile writes only profile, name, and image - never other user fields', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', email: 'a@example.com' } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: {
      userId: 'user-1',
      profile: { contactId: 'contact-1' },
      name: 'New Name',
      image: 'https://img.example/a.png',
    },
  });
  expect(adapter.update.mock.calls[0][0].update).toEqual({
    profile: { contactId: 'contact-1' },
    name: 'New Name',
    image: 'https://img.example/a.png',
  });
});

test('UpdateUserProfile refuses unknown properties', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', profile: { a: 1 }, email: 'new@example.com' },
    })
  ).rejects.toThrow(
    'UpdateUserProfile received unknown properties "email". Allowed properties are "userId", "profile", "name", and "image".'
  );
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', emailVerified: true, attributes: { a: 1 } },
    })
  ).rejects.toThrow('UpdateUserProfile received unknown properties "emailVerified", "attributes".');
});

test('UpdateUserProfile throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(UpdateUserProfile({ auth, properties: { profile: { a: 1 } } })).rejects.toThrow(
    'UpdateUserProfile requires a "userId" property.'
  );
});

test('UpdateUserProfile throws when profile is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', profile: 'not-an-object' } })
  ).rejects.toThrow('UpdateUserProfile "profile" is not an object. Received "not-an-object".');
});

test('UpdateUserProfile throws when name or image is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', name: 7 } })
  ).rejects.toThrow('UpdateUserProfile "name" is not a string. Received 7.');
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', image: 7 } })
  ).rejects.toThrow('UpdateUserProfile "image" is not a string. Received 7.');
});

test('UpdateUserProfile throws when no profile, name, or image is provided', async () => {
  const { auth } = createMockAuth();
  await expect(UpdateUserProfile({ auth, properties: { userId: 'user-1' } })).rejects.toThrow(
    'UpdateUserProfile requires at least one of "profile", "name", or "image" to write.'
  );
});

test('UpdateUserProfile throws when userId matches no user', async () => {
  const adapter = createAdapter({ user: null });
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'missing', profile: { a: 1 } } })
  ).rejects.toThrow('UpdateUserProfile found no user with id "missing".');
  expect(adapter.update).not.toHaveBeenCalled();
});
