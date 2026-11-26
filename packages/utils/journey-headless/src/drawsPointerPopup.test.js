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

import { expect, test } from 'vitest';

import drawsPointerPopup from './drawsPointerPopup.js';

function block(type, properties) {
  return { type, eval: { properties } };
}

test.each([
  ['a FloatButton with a tooltip text', block('FloatButton', { tooltip: 'Help' }), true],
  ['a FloatButton with tooltip props', block('FloatButton', { tooltip: { title: 'Help' } }), true],
  ['a FloatButton with no tooltip', block('FloatButton', { description: 'Help' }), false],
  ['a FloatButton with tooltip false', block('FloatButton', { tooltip: false }), false],
  ['a Button with a tooltip', block('Button', { tooltip: 'Help' }), true],
  ['a Button with its title shown', block('Button', { title: 'Save' }), false],
])('drawsPointerPopup for %s is %s', (_, target, draws) => {
  expect(drawsPointerPopup({ block: target })).toBe(draws);
});
