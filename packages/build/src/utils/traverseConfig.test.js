/*
  Copyright 2020-2024 Lowdefy, Inc

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

import traverseConfig from './traverseConfig.js';

test('traverseConfig visits all objects', () => {
  const visited = [];
  const config = {
    id: 'root',
    nested: {
      id: 'nested',
      deep: {
        id: 'deep',
      },
    },
  };
  traverseConfig({
    config,
    visitor: (obj) => {
      if (obj.id) visited.push(obj.id);
    },
  });
  expect(visited).toEqual(['root', 'nested', 'deep']);
});

test('traverseConfig visits objects in arrays', () => {
  const visited = [];
  const config = {
    id: 'root',
    items: [{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }],
  };
  traverseConfig({
    config,
    visitor: (obj) => {
      if (obj.id) visited.push(obj.id);
    },
  });
  expect(visited).toEqual(['root', 'item1', 'item2', 'item3']);
});

test('traverseConfig handles nested arrays', () => {
  const visited = [];
  const config = {
    id: 'root',
    matrix: [[{ id: 'a' }], [{ id: 'b' }, { id: 'c' }]],
  };
  traverseConfig({
    config,
    visitor: (obj) => {
      if (obj.id) visited.push(obj.id);
    },
  });
  expect(visited).toEqual(['root', 'a', 'b', 'c']);
});

test('traverseConfig handles page with areas and blocks', () => {
  const blockIds = [];
  const config = {
    pageId: 'page1',
    blockId: 'page1',
    areas: {
      content: {
        blocks: [
          { blockId: 'input1', type: 'TextInput' },
          {
            blockId: 'container',
            type: 'Box',
            areas: {
              content: {
                blocks: [{ blockId: 'nested', type: 'Button' }],
              },
            },
          },
        ],
      },
    },
  };
  traverseConfig({
    config,
    visitor: (obj) => {
      if (obj.blockId) blockIds.push(obj.blockId);
    },
  });
  expect(blockIds).toEqual(['page1', 'input1', 'container', 'nested']);
});

test('traverseConfig skips primitives', () => {
  const visited = [];
  traverseConfig({
    config: 'string',
    visitor: () => visited.push('called'),
  });
  traverseConfig({
    config: 123,
    visitor: () => visited.push('called'),
  });
  traverseConfig({
    config: null,
    visitor: () => visited.push('called'),
  });
  traverseConfig({
    config: undefined,
    visitor: () => visited.push('called'),
  });
  expect(visited).toEqual([]);
});

test('traverseConfig handles empty objects and arrays', () => {
  const visited = [];
  traverseConfig({
    config: {},
    visitor: () => visited.push('object'),
  });
  traverseConfig({
    config: [],
    visitor: () => visited.push('array'),
  });
  expect(visited).toEqual(['object']);
});
