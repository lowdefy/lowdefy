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

import matchPagePath from './matchPagePath.js';

function route(pageId, path = pageId) {
  return { pageId, path, auth: { public: true } };
}

const routes = [
  route('ticket', '{space}/tickets/{ticket_id}'),
  route('admin/users'),
  route('space-tickets', '{space}/tickets'),
  route('admin-section', 'admin/{section}'),
  route('support/ticket', 'support/{space}/tickets/{id}'),
  route('app-ticket', '{a}/{b}/tickets/{id}'),
  route('ticket-short', 'tickets/{space}/{id}'),
  route('users', 'org/users'),
];

test('matchPagePath matches a static page by its id', () => {
  expect(matchPagePath({ routes, path: 'admin/users' })).toEqual({
    pageId: 'admin/users',
    pathParams: {},
  });
});

test('matchPagePath returns the placeholder values of a patterned page', () => {
  expect(matchPagePath({ routes, path: 'support/tickets/1234' })).toEqual({
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: '1234' },
  });
});

test('matchPagePath prefers a fixed segment at the first position where patterns differ', () => {
  expect(matchPagePath({ routes, path: 'admin/tickets' })).toEqual({
    pageId: 'admin-section',
    pathParams: { section: 'tickets' },
  });
});

test('matchPagePath ranks a module pattern with a fixed entry segment over an app pattern', () => {
  expect(matchPagePath({ routes, path: 'support/x/tickets/1' })).toEqual({
    pageId: 'support/ticket',
    pathParams: { space: 'x', id: '1' },
  });
  expect(matchPagePath({ routes, path: 'other/x/tickets/1' })).toEqual({
    pageId: 'app-ticket',
    pathParams: { a: 'other', b: 'x', id: '1' },
  });
});

test('matchPagePath matches fixed segments case-sensitively and keeps the case of values', () => {
  expect(matchPagePath({ routes, path: 'Admin/users' })).toBe(null);
  expect(matchPagePath({ routes, path: 'Support/tickets/AbC' })).toEqual({
    pageId: 'ticket',
    pathParams: { space: 'Support', ticket_id: 'AbC' },
  });
});

test('matchPagePath strips one trailing slash', () => {
  expect(matchPagePath({ routes, path: 'tickets/support/1234/' })).toEqual({
    pageId: 'ticket-short',
    pathParams: { space: 'support', id: '1234' },
  });
});

test('matchPagePath matches nothing for any other empty segment', () => {
  expect(matchPagePath({ routes, path: 'tickets//1234' })).toBe(null);
  expect(matchPagePath({ routes, path: 'tickets/support/1234//' })).toBe(null);
  expect(matchPagePath({ routes, path: '/admin/users' })).toBe(null);
  expect(matchPagePath({ routes, path: '' })).toBe(null);
});

test('matchPagePath decodes each segment once', () => {
  expect(matchPagePath({ routes, path: 'tickets/a%2Fb/1' })).toEqual({
    pageId: 'ticket-short',
    pathParams: { space: 'a/b', id: '1' },
  });
  expect(matchPagePath({ routes, path: 'tickets/a+b/1' })).toEqual(
    matchPagePath({ routes, path: 'tickets/a%2Bb/1' })
  );
  expect(matchPagePath({ routes, path: 'tickets/a+b/1' }).pathParams.space).toBe('a+b');
  expect(matchPagePath({ routes, path: 'tickets/100%2525/1' }).pathParams.space).toBe('100%25');
});

test('matchPagePath matches nothing for a segment that fails to decode', () => {
  expect(matchPagePath({ routes, path: 'tickets/%E0%A4%A/1' })).toBe(null);
});

test('matchPagePath matches nothing for a dot segment', () => {
  expect(matchPagePath({ routes, path: 'tickets/%2E%2E/1' })).toBe(null);
  expect(matchPagePath({ routes, path: 'tickets/%2e/1' })).toBe(null);
  expect(matchPagePath({ routes, path: 'tickets/../1' })).toBe(null);
  expect(matchPagePath({ routes, path: 'tickets/./1' })).toBe(null);
});

test('matchPagePath treats values with dots as ordinary', () => {
  expect(matchPagePath({ routes, path: 'tickets/v1.2/1' })).toEqual({
    pageId: 'ticket-short',
    pathParams: { space: 'v1.2', id: '1' },
  });
  expect(matchPagePath({ routes, path: 'tickets/a..b/1' }).pathParams.space).toBe('a..b');
});

test('matchPagePath serves a page with a fixed path at its path, not its id', () => {
  expect(matchPagePath({ routes, path: 'org/users' })).toEqual({
    pageId: 'users',
    pathParams: {},
  });
  expect(matchPagePath({ routes, path: 'users' })).toBe(null);
});

test('matchPagePath returns null when no pattern has the same number of segments', () => {
  expect(matchPagePath({ routes, path: 'a/b/c/d/e' })).toBe(null);
});
