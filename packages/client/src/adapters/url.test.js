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

import { createUrl, parsePageId } from './url.js';

test('createUrl joins basePath, pathname and string query', () => {
  expect(createUrl({ pathname: '/page-1' })).toBe('/page-1');
  expect(createUrl({ basePath: '/admin', pathname: '/page-1' })).toBe('/admin/page-1');
  expect(createUrl({ pathname: '/page-1', query: 'a=1&b=2' })).toBe('/page-1?a=1&b=2');
  expect(createUrl({ basePath: '/admin', pathname: '/p', query: 'x=1' })).toBe('/admin/p?x=1');
});

test('createUrl serializes object queries with URLSearchParams', () => {
  expect(createUrl({ pathname: '/p', query: { a: '1', b: 'two words' } })).toBe(
    '/p?a=1&b=two+words'
  );
});

test('createUrl ignores empty query values', () => {
  expect(createUrl({ pathname: '/p', query: undefined })).toBe('/p');
  expect(createUrl({ pathname: '/p', query: '' })).toBe('/p');
});

test('parsePageId extracts page ids including nested ids', () => {
  expect(parsePageId('http://localhost/page-1')).toBe('page-1');
  expect(parsePageId('http://localhost/admin/users/list')).toBe('admin/users/list');
  expect(parsePageId('http://localhost/page-1?x=1')).toBe('page-1');
  expect(parsePageId('/relative-page')).toBe('relative-page');
});

test('parsePageId returns null for the root path', () => {
  expect(parsePageId('http://localhost/')).toBe(null);
});

test('parsePageId strips basePath', () => {
  expect(parsePageId('http://localhost/admin/page-1', '/admin')).toBe('page-1');
  expect(parsePageId('http://localhost/admin/', '/admin')).toBe(null);
  expect(parsePageId('http://localhost/admin/a/b', '/admin')).toBe('a/b');
});
