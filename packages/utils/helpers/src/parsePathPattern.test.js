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

import parsePathPattern from './parsePathPattern.js';

test('parsePathPattern splits fixed segments and placeholders', () => {
  expect(parsePathPattern('tickets/{space}/{ticket_id}')).toEqual([
    { fixed: 'tickets' },
    { name: 'space' },
    { name: 'ticket_id' },
  ]);
});

test('parsePathPattern accepts a single placeholder', () => {
  expect(parsePathPattern('{slug}')).toEqual([{ name: 'slug' }]);
});

test('parsePathPattern accepts a leading placeholder', () => {
  expect(parsePathPattern('{space}/tickets/{ticket_id}')).toEqual([
    { name: 'space' },
    { fixed: 'tickets' },
    { name: 'ticket_id' },
  ]);
});

test('parsePathPattern accepts a pattern with no placeholders', () => {
  expect(parsePathPattern('admin/users')).toEqual([{ fixed: 'admin' }, { fixed: 'users' }]);
});

test('parsePathPattern accepts every character page ids allow in fixed segments', () => {
  expect(parsePathPattern('a-Z_0:9/{_x1}')).toEqual([{ fixed: 'a-Z_0:9' }, { name: '_x1' }]);
});

test('parsePathPattern throws when the path is not a string', () => {
  expect(() => parsePathPattern({ slug: null })).toThrow(
    'Page path must be a string. Received {"slug":null}.'
  );
});

test('parsePathPattern throws on a leading slash', () => {
  expect(() => parsePathPattern('/tickets/{id}')).toThrow(
    'Page path "/tickets/{id}" must not start or end with "/".'
  );
});

test('parsePathPattern throws on a trailing slash', () => {
  expect(() => parsePathPattern('tickets/{id}/')).toThrow(
    'Page path "tickets/{id}/" must not start or end with "/".'
  );
});

test('parsePathPattern throws on an empty segment', () => {
  expect(() => parsePathPattern('tickets//{id}')).toThrow(
    'Page path "tickets//{id}" has an empty segment.'
  );
});

test('parsePathPattern throws on an empty path', () => {
  expect(() => parsePathPattern('')).toThrow('Page path "" has an empty segment.');
});

test('parsePathPattern throws on a placeholder that is part of a segment', () => {
  expect(() => parsePathPattern('tickets/ticket-{id}')).toThrow(
    'Page path "tickets/ticket-{id}" has a placeholder inside segment "ticket-{id}".'
  );
  expect(() => parsePathPattern('{id}-ticket')).toThrow(
    'Page path "{id}-ticket" has a placeholder inside segment "{id}-ticket".'
  );
});

test('parsePathPattern throws on a catch-all placeholder', () => {
  expect(() => parsePathPattern('docs/{...rest}')).toThrow(
    'Page path "docs/{...rest}" has a catch-all placeholder "{...rest}".'
  );
});

test('parsePathPattern throws on an optional placeholder', () => {
  expect(() => parsePathPattern('tickets/{id?}')).toThrow(
    'Page path "tickets/{id?}" has an optional placeholder "{id?}".'
  );
  expect(() => parsePathPattern('tickets/{?id}')).toThrow(
    'Page path "tickets/{?id}" has an optional placeholder "{?id}".'
  );
});

test('parsePathPattern throws on placeholder names that are not identifiers', () => {
  expect(() => parsePathPattern('tickets/{1id}')).toThrow(
    'Page path "tickets/{1id}" has an invalid placeholder "{1id}".'
  );
  expect(() => parsePathPattern('tickets/{ticket-id}')).toThrow(
    'Page path "tickets/{ticket-id}" has an invalid placeholder "{ticket-id}".'
  );
  expect(() => parsePathPattern('tickets/{}')).toThrow(
    'Page path "tickets/{}" has an invalid placeholder "{}".'
  );
});

test('parsePathPattern throws on a placeholder name used twice', () => {
  expect(() => parsePathPattern('{id}/tickets/{id}')).toThrow(
    'Page path "{id}/tickets/{id}" uses placeholder "{id}" more than once.'
  );
});

test('parsePathPattern throws on fixed segments with characters page ids do not allow', () => {
  expect(() => parsePathPattern('tickets/new item')).toThrow(
    'Page path "tickets/new item" segment "new item" contains invalid characters.'
  );
  expect(() => parsePathPattern('tickets#1/{id}')).toThrow(
    'Page path "tickets#1/{id}" segment "tickets#1" contains invalid characters.'
  );
  expect(() => parsePathPattern('tickets.list')).toThrow(
    'Page path "tickets.list" segment "tickets.list" contains invalid characters.'
  );
});

test('parsePathPattern returns the same frozen segments for the same pattern', () => {
  const first = parsePathPattern('cached/{space}/{ticket_id}');
  const second = parsePathPattern('cached/{space}/{ticket_id}');
  expect(second).toBe(first);
  expect(Object.isFrozen(first)).toBe(true);
  first.forEach((segment) => expect(Object.isFrozen(segment)).toBe(true));
  expect(() => first.push({ fixed: 'x' })).toThrow();
});

test('parsePathPattern throws on every call for an invalid pattern', () => {
  expect(() => parsePathPattern('cached/{id?}')).toThrow(
    'Page path "cached/{id?}" has an optional placeholder "{id?}".'
  );
  expect(() => parsePathPattern('cached/{id?}')).toThrow(
    'Page path "cached/{id?}" has an optional placeholder "{id?}".'
  );
});
