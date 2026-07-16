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

import createAuthorize from './createAuthorize.js';

import { ConfigError } from '@lowdefy/errors';

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

  authorize = createAuthorize({ user: { sub: 'sub' } });
  expect(authorize({ auth })).toBe(true);
});

test('authorize role protected object', () => {
  const auth = { public: false, roles: ['role1'] };

  let authorize = createAuthorize({});
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ user: { sub: 'sub' } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ user: { sub: 'sub', roles: [] } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ user: { sub: 'sub', roles: ['role2'] } });
  expect(authorize({ auth })).toBe(false);

  authorize = createAuthorize({ user: { sub: 'sub', roles: ['role1'] } });
  expect(authorize({ auth })).toBe(true);

  authorize = createAuthorize({ user: { sub: 'sub', roles: ['role1', 'role2'] } });
  expect(authorize({ auth })).toBe(true);
});

test('throws ConfigError with helpful message when auth.public is undefined', () => {
  const authorize = createAuthorize({});
  // Message doesn't include Received - that's formatted by logger
  expect(() => authorize({ auth: { other: 'value' } })).toThrow(
    'auth.public must be true or false.'
  );
  expect(() => authorize({ auth: {} })).toThrow('auth.public must be true or false.');
});

test('throws ConfigError with received value when auth.public is wrong type', () => {
  const authorize = createAuthorize({});
  try {
    authorize({ auth: { public: 'yes' } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('auth.public must be true or false.');
    expect(e.received).toBe('yes');
  }
  try {
    authorize({ auth: { public: 1 } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(1);
  }
  try {
    authorize({ auth: { public: null } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(null);
  }
});

test('throws ConfigError when user.roles is a string', () => {
  try {
    createAuthorize({ user: { sub: 'sub', roles: 'admin' } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('user.roles must be an array of strings.');
    expect(e.received).toBe('admin');
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles is a number', () => {
  try {
    createAuthorize({ user: { sub: 'sub', roles: 42 } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(42);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles is an object', () => {
  try {
    createAuthorize({ user: { sub: 'sub', roles: { admin: true } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toEqual({ admin: true });
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles contains a non-string entry', () => {
  try {
    createAuthorize({ user: { sub: 'sub', roles: ['admin', 42] } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('user.roles must be an array of strings.');
    expect(e.received).toEqual(['admin', 42]);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('context.system true authorizes protected config without a user', () => {
  const authorize = createAuthorize({ user: null, system: true });
  expect(authorize({ auth: { public: false } })).toBe(true);
  expect(authorize({ auth: { public: true } })).toBe(true);
});

test('context.system true authorizes roles-protected config without a user', () => {
  const authorize = createAuthorize({ user: null, system: true });
  expect(authorize({ auth: { public: false, roles: ['admin'] } })).toBe(true);
});

test('an unset context.system applies the normal auth.public / auth.roles matching', () => {
  // createAuthorize is called with the whole context; a normal run has
  // context.system unset, so the blanket pass never triggers.
  const authorize = createAuthorize({ user: null });
  expect(authorize({ auth: { public: false } })).toBe(false);
  expect(authorize({ auth: { public: true } })).toBe(true);
});

test('throws ConfigError with configKey for location tracing', () => {
  const authorize = createAuthorize({});
  try {
    authorize({ auth: {}, '~k': 'pages[0:home].auth' });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.configKey).toBe('pages[0:home].auth');
    expect(e.message).toBe('auth.public must be true or false.');
    expect(e.received).toBeUndefined();
  }
});
