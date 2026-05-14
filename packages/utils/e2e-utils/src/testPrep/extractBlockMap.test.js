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
