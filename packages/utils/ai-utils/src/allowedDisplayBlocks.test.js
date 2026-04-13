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

import ALLOWED_DISPLAY_BLOCKS from './allowedDisplayBlocks.js';

test('ALLOWED_DISPLAY_BLOCKS is a frozen array of strings', () => {
  expect(Array.isArray(ALLOWED_DISPLAY_BLOCKS)).toBe(true);
  expect(ALLOWED_DISPLAY_BLOCKS.length).toBeGreaterThan(0);
  ALLOWED_DISPLAY_BLOCKS.forEach((block) => {
    expect(typeof block).toBe('string');
  });
  expect(Object.isFrozen(ALLOWED_DISPLAY_BLOCKS)).toBe(true);
});

test('ALLOWED_DISPLAY_BLOCKS contains expected Phase A block types', () => {
  const expected = [
    'Alert',
    'Badge',
    'Card',
    'Descriptions',
    'Divider',
    'List',
    'Progress',
    'Result',
    'Statistic',
    'S3Table',
    'Tag',
    'Timeline',
  ];
  expected.forEach((block) => {
    expect(ALLOWED_DISPLAY_BLOCKS).toContain(block);
  });
});
