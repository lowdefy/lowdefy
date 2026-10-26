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

import sortByOrder from './sortByOrder.js';

test('sortByOrder sorts blocks by their order at the breakpoint and keeps ties in config order', () => {
  const blocks = [
    { id: 'a', layout: { order: 2 } },
    { id: 'b', layout: {} },
    { id: 'c', layout: { order: 1, lg: { order: 3 } } },
    { id: 'd' },
  ];
  const ids = (breakpoint) =>
    sortByOrder({ blocks, breakpoint, getLayout: (block) => block.layout })
      .map(({ block }) => block.id)
      .join('');
  expect(ids('xs')).toBe('abcd');
  expect(ids('md')).toBe('bdca');
  expect(ids('lg')).toBe('bdac');
  expect(sortByOrder({ blocks, breakpoint: 'md', getLayout: (block) => block.layout })[0]).toEqual({
    block: blocks[1],
    index: 1,
  });
});
