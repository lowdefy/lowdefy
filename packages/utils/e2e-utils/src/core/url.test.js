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

import { createTargetLocation } from './url.js';

test('createTargetLocation adds a query key to a url that has none', () => {
  expect(
    createTargetLocation({ href: 'http://localhost:3000/items', key: 'page', value: '2' })
  ).toEqual({ pathname: '/items', query: 'page=2' });
});

test('createTargetLocation overwrites an existing query key', () => {
  expect(
    createTargetLocation({ href: 'http://localhost:3000/items?page=1', key: 'page', value: '2' })
  ).toEqual({ pathname: '/items', query: 'page=2' });
});

test('createTargetLocation preserves unrelated query keys', () => {
  expect(
    createTargetLocation({
      href: 'http://localhost:3000/items?filter=active&page=1',
      key: 'page',
      value: '2',
    })
  ).toEqual({ pathname: '/items', query: 'filter=active&page=2' });
});

test('createTargetLocation deletes the query key when value is null', () => {
  expect(
    createTargetLocation({
      href: 'http://localhost:3000/items?filter=active&page=1',
      key: 'page',
      value: null,
    })
  ).toEqual({ pathname: '/items', query: 'filter=active' });
});

test('createTargetLocation deletes the query key when value is undefined', () => {
  expect(createTargetLocation({ href: 'http://localhost:3000/items?page=1', key: 'page' })).toEqual(
    { pathname: '/items', query: '' }
  );
});

test('createTargetLocation keeps a value of 0, which is not a none value', () => {
  expect(
    createTargetLocation({ href: 'http://localhost:3000/items', key: 'page', value: 0 })
  ).toEqual({ pathname: '/items', query: 'page=0' });
});

test('createTargetLocation keeps an empty string value, which is not a none value', () => {
  expect(
    createTargetLocation({ href: 'http://localhost:3000/items', key: 'filter', value: '' })
  ).toEqual({ pathname: '/items', query: 'filter=' });
});

test('createTargetLocation strips basePath from the pathname so the router does not double it', () => {
  expect(
    createTargetLocation({
      basePath: '/app',
      href: 'http://localhost:3000/app/items?page=1',
      key: 'page',
      value: '2',
    })
  ).toEqual({ pathname: '/items', query: 'page=2' });
});

test('createTargetLocation leaves the pathname alone when it does not start with basePath', () => {
  expect(
    createTargetLocation({
      basePath: '/app',
      href: 'http://localhost:3000/items',
      key: 'page',
      value: '2',
    })
  ).toEqual({ pathname: '/items', query: 'page=2' });
});

test('createTargetLocation returns the root pathname for the home page', () => {
  expect(createTargetLocation({ href: 'http://localhost:3000/', key: 'page', value: '2' })).toEqual(
    { pathname: '/', query: 'page=2' }
  );
});

test('createTargetLocation encodes values that need escaping', () => {
  expect(
    createTargetLocation({ href: 'http://localhost:3000/items', key: 'q', value: 'a b&c' })
  ).toEqual({ pathname: '/items', query: 'q=a+b%26c' });
});

test('createTargetLocation keeps nested page ids in the pathname', () => {
  expect(
    createTargetLocation({
      href: 'http://localhost:3000/users/settings?tab=profile',
      key: 'tab',
      value: 'billing',
    })
  ).toEqual({ pathname: '/users/settings', query: 'tab=billing' });
});
