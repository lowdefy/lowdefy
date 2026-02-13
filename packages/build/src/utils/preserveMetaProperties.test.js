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

import preserveMetaProperties from './preserveMetaProperties.js';

test('preserveMetaProperties copies non-enumerable meta props from source to target', () => {
  const source = { a: 1 };
  Object.defineProperty(source, '~r', { value: 'ref-1', enumerable: false, configurable: true });
  Object.defineProperty(source, '~l', { value: 5, enumerable: false, configurable: true });
  Object.defineProperty(source, '~k', { value: 'key-1', enumerable: false, configurable: true });

  const target = { b: 2 };
  preserveMetaProperties(target, source);

  expect(target['~r']).toBe('ref-1');
  expect(target['~l']).toBe(5);
  expect(target['~k']).toBe('key-1');
  expect(Object.keys(target)).toEqual(['b']);
});

test('preserveMetaProperties skips undefined properties', () => {
  const source = { a: 1 };
  Object.defineProperty(source, '~r', { value: 'ref-1', enumerable: false, configurable: true });

  const target = {};
  preserveMetaProperties(target, source);

  expect(target['~r']).toBe('ref-1');
  expect(target['~l']).toBeUndefined();
  expect(target['~k']).toBeUndefined();
});

test('preserveMetaProperties accepts custom props list', () => {
  const source = { a: 1 };
  Object.defineProperty(source, '~r', { value: 'ref-1', enumerable: false, configurable: true });
  Object.defineProperty(source, '~l', { value: 5, enumerable: false, configurable: true });

  const target = {};
  preserveMetaProperties(target, source, ['~r']);

  expect(target['~r']).toBe('ref-1');
  expect(target['~l']).toBeUndefined();
});

test('preserveMetaProperties sets properties as non-enumerable', () => {
  const source = {};
  Object.defineProperty(source, '~k', { value: 'key-1', enumerable: false, configurable: true });

  const target = { x: 1 };
  preserveMetaProperties(target, source);

  expect(Object.keys(target)).toEqual(['x']);
  expect(target['~k']).toBe('key-1');
});
