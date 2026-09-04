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

import hasAreaKeys from './hasAreaKeys.js';

test('hasAreaKeys returns false for an unconfigured slot', () => {
  expect(hasAreaKeys({ area: undefined, areaKey: 'content', layout: {} })).toBe(false);
  expect(hasAreaKeys({ area: {}, areaKey: 'content', layout: {} })).toBe(false);
});

test('hasAreaKeys returns true for each arrangement key on the slot', () => {
  ['align', 'direction', 'gap', 'gutter', 'justify', 'overflow', 'wrap'].forEach((key) => {
    expect(hasAreaKeys({ area: { [key]: 'x' }, areaKey: 'header', layout: {} })).toBe(true);
  });
});

test('hasAreaKeys reads the content arrangement keys the container lends to its content slot', () => {
  expect(hasAreaKeys({ area: {}, areaKey: 'content', layout: { gap: 16 } })).toBe(true);
  expect(hasAreaKeys({ area: {}, areaKey: 'content', layout: { contentGutter: 16 } })).toBe(true);
  expect(hasAreaKeys({ area: {}, areaKey: 'content', layout: { contentAlign: 'middle' } })).toBe(
    true
  );
});

test('hasAreaKeys does not lend the container layout to a slot other than content', () => {
  expect(hasAreaKeys({ area: {}, areaKey: 'header', layout: { gap: 16 } })).toBe(false);
});

test('hasAreaKeys ignores the block positioning keys on the container layout', () => {
  expect(hasAreaKeys({ area: {}, areaKey: 'content', layout: { span: 12 } })).toBe(false);
});

test('hasAreaKeys ignores a slot style, which the caller weighs separately', () => {
  expect(hasAreaKeys({ area: { style: { color: 'red' } }, areaKey: 'content', layout: {} })).toBe(
    false
  );
});
