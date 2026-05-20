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

import extractBlockMap from './extractBlockMap.js';

const typesBlocks = {
  Box: { package: '@lowdefy/blocks-basic' },
  Card: { package: '@lowdefy/blocks-antd' },
  Markdown: { package: '@lowdefy/blocks-markdown' },
  Button: { package: '@lowdefy/blocks-antd' },
  Switch: { package: '@lowdefy/blocks-antd' },
  List: { package: '@lowdefy/blocks-basic' },
  ControlledList: { package: '@lowdefy/blocks-antd' },
};

const blockMetas = {
  List: { category: 'list' },
  ControlledList: { category: 'list' },
  Box: { category: 'container' },
  Card: { category: 'container' },
};

test('extracts blocks nested in slots.<name>.blocks.~arr', () => {
  // Matches the compiled-page shape under .lowdefy/server/build/pages/<pageId>.json
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'welcome_card',
              type: 'Card',
              slots: {
                content: {
                  blocks: {
                    '~arr': [{ blockId: 'welcome_text', type: 'Markdown' }],
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(blockMap).toEqual({
    home: { type: 'Box', helper: '@lowdefy/blocks-basic/e2e' },
    welcome_card: { type: 'Card', helper: '@lowdefy/blocks-antd/e2e' },
    welcome_text: { type: 'Markdown', helper: '@lowdefy/blocks-markdown/e2e' },
  });
});

test('extracts blocks nested in multiple slot names', () => {
  const pageConfig = {
    blockId: 'page',
    type: 'Box',
    slots: {
      header: {
        blocks: { '~arr': [{ blockId: 'header_btn', type: 'Button' }] },
      },
      content: {
        blocks: { '~arr': [{ blockId: 'body_text', type: 'Markdown' }] },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(Object.keys(blockMap).sort()).toEqual(['body_text', 'header_btn', 'page']);
});

test('still extracts blocks from areas.<name>.blocks (legacy shape)', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    areas: {
      content: {
        blocks: {
          '~arr': [{ blockId: 'card', type: 'Card' }],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(blockMap).toEqual({
    home: { type: 'Box', helper: '@lowdefy/blocks-basic/e2e' },
    card: { type: 'Card', helper: '@lowdefy/blocks-antd/e2e' },
  });
});

test('handles pages that mix slots and areas in the same tree', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'card',
              type: 'Card',
              areas: {
                content: { blocks: { '~arr': [{ blockId: 'inner', type: 'Markdown' }] } },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(Object.keys(blockMap).sort()).toEqual(['card', 'home', 'inner']);
});

test('skips blocks whose type is not in typesBlocks', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: { '~arr': [{ blockId: 'mystery', type: 'NotRegistered' }] },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(blockMap).toEqual({
    home: { type: 'Box', helper: '@lowdefy/blocks-basic/e2e' },
  });
});

test('prefixes list-category children with the list blockId and `.$.`', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'legal_rows',
              type: 'List',
              slots: {
                content: {
                  blocks: {
                    '~arr': [
                      { blockId: 'toggle', type: 'Switch' },
                      { blockId: 'label', type: 'Markdown' },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks, blockMetas });
  expect(blockMap).toEqual({
    home: { type: 'Box', helper: '@lowdefy/blocks-basic/e2e' },
    legal_rows: { type: 'List', helper: '@lowdefy/blocks-basic/e2e' },
    'legal_rows.$.toggle': { type: 'Switch', helper: '@lowdefy/blocks-antd/e2e' },
    'legal_rows.$.label': { type: 'Markdown', helper: '@lowdefy/blocks-markdown/e2e' },
  });
});

test('handles nested lists with one `.$.` per nesting level', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'outer',
              type: 'List',
              slots: {
                content: {
                  blocks: {
                    '~arr': [
                      {
                        blockId: 'inner',
                        type: 'ControlledList',
                        slots: {
                          content: {
                            blocks: { '~arr': [{ blockId: 'btn', type: 'Button' }] },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks, blockMetas });
  expect(Object.keys(blockMap).sort()).toEqual([
    'home',
    'outer',
    'outer.$.inner',
    'outer.$.inner.$.btn',
  ]);
});

test('non-list containers (Box, Card) inside a list do not add an extra `.$.`', () => {
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'rows',
              type: 'List',
              slots: {
                content: {
                  blocks: {
                    '~arr': [
                      {
                        blockId: 'wrapper',
                        type: 'Box',
                        slots: {
                          content: {
                            blocks: { '~arr': [{ blockId: 'btn', type: 'Button' }] },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks, blockMetas });
  expect(Object.keys(blockMap).sort()).toEqual(['home', 'rows', 'rows.$.btn', 'rows.$.wrapper']);
});

test('omitted blockMetas falls back to no prefixing (older builds)', () => {
  // No blockMetas passed → list children get recorded under their short id, same as
  // pre-list-aware behaviour. This keeps generateManifest tolerant of older app builds
  // that do not yet emit plugins/blockMetas.json.
  const pageConfig = {
    blockId: 'home',
    type: 'Box',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'rows',
              type: 'List',
              slots: {
                content: { blocks: { '~arr': [{ blockId: 'toggle', type: 'Switch' }] } },
              },
            },
          ],
        },
      },
    },
  };
  const blockMap = extractBlockMap({ pageConfig, typesBlocks });
  expect(Object.keys(blockMap).sort()).toEqual(['home', 'rows', 'toggle']);
});
