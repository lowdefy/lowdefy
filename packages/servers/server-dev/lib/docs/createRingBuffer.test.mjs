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

import { jest } from '@jest/globals';

const { default: createRingBuffer } = await import('./createRingBuffer.js');

function createBuffer({ max = 3, dedupeKey = (entry) => entry.key } = {}) {
  const onStore = jest.fn();
  return { buffer: createRingBuffer({ max, dedupeKey, onStore }), onStore };
}

test('createRingBuffer push stores an entry, lists it and calls onStore', () => {
  const { buffer, onStore } = createBuffer();
  const entry = { key: 'a', message: 'first' };

  expect(buffer.push(entry)).toBe(true);
  expect(buffer.list()).toEqual([entry]);
  expect(onStore).toHaveBeenCalledWith(entry);
});

test('createRingBuffer list returns a copy that does not alias the buffer', () => {
  const { buffer } = createBuffer();
  buffer.push({ key: 'a' });
  buffer.list().push({ key: 'b' });

  expect(buffer.list()).toEqual([{ key: 'a' }]);
});

test('createRingBuffer collapses a duplicate onto the stored entry with a count and lastSeen', () => {
  const { buffer, onStore } = createBuffer();
  buffer.push({ key: 'a', message: 'first' });

  expect(buffer.push({ key: 'a', message: 'first', timestamp: '2026-01-02T00:00:00.000Z' })).toBe(
    false
  );
  expect(buffer.push({ key: 'a', message: 'first', timestamp: '2026-01-03T00:00:00.000Z' })).toBe(
    false
  );
  expect(buffer.list()).toEqual([
    { key: 'a', message: 'first', count: 3, lastSeen: '2026-01-03T00:00:00.000Z' },
  ]);
  expect(onStore).toHaveBeenCalledTimes(1);
});

test('createRingBuffer stores every entry whose dedupe key is null or undefined', () => {
  const { buffer } = createBuffer();
  buffer.push({ message: 'no key' });
  buffer.push({ key: null, message: 'no key' });

  expect(buffer.list().length).toBe(2);
});

test('createRingBuffer at capacity still reports a stored entry and still calls onStore', () => {
  const { buffer, onStore } = createBuffer({ max: 2 });
  buffer.push({ key: 'a' });
  buffer.push({ key: 'b' });
  onStore.mockClear();

  // The ring is full: this push both stores and evicts, so the list length is
  // unchanged - the return value is the only honest answer.
  expect(buffer.push({ key: 'c' })).toBe(true);
  expect(buffer.list()).toEqual([{ key: 'b' }, { key: 'c' }]);
  expect(onStore).toHaveBeenCalledTimes(1);
});

test('createRingBuffer forgets a dedupe key when its entry is evicted', () => {
  const { buffer } = createBuffer({ max: 2 });
  buffer.push({ key: 'a', message: 'first' });
  buffer.push({ key: 'b' });
  buffer.push({ key: 'c' });

  expect(buffer.push({ key: 'a', message: 'again' })).toBe(true);
  expect(buffer.list()).toEqual([{ key: 'c' }, { key: 'a', message: 'again' }]);
});

test('createRingBuffer requires max, dedupeKey and onStore', () => {
  expect(() => createRingBuffer({ dedupeKey: () => null, onStore: () => {} })).toThrow(
    'createRingBuffer requires a "max" integer. Received undefined.'
  );
  expect(() => createRingBuffer({ max: 2, onStore: () => {} })).toThrow(
    'createRingBuffer requires a "dedupeKey" function.'
  );
  expect(() => createRingBuffer({ max: 2, dedupeKey: () => null })).toThrow(
    'createRingBuffer requires an "onStore" function.'
  );
});
