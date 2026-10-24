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

import blockOrder from './blockOrder.js';

test('blockOrder resolves a grid block order per breakpoint, top-level order from md', () => {
  const layout = { order: 2, sm: { order: 1 }, lg: { order: 3 } };
  expect(blockOrder({ breakpoint: 'xs', layout })).toBe(1);
  expect(blockOrder({ breakpoint: 'md', layout })).toBe(2);
  expect(blockOrder({ breakpoint: 'xl', layout })).toBe(3);
  expect(blockOrder({ breakpoint: 'xs', layout: { order: 2 } })).toBe(0);
});

test('blockOrder uses a flex block order at every breakpoint, and 0 by default', () => {
  expect(blockOrder({ breakpoint: 'xs', layout: { grow: 1, order: 4 } })).toBe(4);
  expect(blockOrder({ breakpoint: 'xs' })).toBe(0);
});
