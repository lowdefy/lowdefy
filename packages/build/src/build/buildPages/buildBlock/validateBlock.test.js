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

import validateBlock from './validateBlock.js';

function callValidateBlock(block) {
  validateBlock(block, { pageId: 'home' }, 'parentConfigKey');
}

test('validateBlock throws when block id is the reserved name "constructor"', () => {
  expect(() => callValidateBlock({ id: 'constructor', type: 'Box' })).toThrow(
    'Block id "constructor" uses reserved name "constructor" as a path segment, at page "home".'
  );
});

test('validateBlock throws when block id is the reserved name "__proto__"', () => {
  expect(() => callValidateBlock({ id: '__proto__', type: 'Box' })).toThrow(
    'Block id "__proto__" uses reserved name "__proto__" as a path segment, at page "home".'
  );
});

test('validateBlock throws and names the reserved segment when it is nested mid-path', () => {
  expect(() => callValidateBlock({ id: 'a.constructor.b', type: 'Box' })).toThrow(
    'Block id "a.constructor.b" uses reserved name "constructor" as a path segment, at page "home".'
  );
});

test('validateBlock throws when a reserved segment is in the last position', () => {
  expect(() => callValidateBlock({ id: 'a.b.__lookupSetter__', type: 'Box' })).toThrow(
    'Block id "a.b.__lookupSetter__" uses reserved name "__lookupSetter__" as a path segment, at page "home".'
  );
});

test('validateBlock accepts an escaped dot that spells a reserved name as a literal segment', () => {
  // splitPath treats `a\.constructor` as the single literal segment "a.constructor",
  // which is not a reserved name - a naive `.split('.')` would incorrectly reject this.
  expect(() => callValidateBlock({ id: 'a\\.constructor', type: 'Box' })).not.toThrow();
});

test.each([
  'myBlock',
  'a.b.c',
  'a.0.b',
  'list.$.field',
  'hasOwnProperty',
  'toString',
  'valueOf',
  'constructor_',
  'Constructor',
])('validateBlock allows the valid block id "%s"', (id) => {
  expect(() => callValidateBlock({ id, type: 'Box' })).not.toThrow();
});

test('validateBlock reserved name error carries the configKey', () => {
  try {
    callValidateBlock({ id: 'constructor', type: 'Box', '~k': 'block-key' });
    throw new Error('validateBlock did not throw');
  } catch (e) {
    expect(e.configKey).toBe('block-key');
  }
});

test('validateBlock reserved name error falls back to the parent configKey when block has none', () => {
  try {
    callValidateBlock({ id: 'constructor', type: 'Box' });
    throw new Error('validateBlock did not throw');
  } catch (e) {
    expect(e.configKey).toBe('parentConfigKey');
  }
});

test('validateBlock reports the not-a-string error, not the reserved-name error, when id is not a string', () => {
  expect(() => callValidateBlock({ id: 123, type: 'Box' })).toThrow(
    'Block id is not a string at page "home".'
  );
});

// The schema no longer advertises `state` and `subscriptions` on the block
// definition (they live on the page definition), so this build-time rejection
// is the only thing left standing between a nested `state:` and silence.
test('validateBlock throws when a nested block declares a state contract', () => {
  expect(() =>
    callValidateBlock({ id: 'nested', type: 'Box', state: { 'a.b': { type: 'string' } } })
  ).toThrow('State contracts are only allowed on the page, not on block "nested" on page "home".');
});

test('validateBlock throws when a nested block declares subscriptions', () => {
  expect(() => callValidateBlock({ id: 'nested', type: 'Box', subscriptions: [] })).toThrow(
    'Subscriptions are only allowed on the page, not on block "nested" on page "home".'
  );
});
