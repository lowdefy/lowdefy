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

import collectMountEvents from './collectMountEvents.js';

test('returns an empty list for a page with no mount events', () => {
  const pageConfig = {
    blockId: 'page1',
    events: { onInit: [{ id: 'a', type: 'SetState', params: {} }] },
    slots: { content: { blocks: [{ blockId: 'a', type: 'Box' }] } },
  };
  expect(collectMountEvents(pageConfig)).toEqual([]);
});

test('collects the blockIds declaring onMount or onMountAsync at any depth', () => {
  const pageConfig = {
    blockId: 'page1',
    events: { onMount: [{ id: 'load', type: 'Request', params: 'getData' }] },
    slots: {
      content: {
        blocks: [
          { blockId: 'plain', type: 'Paragraph' },
          {
            blockId: 'card',
            type: 'Card',
            slots: {
              content: {
                blocks: [
                  {
                    blockId: 'chart',
                    type: 'EChart',
                    events: { onMountAsync: [{ id: 'l', type: 'Request', params: 'series' }] },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  expect(collectMountEvents(pageConfig)).toEqual(['page onMount', 'chart']);
});

test('tolerates a null block and a block without events', () => {
  expect(collectMountEvents(null)).toEqual([]);
  expect(collectMountEvents({ blockId: 'x', slots: { a: { blocks: [null] } } })).toEqual([]);
});
