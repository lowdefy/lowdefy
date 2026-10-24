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

import findPageBlock from './findPageBlock.js';

const title = { blockId: 'title', type: 'Title' };
const card = { blockId: 'card', type: 'Card', slots: { content: { blocks: [title] } } };
const footer = { blockId: 'footer', type: 'Box' };
const page = {
  id: 'home',
  type: 'Box',
  slots: { content: { blocks: [card] } },
  areas: { footer: { blocks: [footer] } },
};

test('findPageBlock returns a top-level block with its children', () => {
  expect(findPageBlock({ page, blockId: 'card' })).toBe(card);
});

test('findPageBlock finds a nested block', () => {
  expect(findPageBlock({ page, blockId: 'title' })).toBe(title);
});

test('findPageBlock searches areas as well as slots', () => {
  expect(findPageBlock({ page, blockId: 'footer' })).toBe(footer);
});

test('findPageBlock returns null when no block has the blockId', () => {
  expect(findPageBlock({ page, blockId: 'missing' })).toBeNull();
});
