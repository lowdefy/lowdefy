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

import { RESERVED_KEYS, ReservedKeyError, isReserved } from './ReservedKeyError.js';
import serializer from './serializer.js';

const reservedKeys = [
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
];

test('RESERVED_KEYS contains exactly the seven reserved keys', () => {
  expect(RESERVED_KEYS).toBeInstanceOf(Set);
  expect([...RESERVED_KEYS].sort()).toEqual([...reservedKeys].sort());
  expect(RESERVED_KEYS.size).toBe(7);
});

test('isReserved returns true for every reserved key', () => {
  reservedKeys.forEach((key) => {
    expect(isReserved(key)).toBe(true);
  });
});

test('isReserved returns false for ordinary keys', () => {
  ['a', 'b', 'hasOwnProperty', 'toString', 'valueOf'].forEach((key) => {
    expect(isReserved(key)).toBe(false);
  });
});

test('isReserved returns false for an empty string', () => {
  expect(isReserved('')).toBe(false);
});

test('ReservedKeyError is a named export only, with no default export', async () => {
  const reservedKeyErrorModule = await import('./ReservedKeyError.js');
  expect(reservedKeyErrorModule.ReservedKeyError).toBe(ReservedKeyError);
  expect(Object.hasOwn(reservedKeyErrorModule, 'default')).toBe(false);
});

test('ReservedKeyError sets name, segment and the contract message', () => {
  const err = new ReservedKeyError('__proto__');
  expect(err.name).toBe('ReservedKeyError');
  expect(err.segment).toBe('__proto__');
  expect(err.message).toBe('Reserved key "__proto__"');
});

test('ReservedKeyError message format is the same for every segment', () => {
  expect(new ReservedKeyError('constructor').message).toBe('Reserved key "constructor"');
  expect(new ReservedKeyError('prototype').message).toBe('Reserved key "prototype"');
  expect(new ReservedKeyError('__lookupSetter__').message).toBe('Reserved key "__lookupSetter__"');
});

test('ReservedKeyError is an instance of Error and of ReservedKeyError', () => {
  const err = new ReservedKeyError('constructor');
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(ReservedKeyError);
});

test('ReservedKeyError name is an own property, not inherited from the prototype', () => {
  const err = new ReservedKeyError('prototype');
  expect(Object.hasOwn(err, 'name')).toBe(true);
  expect(Object.hasOwn(err, 'segment')).toBe(true);
});

test('ReservedKeyError is thrown and caught as a typed error', () => {
  function throwReserved() {
    throw new ReservedKeyError('__proto__');
  }
  expect(throwReserved).toThrow(ReservedKeyError);
  expect(throwReserved).toThrow('Reserved key "__proto__"');
});

test('ReservedKeyError is JSON-serializable', () => {
  const err = new ReservedKeyError('__proto__');
  expect(() => JSON.stringify(err)).not.toThrow();
  expect(JSON.parse(JSON.stringify(err))).toEqual({
    name: 'ReservedKeyError',
    segment: '__proto__',
  });
});

test('ReservedKeyError round-trips name, message and segment through serializer', () => {
  const err = new ReservedKeyError('constructor');
  const roundTripped = serializer.deserialize(serializer.serialize(err));
  expect(roundTripped).toBeInstanceOf(Error);
  expect(roundTripped.name).toBe('ReservedKeyError');
  expect(roundTripped.message).toBe('Reserved key "constructor"');
  expect(roundTripped.segment).toBe('constructor');
});

test('ReservedKeyError nested in an object round-trips through serializer', () => {
  const roundTripped = serializer.deserialize(
    serializer.serialize({ error: new ReservedKeyError('prototype') })
  );
  expect(roundTripped.error.name).toBe('ReservedKeyError');
  expect(roundTripped.error.message).toBe('Reserved key "prototype"');
  expect(roundTripped.error.segment).toBe('prototype');
});
