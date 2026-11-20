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

import { expect, test } from 'vitest';

import collectMountOrder from './collectMountOrder.js';

function block(id, visible = true) {
  return { id, eval: { visible } };
}

test("collectMountOrder puts children before their block, in config order, and skips a hidden block's subtree", () => {
  const root = block('page');
  const box = block('box');
  const hidden = block('hidden', false);
  const rows = block('rows');
  const slots = {
    slots: { root: { blocks: [root] } },
    subSlots: {
      page: [
        {
          slots: { content: { blocks: [box, hidden, rows] } },
          subSlots: {
            box: [
              { slots: { content: { blocks: [block('title'), block('input')] } }, subSlots: {} },
            ],
            hidden: [{ slots: { content: { blocks: [block('never')] } }, subSlots: {} }],
            rows: [
              { slots: { content: { blocks: [block('rows.0.label')] } }, subSlots: {} },
              { slots: { content: { blocks: [block('rows.1.label')] } }, subSlots: {} },
            ],
          },
        },
      ],
    },
  };
  expect(collectMountOrder({ slots }).map(({ id }) => id)).toEqual([
    'title',
    'input',
    'box',
    'hidden',
    'rows.0.label',
    'rows.1.label',
    'rows',
    'page',
  ]);
});
