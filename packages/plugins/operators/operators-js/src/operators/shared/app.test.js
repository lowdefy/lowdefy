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

import _app from './app.js';

test('_app dynamic is false', () => {
  expect(_app.dynamic).toBe(false);
});

test('_app returns value at key', () => {
  expect(_app({ params: 'slug', lowdefyApp: { slug: 'my-app' } })).toBe('my-app');
});

test('_app throws ConfigError when slug is referenced but unset', () => {
  expect(() => _app({ params: 'slug', lowdefyApp: {} })).toThrow(ConfigError);
});

test('_app throws ConfigError when slug is referenced but null', () => {
  expect(() => _app({ params: 'slug', lowdefyApp: { slug: null } })).toThrow(ConfigError);
});

test('_app returns null for a non-slug field that is unset', () => {
  expect(_app({ params: 'name', lowdefyApp: {} })).toBeNull();
});

test('_app object form with default does not throw when slug is unset', () => {
  expect(_app({ params: { key: 'slug', default: 'x' }, lowdefyApp: {} })).toBe('x');
});

test('_app returns null for unknown top-level key', () => {
  expect(_app({ params: 'missing', lowdefyApp: { slug: 'my-app' } })).toBeNull();
});

test('_app dot-path against flat shape returns null (forward-compat)', () => {
  expect(_app({ params: 'name.unknown', lowdefyApp: { name: 'My App' } })).toBeNull();
});

test('_app returns whole object when params is true', () => {
  const lowdefyApp = { slug: 'my-app', name: 'My App' };
  expect(_app({ params: true, lowdefyApp })).toEqual(lowdefyApp);
});

test('_app integer params indexes into array lowdefyApp', () => {
  expect(_app({ params: 1, lowdefyApp: ['a', 'b', 'c'] })).toBe('b');
});

test('_app object params with default returns default for missing key', () => {
  expect(
    _app({
      params: { key: 'gitSha', default: 'dev' },
      lowdefyApp: {},
    })
  ).toBe('dev');
});

test('_app object params with default returns value when key exists', () => {
  expect(
    _app({
      params: { key: 'gitSha', default: 'dev' },
      lowdefyApp: { gitSha: 'abc123' },
    })
  ).toBe('abc123');
});

test('_app returns null when lowdefyApp is undefined', () => {
  expect(_app({ params: 'name', lowdefyApp: undefined })).toBeNull();
});

test('_app invalid params type throws', () => {
  expect(() => _app({ params: null, lowdefyApp: { slug: 'my-app' } })).toThrow();
});

test('_app forwards arguments to getFromObject', async () => {
  const { jest } = await import('@jest/globals');
  jest.resetModules();
  jest.unstable_mockModule('@lowdefy/operators', () => ({
    getFromObject: jest.fn(),
  }));
  const lowdefyOperators = await import('@lowdefy/operators');
  const _appMocked = (await import('./app.js')).default;
  _appMocked({
    arrayIndices: [0],
    location: 'location',
    params: 'name',
    lowdefyApp: { name: 'My App' },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: { name: 'My App' },
        operator: '_app',
        params: 'name',
      },
    ],
  ]);
});
