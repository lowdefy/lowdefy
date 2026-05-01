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

import translate from './translate.js';

const i18n = {
  active: 'de-DE',
  defaultLocale: 'en-US',
  fallbackLocale: 'en-US',
  locales: [{ code: 'en-US' }, { code: 'de-DE' }],
  messages: {
    'en-US': {
      hello: 'Hello',
      greeting: 'Hello, {name}!',
      'cart.items':
        '{count, plural, =0 {No items} one {# item} other {# items}}',
    },
    'de-DE': {
      hello: 'Hallo',
      greeting: 'Hallo, {name}!',
    },
  },
};

test('returns the active-locale message when present', () => {
  expect(translate({ key: 'hello', i18n })).toBe('Hallo');
});

test('falls back to the fallback locale when missing in active', () => {
  expect(translate({ key: 'cart.items', i18n })).toBe(
    '{count, plural, =0 {No items} one {# item} other {# items}}'
  );
});

test('falls back to a builtin message when neither active nor fallback have the key', () => {
  expect(translate({ key: 'engine.action.loading', i18n })).toBe('Loading');
});

test('user override on the active locale beats builtin', () => {
  const overridden = {
    ...i18n,
    messages: {
      ...i18n.messages,
      'de-DE': { ...i18n.messages['de-DE'], 'engine.action.loading': 'Laden' },
    },
  };
  expect(translate({ key: 'engine.action.loading', i18n: overridden })).toBe('Laden');
});

test('falls back to the key itself when nothing else has it', () => {
  expect(translate({ key: 'no.such.key', i18n })).toBe('no.such.key');
});

test('interpolates ICU MessageFormat values', () => {
  expect(translate({ key: 'greeting', values: { name: 'Ada' }, i18n })).toBe('Hallo, Ada!');
});

test('formats plural rules from the active locale', () => {
  expect(
    translate({
      key: 'cart.items',
      values: { count: 3 },
      i18n: { ...i18n, active: 'en-US' },
    })
  ).toBe('3 items');
});

test('explicit locale override beats i18n.active', () => {
  expect(translate({ key: 'hello', locale: 'en-US', i18n })).toBe('Hello');
});

test('uses defaultLocale when i18n has no active', () => {
  expect(translate({ key: 'hello', i18n: { ...i18n, active: undefined } })).toBe('Hello');
});

test('works with no i18n config — falls through to builtin', () => {
  expect(translate({ key: 'engine.action.success' })).toBe('Success');
});

test('works with no i18n config — falls through to key', () => {
  expect(translate({ key: 'unknown.key' })).toBe('unknown.key');
});

test('throws when key is missing', () => {
  expect(() => translate({ values: {}, i18n })).toThrow('translate requires a string "key".');
});

test('throws when values is not an object', () => {
  expect(() => translate({ key: 'greeting', values: 'Ada', i18n })).toThrow(
    'translate "values" must be an object.'
  );
});

test('formats builtin plural strings', () => {
  expect(
    translate({
      key: 'engine.validation.summary',
      values: { count: 1 },
    })
  ).toBe('Your input has 1 validation error');
  expect(
    translate({
      key: 'engine.validation.summary',
      values: { count: 5 },
    })
  ).toBe('Your input has 5 validation errors');
});
