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

import pageInstanceKey from './pageInstanceKey.js';

const path = 'tickets/{space}/{ticket_id}';

test('pageInstanceKey returns page:{pageId} when the page has no path', () => {
  expect(pageInstanceKey({ pageId: 'admin/users' })).toBe('page:admin/users');
});

test('pageInstanceKey returns page:{pageId} when the path has no placeholders', () => {
  expect(pageInstanceKey({ pageId: 'users', path: 'admin/users' })).toBe('page:users');
});

test('pageInstanceKey keys a patterned page by the path its values build', () => {
  expect(
    pageInstanceKey({
      pageId: 'tickets',
      path,
      pathParams: { space: 'support', ticket_id: '1234' },
    })
  ).toBe('page:tickets#tickets/support/1234');
});

test('pageInstanceKey gives one key for a value however the arriving URL spelled it', () => {
  const key = (space) =>
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space, ticket_id: '1' } });
  const fromPlus = decodeURIComponent('a+b');
  const fromEncodedPlus = decodeURIComponent('a%2Bb');
  expect(fromPlus).toBe('a+b');
  expect(fromEncodedPlus).toBe('a+b');
  expect(key(fromPlus)).toBe('page:tickets#tickets/a%2Bb/1');
  expect(key(fromEncodedPlus)).toBe(key(fromPlus));
});

test('pageInstanceKey gives different keys for different values', () => {
  const key = (ticket_id) =>
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: 'support', ticket_id } });
  expect(key('1')).not.toBe(key('2'));
});

test('pageInstanceKey encodes "#" in values so the key stays unambiguous', () => {
  expect(
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: 'a#b', ticket_id: '1' } })
  ).toBe('page:tickets#tickets/a%23b/1');
});

test('pageInstanceKey treats a number value as its string', () => {
  expect(
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: 'support', ticket_id: 7 } })
  ).toBe(
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: 'support', ticket_id: '7' } })
  );
});

test('pageInstanceKey throws when a value is missing', () => {
  expect(() =>
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: 'support' } })
  ).toThrow('Link to page "tickets" is missing a value for path placeholder "ticket_id".');
});

test('pageInstanceKey throws when a value is a dot segment', () => {
  expect(() =>
    pageInstanceKey({ pageId: 'tickets', path, pathParams: { space: '..', ticket_id: '1' } })
  ).toThrow('Link to page "tickets" has the value ".." for path placeholder "space".');
});
