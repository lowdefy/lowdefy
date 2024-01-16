/*
  Copyright 2020-2024 Lowdefy, Inc

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

import createAuthorize from './createAuthorize.js';

import { ServerError } from './errors.js';

test('authorize public object', () => {
  const auth = { public: true };
  let authorize = createAuthorize({});
  expect(authorize({ auth })).toBe(true);

  authorize = createAuthorize({ user: { sub: 'sub' } });
  expect(authorize({ auth })).toBe(true);
});

test('authorize protected object, no roles', () => {
  const auth = { public: false };

  let authorize = createAuthorize({});
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ session: { user: { sub: 'sub' } } });
  expect(authorize({ auth })).toBe(true);
});

test('authorize role protected object', () => {
  const auth = { public: false, roles: ['role1'] };

  let authorize = createAuthorize({});
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ session: { user: { sub: 'sub' } } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ session: { user: { sub: 'sub', roles: [] } } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ session: { user: { sub: 'sub', roles: ['role2'] } } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ session: { user: { sub: 'sub', roles: ['role1'] } } });
  expect(authorize({ auth })).toBe(true);

  authorize = createAuthorize({ session: { user: { sub: 'sub', roles: ['role1', 'role2'] } } });
  expect(authorize({ auth })).toBe(true);
});

test('invalid auth config', () => {
  const authorize = createAuthorize({});
  expect(() => authorize({ auth: { other: 'value' } })).toThrow(ServerError);
  expect(() => authorize({ auth: {} })).toThrow(ServerError);
  expect(() => authorize({})).toThrow();
  expect(() => authorize()).toThrow();
});
