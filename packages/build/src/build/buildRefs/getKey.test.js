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

import { ConfigError } from '@lowdefy/errors';
import { ReservedKeyError } from '@lowdefy/helpers';

import getKey from './getKey.js';

describe('getKey', () => {
  test('returns input unchanged when refDef.key is absent', () => {
    const input = { a: 1 };
    const result = getKey({ input, refDef: {} });
    expect(result).toBe(input);
  });

  test('resolves a non-reserved key', () => {
    const input = { a: { b: 'value' } };
    const result = getKey({ input, refDef: { key: 'a.b' } });
    expect(result).toBe('value');
  });

  test('returns null when a non-reserved key is missing', () => {
    const input = { a: 1 };
    const result = getKey({ input, refDef: { key: 'missing' } });
    expect(result).toBeNull();
  });

  test('throws a ConfigError, not a ReservedKeyError, when refDef.key is reserved', () => {
    const input = { a: 1 };
    expect(() => getKey({ input, refDef: { key: 'constructor' }, filePath: 'ref.yaml' })).toThrow(
      ConfigError
    );
  });

  test('ConfigError message names the reserved key', () => {
    const input = { a: 1 };
    try {
      getKey({ input, refDef: { key: 'constructor' }, filePath: 'ref.yaml' });
      throw new Error('expected getKey to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toBe('_ref key "constructor" is a reserved name.');
    }
  });

  test('ConfigError carries the original ReservedKeyError as cause with the offending segment', () => {
    const input = { a: 1 };
    try {
      getKey({ input, refDef: { key: '__proto__' }, filePath: 'ref.yaml' });
      throw new Error('expected getKey to throw');
    } catch (error) {
      expect(error.cause).toBeInstanceOf(ReservedKeyError);
      expect(error.cause.segment).toBe('__proto__');
    }
  });

  test('ConfigError carries the filePath through for location resolution', () => {
    const input = { a: 1 };
    try {
      getKey({ input, refDef: { key: 'prototype' }, filePath: 'pages/home.yaml' });
      throw new Error('expected getKey to throw');
    } catch (error) {
      expect(error.filePath).toBe('pages/home.yaml');
    }
  });

  test('a non-ReservedKeyError from get propagates untouched', () => {
    // A throwing getter is the cheapest way to make `get` throw something that is not a
    // ReservedKeyError, so this proves getKey only special-cases the reserved-key failure.
    const input = {};
    Object.defineProperty(input, 'boom', {
      enumerable: true,
      get() {
        throw new Error('not a reserved key error');
      },
    });
    expect(() => getKey({ input, refDef: { key: 'boom' }, filePath: 'ref.yaml' })).toThrow(
      'not a reserved key error'
    );
  });
});
