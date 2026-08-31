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

import validateComponentProps from './validateComponentProps.js';

const base = { id: 'Pill', slots: [], blocks: [] };

test('accepts a literal of the declared type', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { tone: { type: 'string' } } },
      useProps: { tone: 'positive' },
      instanceId: 'p',
    })
  ).not.toThrow();
});

test('throws when a required prop with no default is missing', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { result: { type: 'string', required: true } } },
      useProps: {},
      instanceId: 'p',
    })
  ).toThrow('requires prop "result"');
});

test('a required prop with a default is satisfied when missing', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { result: { type: 'string', required: true, default: 'x' } } },
      useProps: {},
      instanceId: 'p',
    })
  ).not.toThrow();
});

test('rejects an unknown prop with a suggestion', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { result: { type: 'string' } } },
      useProps: { reslt: 'x' },
      instanceId: 'p',
    })
  ).toThrow('Did you mean "result"?');
});

test('rejects a literal of the wrong type', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { count: { type: 'number' } } },
      useProps: { count: 'not a number' },
      instanceId: 'p',
    })
  ).toThrow('should be type "number" but received "string"');
});

test('accepts an operator-valued prop for a typed prop (pruned)', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { result: { type: 'string' } } },
      useProps: { result: { _state: 'answer' } },
      instanceId: 'p',
    })
  ).not.toThrow();
});

test('accepts an integer literal for an "integer" typed prop', () => {
  // Archetype props (e.g. ListPage pageSize) declare 'integer'; type.typeOf
  // has no integer kind, so the validator narrows with type.isInt.
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { pageSize: { type: 'integer' } } },
      useProps: { pageSize: 25 },
      instanceId: 'p',
    })
  ).not.toThrow();
});

test('rejects a non-integer number for an "integer" typed prop', () => {
  expect(() =>
    validateComponentProps({
      def: { ...base, props: { pageSize: { type: 'integer' } } },
      useProps: { pageSize: 2.5 },
      instanceId: 'p',
    })
  ).toThrow('should be type "integer" but received "number"');
});
