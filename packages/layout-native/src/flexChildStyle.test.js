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

import flexChildStyle from './flexChildStyle.js';

test('flexChildStyle adds the column gap to a size in points', () => {
  expect(flexChildStyle({ columnGap: 8, layout: { size: '120px' } })).toEqual({
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 128,
  });
  expect(flexChildStyle({ columnGap: 8, layout: { size: '.5px' } }).flexBasis).toBe(8.5);
});

test('flexChildStyle keeps a percentage size and reads anything else as auto', () => {
  expect(flexChildStyle({ columnGap: 8, layout: { size: '50%' } }).flexBasis).toBe('50%');
  expect(flexChildStyle({ columnGap: 8, layout: { size: '1.px' } }).flexBasis).toBe('auto');
});

test('flexChildStyle reads a "grow shrink basis" flex string', () => {
  expect(flexChildStyle({ columnGap: 0, layout: { flex: '1 0 200px' } })).toEqual({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 200,
  });
});

test('flexChildStyle reads a long run of digits that is no size as auto without backtracking', () => {
  const size = `${'0'.repeat(100000)}x`;
  const start = performance.now();
  expect(flexChildStyle({ columnGap: 0, layout: { size } }).flexBasis).toBe('auto');
  expect(performance.now() - start).toBeLessThan(1000);
});
