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

import collectPageTypes from './collectPageTypes.js';

const page = {
  id: 'page:today',
  type: 'Screen',
  slots: {
    content: {
      blocks: [
        {
          id: 'block:today:tap:0',
          type: 'Button',
          events: {
            onClick: {
              try: [{ id: 'go', type: 'Link', params: 'detail' }],
              catch: [{ id: 'failed', type: 'SetState', params: {} }],
            },
          },
        },
        {
          id: 'block:today:box:0',
          type: 'Box',
          slots: { content: { blocks: [{ id: 'block:today:text:0', type: 'Paragraph' }] } },
        },
      ],
    },
  },
};

const expected = {
  blocks: ['Box', 'Button', 'Paragraph', 'Screen'],
  actions: ['Link', 'SetState'],
};

test('collectPageTypes reads the block and action types of a page', () => {
  expect(collectPageTypes(page)).toEqual(expected);
});

// The dev server sends page config serialized: an array that carries a config key comes as
// { '~arr': [...], '~k': key }.
test('collectPageTypes reads a serialized page as the dev server sends it', () => {
  const serialized = {
    id: 'page:today',
    type: 'Screen',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              id: 'block:today:tap:0',
              type: 'Button',
              events: {
                onClick: {
                  try: { '~arr': [{ id: 'go', type: 'Link', params: 'detail' }], '~k': 'k2' },
                  catch: { '~arr': [{ id: 'failed', type: 'SetState', params: {} }], '~k': 'k3' },
                },
              },
            },
            {
              id: 'block:today:box:0',
              type: 'Box',
              slots: {
                content: {
                  blocks: { '~arr': [{ id: 'block:today:text:0', type: 'Paragraph' }], '~k': 'k4' },
                },
              },
            },
          ],
          '~k': 'k1',
        },
      },
    },
  };
  expect(collectPageTypes(serialized)).toEqual(expected);
});
