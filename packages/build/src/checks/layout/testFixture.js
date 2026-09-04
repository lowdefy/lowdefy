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

// A built page tree — slots, not areas, and no deprecated layout spellings —
// as checks see it, carrying one block per layout shape the rule reports.
function layoutComponents() {
  return {
    pages: [
      {
        pageId: 'home',
        blockId: 'home',
        type: 'Box',
        '~k': 'k_home',
        slots: {
          content: {
            '~k': 'k_home_content',
            blocks: [
              { blockId: 'sidebar', type: 'Box', '~k': 'k_sidebar', layout: { span: 8 } },
              {
                blockId: 'main',
                type: 'Box',
                '~k': 'k_main',
                layout: { span: 12, offset: 4 },
              },
              {
                blockId: 'toolbar',
                type: 'Box',
                '~k': 'k_toolbar',
                layout: { grow: 1, shrink: 0, size: 200 },
              },
              { blockId: 'badge', type: 'Box', '~k': 'k_badge', layout: { selfAlign: 'middle' } },
              {
                blockId: 'column_box',
                type: 'Box',
                '~k': 'k_column_box',
                slots: {
                  content: {
                    '~k': 'k_column_box_content',
                    direction: 'column',
                    gap: 16,
                    blocks: [],
                  },
                },
              },
              {
                blockId: 'dynamic_block',
                type: 'Box',
                '~k': 'k_dynamic_block',
                layout: { _if: { test: true, then: { span: 12 }, else: { span: 24 } } },
              },
              {
                blockId: 'partly_dynamic',
                type: 'Box',
                '~k': 'k_partly_dynamic',
                layout: { span: { _state: 'span' } },
              },
              { blockId: 'plain', type: 'Box', '~k': 'k_plain' },
            ],
          },
        },
      },
    ],
  };
}

function createLayoutContext({ keyMap = {}, refMap = {} } = {}) {
  const warnings = [];
  return {
    warnings,
    keyMap,
    refMap,
    handleWarning: (warning) => warnings.push(warning),
  };
}

export { createLayoutContext, layoutComponents };
