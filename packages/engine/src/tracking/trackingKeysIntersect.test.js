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

import normalizeTrackingKey from './normalizeTrackingKey.js';
import readsIntersectChanges from './readsIntersectChanges.js';
import trackingKeysIntersect from './trackingKeysIntersect.js';

function intersect(read, change) {
  return trackingKeysIntersect({
    read: normalizeTrackingKey(read),
    change: normalizeTrackingKey(change),
  });
}

test('trackingKeysIntersect matches the same key', () => {
  expect(intersect('state:a.b', 'state:a.b')).toBe(true);
  expect(intersect('request:getUsers', 'request:getUsers')).toBe(true);
  expect(intersect('i18n', 'i18n')).toBe(true);
});

test('trackingKeysIntersect matches a change to a parent path of the read', () => {
  expect(intersect('state:a.b.c', 'state:a')).toBe(true);
  expect(intersect('state:list.0.name', 'state:list')).toBe(true);
});

test('trackingKeysIntersect matches a change to a child path of the read', () => {
  expect(intersect('state:a', 'state:a.b.c')).toBe(true);
  expect(intersect('state:list', 'state:list.3.name')).toBe(true);
});

test('trackingKeysIntersect splits paths only at dot boundaries', () => {
  expect(intersect('state:ab', 'state:a')).toBe(false);
  expect(intersect('state:a', 'state:ab')).toBe(false);
  expect(intersect('state:a.bc', 'state:a.b')).toBe(false);
  expect(intersect('state:list.10', 'state:list.1')).toBe(false);
});

test('trackingKeysIntersect does not match sibling paths', () => {
  expect(intersect('state:a.b', 'state:a.c')).toBe(false);
});

test('trackingKeysIntersect does not match across namespaces', () => {
  expect(intersect('state:a', 'global:a')).toBe(false);
  expect(intersect('request:a', 'state:a')).toBe(false);
  expect(intersect('state:*', 'global:a')).toBe(false);
});

test('trackingKeysIntersect treats a wildcard, an empty path or a bare namespace as the whole namespace', () => {
  expect(intersect('state:*', 'state:a.b')).toBe(true);
  expect(intersect('state:a.b', 'state:*')).toBe(true);
  expect(intersect('state:', 'state:a')).toBe(true);
  expect(intersect('eventLog', 'eventLog:0')).toBe(true);
  expect(intersect('eventLog:0', 'eventLog')).toBe(true);
});

test('trackingKeysIntersect matches an escaped dotted key with the dotted read get falls back to', () => {
  // get('a.b.c') falls back to state['a.b'].c, which a write addresses as 'a\\.b.c'.
  expect(intersect('state:a.b.c', 'state:a\\.b.c')).toBe(true);
  expect(intersect('state:a.b.c', 'state:a\\.b')).toBe(true);
  expect(intersect('state:a\\.b', 'state:a.b.c')).toBe(true);
});

test('normalizeTrackingKey unescapes paths and leaves plain keys unchanged', () => {
  expect(normalizeTrackingKey('state:a\\.b.c')).toEqual('state:a.b.c');
  expect(normalizeTrackingKey('state:a.b')).toEqual('state:a.b');
  expect(normalizeTrackingKey('menu')).toEqual('menu');
});

test('readsIntersectChanges is true when any read intersects any change', () => {
  const reads = new Set(['state:a', 'request:r1']);
  expect(readsIntersectChanges({ reads, changes: ['state:b', 'request:r1'] })).toBe(true);
  expect(readsIntersectChanges({ reads, changes: ['state:b', 'request:r2'] })).toBe(false);
  expect(readsIntersectChanges({ reads, changes: [] })).toBe(false);
  expect(readsIntersectChanges({ reads: new Set(), changes: ['state:a'] })).toBe(false);
});
