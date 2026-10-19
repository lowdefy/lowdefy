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

import listFailurePaths from './listFailurePaths.js';

function failed({ name, blockId, invalidBlocks }) {
  return { name, block_id: blockId, success: false, invalid_blocks: invalidBlocks };
}

test('listFailurePaths lists every failed event in order, also included, with sorted invalid blocks', () => {
  const records = [
    {
      kind: 'click',
      page_id: 'tickets',
      event: { name: 'onClick', block_id: 'open', success: true },
    },
    {
      kind: 'click',
      page_id: 'tickets',
      event: failed({ name: 'onClick', blockId: 'save', invalidBlocks: ['title', 'body'] }),
      also: [failed({ name: 'onClick', blockId: 'card' })],
    },
    {
      kind: 'engine',
      page_id: 'tickets',
      scope: 'app',
      event: failed({ name: 'onInitAsync', blockId: 'app' }),
    },
  ];
  expect(listFailurePaths({ records })).toEqual([
    {
      page: 'tickets',
      block_id: 'save',
      event: 'onClick',
      invalid_blocks: ['body', 'title'],
      interaction: true,
    },
    { page: 'tickets', block_id: 'card', event: 'onClick', invalid_blocks: [], interaction: true },
    { page: 'app', block_id: null, event: 'onInitAsync', invalid_blocks: [], interaction: false },
  ]);
});

test('listFailurePaths returns an empty list when nothing failed', () => {
  expect(listFailurePaths({ records: [{ kind: 'click', page_id: 'tickets' }] })).toEqual([]);
});
