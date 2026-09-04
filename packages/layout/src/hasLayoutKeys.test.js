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

import hasLayoutKeys from './hasLayoutKeys.js';

test('hasLayoutKeys returns false for a block with no layout', () => {
  expect(hasLayoutKeys(undefined)).toBe(false);
  expect(hasLayoutKeys(null)).toBe(false);
  expect(hasLayoutKeys({})).toBe(false);
});

test('hasLayoutKeys returns true for each positioning key', () => {
  [
    'span',
    'offset',
    'push',
    'pull',
    'order',
    'flex',
    'grow',
    'shrink',
    'size',
    'selfAlign',
  ].forEach((key) => {
    expect(hasLayoutKeys({ [key]: 1 })).toBe(true);
  });
});

test('hasLayoutKeys returns true for a responsive breakpoint key', () => {
  ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].forEach((key) => {
    expect(hasLayoutKeys({ [key]: { span: 12 } })).toBe(true);
  });
});

test('hasLayoutKeys returns true for layout.disabled alone, which asked for the wrapper', () => {
  expect(hasLayoutKeys({ disabled: true })).toBe(true);
  expect(hasLayoutKeys({ disabled: false })).toBe(true);
});

test('hasLayoutKeys reads key presence, not value, so an operator resolving to null still wraps', () => {
  expect(hasLayoutKeys({ span: null })).toBe(true);
  expect(hasLayoutKeys({ span: undefined })).toBe(true);
  expect(hasLayoutKeys({ span: 0 })).toBe(true);
});

test('hasLayoutKeys ignores the content arrangement keys, which configure the slot Area', () => {
  expect(hasLayoutKeys({ gap: 16, align: 'middle', direction: 'column' })).toBe(false);
});
