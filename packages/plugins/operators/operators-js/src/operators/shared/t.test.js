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

import _t from './t.js';

const i18n = {
  active: 'de-DE',
  defaultLocale: 'en-US',
  locales: [{ code: 'en-US' }, { code: 'de-DE' }],
  messages: {
    'en-US': {
      hello: 'Hello',
      'cart.items':
        '{count, plural, =0 {No items} one {# item} other {# items}}',
      greeting: 'Hello, {name}!',
    },
    'de-DE': {
      hello: 'Hallo',
      greeting: 'Hallo, {name}!',
    },
  },
};

test('_t with a string key returns the active locale message', () => {
  expect(_t({ params: 'hello', i18n })).toBe('Hallo');
});

test('_t falls back to en-US when key is missing in active locale', () => {
  expect(_t({ params: 'cart.items', i18n: { ...i18n, active: 'de-DE' } })).toBe(
    '{count, plural, =0 {No items} one {# item} other {# items}}'
  );
});

test('_t returns the key itself when missing in both active and en-US', () => {
  expect(_t({ params: 'unknown', i18n })).toBe('unknown');
});

test('_t interpolates ICU MessageFormat values', () => {
  expect(_t({ params: { key: 'greeting', values: { name: 'Ada' } }, i18n })).toBe('Hallo, Ada!');
});

test('_t supports plural ICU rules via en-US fallback', () => {
  const localized = _t({
    params: { key: 'cart.items', values: { count: 5 } },
    i18n: { ...i18n, active: 'en-US' },
  });
  expect(localized).toBe('5 items');
});

test('_t honors explicit locale override on params', () => {
  expect(
    _t({ params: { key: 'hello', locale: 'en-US' }, i18n: { ...i18n, active: 'de-DE' } })
  ).toBe('Hello');
});

test('_t falls back to defaultLocale when active is undefined', () => {
  expect(_t({ params: 'hello', i18n: { ...i18n, active: undefined } })).toBe('Hello');
});

test('_t returns the key when no i18n config is provided', () => {
  expect(_t({ params: 'hello' })).toBe('hello');
});

test('_t throws when params is not a string or object', () => {
  expect(() => _t({ params: 42, i18n })).toThrow('_t takes a string key or an object');
});

test('_t throws when key is missing on object params', () => {
  expect(() => _t({ params: { values: {} }, i18n })).toThrow('translate requires a string "key".');
});

test('_t throws when values is not an object', () => {
  expect(() => _t({ params: { key: 'greeting', values: 'Ada' }, i18n })).toThrow(
    'translate "values" must be an object.'
  );
});

test('_t falls back to a builtin message when neither active nor en-US have the key', () => {
  expect(_t({ params: 'engine.action.loading', i18n })).toBe('Loading');
});

test('_t allows user messages to override a builtin', () => {
  const overridden = {
    ...i18n,
    messages: {
      ...i18n.messages,
      'de-DE': { ...i18n.messages['de-DE'], 'engine.action.loading': 'Laden' },
    },
  };
  expect(_t({ params: 'engine.action.loading', i18n: overridden })).toBe('Laden');
});
