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

import { escapeId } from './escapeId.js';

test('escapeId escapes dots in block IDs', () => {
  expect(escapeId('complaint.customer.product_type')).toBe('complaint\\.customer\\.product_type');
});

test('escapeId escapes colons', () => {
  expect(escapeId('field:name')).toBe('field\\:name');
});

test('escapeId escapes brackets', () => {
  expect(escapeId('items[0]')).toBe('items\\[0\\]');
});

test('escapeId does not modify safe IDs with alphanumeric, underscore, and hyphen', () => {
  expect(escapeId('my_block-name')).toBe('my_block-name');
});

test('escapeId handles multiple special characters', () => {
  expect(escapeId('a.b:c[d]')).toBe('a\\.b\\:c\\[d\\]');
});

test('escapeId escapes hash characters', () => {
  expect(escapeId('block#1')).toBe('block\\#1');
});

test('escapeId handles single-segment IDs without special chars', () => {
  expect(escapeId('simple')).toBe('simple');
});

test('escapeId handles deeply nested dotted IDs', () => {
  expect(escapeId('form.section.group.field.name')).toBe('form\\.section\\.group\\.field\\.name');
});
