/*
  Copyright 2020-2024 Lowdefy, Inc

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

import filter_default_value from './filter_default_value.js';

test('no default value', () => {
  const value = { a: 1 };
  expect(filter_default_value({ params: { value, defaultValue: {} } })).toEqual({ a: 1 });
});

test('remove null, empty objects and empty objects with all properties null or empty', () => {
  const value = {
    a: null,
    b: {},
    c: { d: null },
    e: { f: {} },
    g: { h: { i: { j: null, k: { l: null } } } },
    m: { n: null, o: null, p: null },
  };
  expect(filter_default_value({ params: { value, defaultValue: {} } })).toEqual({});
});

test('remove a default value', () => {
  const value = {
    a: 1,
    b: 2,
  };
  const defaultValue = {
    a: 1,
    b: 1,
  };
  expect(filter_default_value({ params: { value, defaultValue } })).toEqual({ b: 2 });
});

test('remove a default value but keep arrays', () => {
  const value = {
    a: {
      b: 1,
      c: false,
      d: true,
    },
    e: ['1', '2'],
    g: {
      h: 4,
    },
  };
  const defaultValue = {
    a: {
      b: 1,
      c: true,
    },
    e: ['1', '2'],
  };
  expect(filter_default_value({ params: { value, defaultValue } })).toEqual({
    a: {
      c: false,
      d: true,
    },
    e: ['1', '2'],
    g: {
      h: 4,
    },
  });
});

test('only recurse getNestedValue on objects', () => {
  const value = {
    a: {
      b: { c: 1 },
    },
  };
  const defaultValue = {
    a: {
      b: null,
    },
  };
  expect(filter_default_value({ params: { value, defaultValue } })).toEqual({ a: { b: { c: 1 } } });
});
