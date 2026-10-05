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

import buildPagePath from './buildPagePath.js';

const path = 'tickets/{space}/{ticket_id}';

test('buildPagePath returns the page id when the page has no path', () => {
  expect(buildPagePath({ pageId: 'admin/users' })).toBe('admin/users');
  expect(buildPagePath({ pageId: 'admin/users', pathParams: { id: '1' } })).toBe('admin/users');
});

test('buildPagePath returns a path with no placeholders as it is', () => {
  expect(buildPagePath({ pageId: 'users', path: 'admin/users' })).toBe('admin/users');
});

test('buildPagePath fills placeholders with their values', () => {
  expect(
    buildPagePath({ pageId: 'ticket', path, pathParams: { space: 'support', ticket_id: '1234' } })
  ).toBe('tickets/support/1234');
});

test('buildPagePath fills a single placeholder', () => {
  expect(buildPagePath({ pageId: 'post', path: '{slug}', pathParams: { slug: 'hello' } })).toBe(
    'hello'
  );
});

test('buildPagePath fills a leading placeholder', () => {
  expect(
    buildPagePath({
      pageId: 'ticket',
      path: '{space}/tickets/{ticket_id}',
      pathParams: { space: 'support', ticket_id: '1234' },
    })
  ).toBe('support/tickets/1234');
});

test('buildPagePath converts number values to strings', () => {
  expect(
    buildPagePath({ pageId: 'ticket', path, pathParams: { space: 'support', ticket_id: 1234 } })
  ).toBe('tickets/support/1234');
  expect(
    buildPagePath({ pageId: 'ticket', path, pathParams: { space: 'support', ticket_id: 0 } })
  ).toBe('tickets/support/0');
});

test('buildPagePath encodes reserved and non-ASCII characters in values', () => {
  const build = (space) =>
    buildPagePath({ pageId: 'ticket', path, pathParams: { space, ticket_id: '1' } });
  expect(build('a/b')).toBe('tickets/a%2Fb/1');
  expect(build('a#b')).toBe('tickets/a%23b/1');
  expect(build('a+b')).toBe('tickets/a%2Bb/1');
  expect(build('100%')).toBe('tickets/100%25/1');
  expect(build('a b')).toBe('tickets/a%20b/1');
  expect(build('café')).toBe('tickets/caf%C3%A9/1');
  expect(build('支持')).toBe('tickets/%E6%94%AF%E6%8C%81/1');
});

test('buildPagePath throws when a value is missing', () => {
  expect(() => buildPagePath({ pageId: 'ticket', path, pathParams: { space: 'support' } })).toThrow(
    'Link to page "ticket" is missing a value for path placeholder "ticket_id".'
  );
  expect(() => buildPagePath({ pageId: 'ticket', path })).toThrow(
    'Link to page "ticket" is missing a value for path placeholder "space".'
  );
});

test('buildPagePath throws when a value is null', () => {
  expect(() =>
    buildPagePath({ pageId: 'ticket', path, pathParams: { space: 'support', ticket_id: null } })
  ).toThrow('Link to page "ticket" is missing a value for path placeholder "ticket_id".');
});

test('buildPagePath throws when a value is empty', () => {
  expect(() =>
    buildPagePath({ pageId: 'ticket', path, pathParams: { space: '', ticket_id: '1' } })
  ).toThrow('Link to page "ticket" is missing a value for path placeholder "space".');
});

test('buildPagePath ignores keys the pattern does not use', () => {
  expect(
    buildPagePath({
      pageId: 'ticket',
      path,
      pathParams: { space: 'support', ticket_id: '1', tab: 'notes' },
    })
  ).toBe('tickets/support/1');
});

test('buildPagePath throws on an invalid pattern', () => {
  expect(() =>
    buildPagePath({ pageId: 'ticket', path: 'tickets/{id?}', pathParams: { id: '1' } })
  ).toThrow('Page path "tickets/{id?}" has an optional placeholder "{id?}".');
});
