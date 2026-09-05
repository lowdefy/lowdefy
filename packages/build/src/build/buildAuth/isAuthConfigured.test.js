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

import isAuthConfigured from './isAuthConfigured.js';

test('isAuthConfigured returns false when auth is undefined', () => {
  const components = {};
  expect(isAuthConfigured({ components })).toBe(false);
});

test('isAuthConfigured returns false when auth is not an object', () => {
  const components = { auth: 'auth' };
  expect(isAuthConfigured({ components })).toBe(false);
});

test('isAuthConfigured returns false when auth is an empty object', () => {
  const components = { auth: {} };
  expect(isAuthConfigured({ components })).toBe(false);
});

test('isAuthConfigured returns false when auth only contains marker keys', () => {
  const components = {
    auth: {
      '~ignoreBuildChecks': true,
      '~r': {},
      '~l': {},
      '~k': '1',
    },
  };
  expect(isAuthConfigured({ components })).toBe(false);
});

test('isAuthConfigured returns true when auth has a non-marker key', () => {
  const components = {
    auth: {
      '~k': '1',
      secret: { _secret: 'BETTER_AUTH_SECRET' },
    },
  };
  expect(isAuthConfigured({ components })).toBe(true);
});

test('isAuthConfigured returns false when auth only declares dev config', () => {
  const components = {
    auth: {
      '~k': '1',
      dev: {
        mockUser: { id: 'u1', roles: ['admin'] },
      },
    },
  };
  expect(isAuthConfigured({ components })).toBe(false);
});

test('isAuthConfigured returns true when auth declares dev config alongside a mechanism', () => {
  const components = {
    auth: {
      dev: { mockUser: { id: 'u1' } },
      emailAndPassword: { enabled: true },
    },
  };
  expect(isAuthConfigured({ components })).toBe(true);
});
