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

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('user calls getFromObject when no method is used', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const user = (await import('./user.js')).default;

  user({
    arrayIndices: [0],
    location: 'location',
    params: 'params',
    user: { name: 'first name' },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: {
          name: 'first name',
        },
        operator: '_user',
        params: 'params',
      },
    ],
  ]);
});

test('_user.hasRole returns true when user has the role', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasRole',
      params: 'admin',
      user: { roles: ['admin', 'support'] },
    })
  ).toBe(true);
});

test('_user.hasRole returns false when user does not have the role', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasRole',
      params: 'admin',
      user: { roles: ['viewer'] },
    })
  ).toBe(false);
});

test('_user.hasRole returns false when user has no roles', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasRole',
      params: 'admin',
      user: {},
    })
  ).toBe(false);
});

test('_user.hasRole returns false when user is not logged in', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasRole',
      params: 'admin',
      user: undefined,
    })
  ).toBe(false);
});

test('_user.hasRole throws when params is not a string', async () => {
  const user = (await import('./user.js')).default;
  expect(() =>
    user({
      methodName: 'hasRole',
      params: ['admin'],
      user: { roles: ['admin'] },
    })
  ).toThrow('_user.hasRole accepts a string. Received ["admin"].');
});

test('_user.hasSomeRoles returns true when user has at least one of the required roles', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasSomeRoles',
      params: ['admin', 'support'],
      user: { roles: ['support'] },
    })
  ).toBe(true);
});

test('_user.hasSomeRoles returns false when user has none of the required roles', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasSomeRoles',
      params: ['admin', 'support'],
      user: { roles: ['viewer'] },
    })
  ).toBe(false);
});

test('_user.hasSomeRoles returns false when user has no roles', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasSomeRoles',
      params: ['admin'],
      user: {},
    })
  ).toBe(false);
});

test('_user.hasSomeRoles returns false when user is not logged in', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasSomeRoles',
      params: ['admin'],
      user: undefined,
    })
  ).toBe(false);
});

test('_user.hasAllRoles returns true when user has every required role', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasAllRoles',
      params: ['admin', 'support'],
      user: { roles: ['admin', 'support', 'viewer'] },
    })
  ).toBe(true);
});

test('_user.hasAllRoles returns false when user is missing any required role', async () => {
  const user = (await import('./user.js')).default;
  expect(
    user({
      methodName: 'hasAllRoles',
      params: ['admin', 'support'],
      user: { roles: ['admin'] },
    })
  ).toBe(false);
});

test('_user.hasSomeRoles and _user.hasAllRoles throw when params is not an array of strings', async () => {
  const user = (await import('./user.js')).default;
  expect(() =>
    user({
      methodName: 'hasSomeRoles',
      params: 'admin',
      user: { roles: ['admin'] },
    })
  ).toThrow('_user.hasSomeRoles accepts an array of strings. Received "admin".');
  expect(() =>
    user({
      methodName: 'hasAllRoles',
      params: ['admin', 3],
      user: { roles: ['admin'] },
    })
  ).toThrow('_user.hasAllRoles accepts an array of strings. Received ["admin",3].');
});

test('_user role methods throw when user.roles is not an array', async () => {
  const user = (await import('./user.js')).default;
  expect(() =>
    user({
      methodName: 'hasRole',
      params: 'admin',
      user: { roles: 'admin' },
    })
  ).toThrow('_user.hasRole expects "user.roles" to be an array of strings. Received "admin".');
});

test('_user throws when an unknown method is used', async () => {
  const user = (await import('./user.js')).default;
  expect(() =>
    user({
      methodName: 'isAdmin',
      params: 'admin',
      user: { roles: ['admin'] },
    })
  ).toThrow(
    '_user.isAdmin is not supported, use one of the following: hasRole, hasSomeRoles, hasAllRoles.'
  );
});
