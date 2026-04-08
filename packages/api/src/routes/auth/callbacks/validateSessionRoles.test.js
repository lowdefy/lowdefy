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

import { ConfigError } from '@lowdefy/errors';

import validateSessionRoles from './validateSessionRoles.js';

test('does not throw when session.user.roles is undefined', () => {
  expect(() => validateSessionRoles({ session: { user: {} } })).not.toThrow();
});

test('does not throw when session.user.roles is null', () => {
  expect(() => validateSessionRoles({ session: { user: { roles: null } } })).not.toThrow();
});

test('does not throw when session.user is undefined', () => {
  expect(() => validateSessionRoles({ session: {} })).not.toThrow();
});

test('does not throw when session.user.roles is an empty array', () => {
  expect(() => validateSessionRoles({ session: { user: { roles: [] } } })).not.toThrow();
});

test('does not throw when session.user.roles is an array of strings', () => {
  expect(() =>
    validateSessionRoles({ session: { user: { roles: ['admin', 'editor'] } } })
  ).not.toThrow();
});

test('throws ConfigError when session.user.roles is a string', () => {
  try {
    validateSessionRoles({ session: { user: { roles: 'admin' } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe(
      'session.user.roles must be an array of strings. Check auth.userFields configuration and custom session callback plugins.'
    );
    expect(e.received).toBe('admin');
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when session.user.roles is a number', () => {
  try {
    validateSessionRoles({ session: { user: { roles: 42 } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(42);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when session.user.roles is an object', () => {
  const roles = { admin: true };
  try {
    validateSessionRoles({ session: { user: { roles } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toEqual({ admin: true });
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when session.user.roles contains a non-string element', () => {
  const roles = [123];
  try {
    validateSessionRoles({ session: { user: { roles } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toEqual([123]);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when session.user.roles contains mixed string and non-string elements', () => {
  const roles = ['admin', 123];
  try {
    validateSessionRoles({ session: { user: { roles } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toEqual(['admin', 123]);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});
