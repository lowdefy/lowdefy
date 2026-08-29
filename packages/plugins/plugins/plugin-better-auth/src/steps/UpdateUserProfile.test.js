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
    user: { id: 'user-1', profile: { theme: 'light', locale: 'en' } },
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
    update: { profile: { theme: 'light', locale: 'de', plan: 'pro' } },
  });
  expect(result.profile).toEqual({ theme: 'light', locale: 'de', plan: 'pro' });
});

test('UpdateUserProfile removes a profile key set to null', async () => {
  const adapter = createAdapter({
    user: { id: 'user-1', profile: { theme: 'light', locale: 'en' } },
  });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', profile: { locale: null } },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { profile: { theme: 'light' } },
  });
});

test('UpdateUserProfile throws when a profile key is a reserved key', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { locale: 'en' } } });
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', profile: { ['__proto__']: { isAdmin: true } } },
    })
  ).rejects.toThrow(
    'UpdateUserProfile profile field "__proto__" is a reserved key and cannot be written to the user profile.'
  );
  expect(adapter.update).not.toHaveBeenCalled();
});

test('UpdateUserProfile throws when a reserved profile key is set to null', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { locale: 'en' } } });
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', profile: { ['constructor']: null } },
    })
  ).rejects.toThrow(
    'UpdateUserProfile profile field "constructor" is a reserved key and cannot be written to the user profile.'
  );
  expect(adapter.update).not.toHaveBeenCalled();
});

test('UpdateUserProfile writes no partial profile when a later field is a reserved key', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { locale: 'en' } } });
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', profile: { plan: 'pro', ['prototype']: 'x' } },
    })
  ).rejects.toThrow(
    'UpdateUserProfile profile field "prototype" is a reserved key and cannot be written to the user profile.'
  );
  expect(adapter.update).not.toHaveBeenCalled();
});

test('UpdateUserProfile writes the profile as the bag when the user has no existing profile', async () => {
  const adapter = createAdapter({ user: { id: 'user-1' } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', profile: { plan: 'pro' } },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { profile: { plan: 'pro' } },
  });
});

test('UpdateUserProfile sets the name and image display copies', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { plan: 'pro' } } });
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

test('UpdateUserProfile sets contactId as a top-level field, outside the profile bag', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { locale: 'en' } } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', contactId: 'contact-1' },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { contactId: 'contact-1' },
  });
});

// The link is not a profile key, so writing both must leave the bag untouched
// by contactId - the whole point of promoting it out of profile.
test('UpdateUserProfile keeps contactId out of the profile merge when both are written', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', profile: { locale: 'en' } } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', contactId: 'contact-1', profile: { plan: 'pro' } },
  });
  expect(adapter.update.mock.calls[0][0].update).toEqual({
    profile: { locale: 'en', plan: 'pro' },
    contactId: 'contact-1',
  });
});

test('UpdateUserProfile writes only profile, contactId, name, and image - never other user fields', async () => {
  const adapter = createAdapter({ user: { id: 'user-1', email: 'a@example.com' } });
  const { auth } = createMockAuth({ adapter });
  await UpdateUserProfile({
    auth,
    properties: {
      userId: 'user-1',
      profile: { plan: 'pro' },
      contactId: 'contact-1',
      name: 'New Name',
      image: 'https://img.example/a.png',
    },
  });
  expect(adapter.update.mock.calls[0][0].update).toEqual({
    profile: { plan: 'pro' },
    contactId: 'contact-1',
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
    'UpdateUserProfile received unknown properties "email". Allowed properties are "userId", "profile", "contactId", "name", "image", and "organizationId".'
  );
  await expect(
    UpdateUserProfile({
      auth,
      properties: { userId: 'user-1', emailVerified: true, attributes: { a: 1 } },
    })
  ).rejects.toThrow('UpdateUserProfile received unknown properties "emailVerified", "attributes".');
});

test('UpdateUserProfile accepts organizationId, which the floor reads and the step ignores', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const { auth } = createMockAuth({ adapter });

  await UpdateUserProfile({
    auth,
    properties: { userId: 'user-1', name: 'New Name', organizationId: 'org_customer' },
  });

  expect(adapter.update.mock.calls[0][0].update).toEqual({ name: 'New Name' });
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
  ).rejects.toThrow('UpdateUserProfile "profile" is not an object.');
});

test('UpdateUserProfile throws when name or image is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', name: 7 } })
  ).rejects.toThrow('UpdateUserProfile "name" is not a string.');
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', image: 7 } })
  ).rejects.toThrow('UpdateUserProfile "image" is not a string.');
});

test('UpdateUserProfile throws when contactId is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateUserProfile({ auth, properties: { userId: 'user-1', contactId: { id: 'contact-1' } } })
  ).rejects.toThrow('UpdateUserProfile "contactId" is not a string.');
});

test('UpdateUserProfile throws when no profile, contactId, name, or image is provided', async () => {
  const { auth } = createMockAuth();
  await expect(UpdateUserProfile({ auth, properties: { userId: 'user-1' } })).rejects.toThrow(
    'UpdateUserProfile requires at least one of "profile", "contactId", "name", or "image" to write.'
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

test('UpdateUserProfile declares the userId self-target exemption inside its authority', () => {
  expect(UpdateUserProfile.meta.authority.selfTargetExempt).toEqual('userId');
  expect(UpdateUserProfile.meta.selfTargetExempt).toBeUndefined();
});

test('UpdateUserProfile denormalizes name and image onto the member row of the resolved organization', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest
      .fn()
      .mockImplementation(async ({ model, update }) => ({ id: `${model}-1`, ...update })),
  };
  const { auth } = createMockAuth({ adapter });

  const result = await UpdateUserProfile({
    auth,
    organizationId: 'org-a',
    properties: { userId: 'user-1', name: 'Alice Anderson', image: 'data:image/svg;a' },
  });

  expect(adapter.update).toHaveBeenCalledTimes(2);
  expect(adapter.update.mock.calls[0][0]).toEqual({
    model: 'user',
    where: [{ field: 'id', value: 'user-1' }],
    update: { name: 'Alice Anderson', image: 'data:image/svg;a' },
  });
  expect(adapter.update.mock.calls[1][0]).toEqual({
    model: 'member',
    where: [
      { field: 'userId', value: 'user-1' },
      { field: 'organizationId', value: 'org-a' },
    ],
    update: { name: 'Alice Anderson', image: 'data:image/svg;a' },
  });
  // The step's return value is the user row, not the member denorm.
  expect(result.id).toEqual('user-1');
});

test('UpdateUserProfile skips the member denorm when no organizationId is resolved', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const { auth } = createMockAuth({ adapter });

  await UpdateUserProfile({
    auth,
    organizationId: null,
    properties: { userId: 'user-1', name: 'Alice Anderson' },
  });

  expect(adapter.update).toHaveBeenCalledTimes(1);
  expect(adapter.update.mock.calls[0][0].model).toEqual('user');
});

test('UpdateUserProfile skips the member denorm when only profile or contactId is written', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const { auth } = createMockAuth({ adapter });

  await UpdateUserProfile({
    auth,
    organizationId: 'org-a',
    properties: { userId: 'user-1', profile: { locale: 'en' }, contactId: 'contact-1' },
  });

  expect(adapter.update).toHaveBeenCalledTimes(1);
  expect(adapter.update.mock.calls[0][0].model).toEqual('user');
});

test('UpdateUserProfile does not denorm an empty-string display copy onto the member row', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const { auth } = createMockAuth({ adapter });

  await UpdateUserProfile({
    auth,
    organizationId: 'org-a',
    properties: { userId: 'user-1', name: '', image: 'data:image/svg;a' },
  });

  // name '' still writes the user row (existing contract) but only image
  // reaches the member copy - resolveMemberCaller coalesces on nullish, so an
  // empty member.name would mask the global fallback.
  expect(adapter.update).toHaveBeenCalledTimes(2);
  expect(adapter.update.mock.calls[1][0].update).toEqual({ image: 'data:image/svg;a' });
});

test('UpdateUserProfile tolerates a caller with no member row in the resolved organization', async () => {
  const adapter = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
    update: jest
      .fn()
      .mockImplementationOnce(async ({ update }) => ({ id: 'user-1', ...update }))
      // Adapter update on a no-match member returns null - selfTargetExempt
      // lets a caller save their own profile without membership there.
      .mockResolvedValueOnce(null),
  };
  const { auth } = createMockAuth({ adapter });

  const result = await UpdateUserProfile({
    auth,
    organizationId: 'org-a',
    properties: { userId: 'user-1', name: 'Alice Anderson' },
  });

  expect(adapter.update).toHaveBeenCalledTimes(2);
  expect(result).toEqual({ id: 'user-1', name: 'Alice Anderson' });
});
