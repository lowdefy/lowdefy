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

import validateId from './validateId.js';

test('validateId allows valid ids', () => {
  expect(() => validateId({ id: 'my-page', field: 'Page id', configKey: '1' })).not.toThrow();
  expect(() => validateId({ id: 'my_page', field: 'Page id', configKey: '1' })).not.toThrow();
  expect(() => validateId({ id: 'MyPage123', field: 'Page id', configKey: '1' })).not.toThrow();
  expect(() =>
    validateId({ id: 'folder/page', field: 'Page id', configKey: '1' })
  ).not.toThrow();
  expect(() =>
    validateId({ id: ':reject', field: 'Page id', configKey: '1' })
  ).not.toThrow();
});

test('validateId throws on period', () => {
  expect(() => validateId({ id: 'my.page', field: 'Page id', configKey: '1' })).toThrow(
    'Page id "my.page" contains invalid characters'
  );
});

test('validateId throws on path traversal', () => {
  expect(() => validateId({ id: '../secret', field: 'Page id', configKey: '1' })).toThrow(
    'contains invalid characters'
  );
});

test('validateId throws on spaces', () => {
  expect(() => validateId({ id: 'my page', field: 'Page id', configKey: '1' })).toThrow(
    'contains invalid characters'
  );
});

test('validateId throws on special characters', () => {
  expect(() => validateId({ id: '<script>', field: 'Page id', configKey: '1' })).toThrow(
    'contains invalid characters'
  );
});

test('validateId includes location in error message', () => {
  expect(() =>
    validateId({ id: 'bad id', field: 'Request id', location: 'page "home"', configKey: '1' })
  ).toThrow('Request id "bad id" at page "home" contains invalid characters');
});

test('validateId throws ConfigError', () => {
  try {
    validateId({ id: 'bad!id', field: 'Page id', configKey: '1' });
  } catch (e) {
    expect(e.isLowdefyError).toBe(true);
  }
});
