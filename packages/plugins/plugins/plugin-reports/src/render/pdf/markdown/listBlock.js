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

import { BLOCK_MARGIN, LIST_ITEM_BLOCK_MARGIN } from './constants.js';
import listItemContent from './listItemContent.js';

// ordered selects ol/ul; a list numbered from something other than 1 keeps its
// start. Nesting falls out of the recursion: a nested list is another block
// inside its parent's list item.
function listBlock(node, state) {
  const nested = { ...state, listDepth: state.listDepth + 1 };
  const items = (node.children ?? []).map((item) => listItemContent(item, nested));
  if (items.length === 0) return [];
  const key = node.ordered ? 'ol' : 'ul';
  const keepsStart = node.ordered && Number.isInteger(node.start) && node.start !== 1;
  return [
    {
      [key]: items,
      margin: state.listDepth > 0 ? LIST_ITEM_BLOCK_MARGIN : BLOCK_MARGIN,
      ...(keepsStart ? { start: node.start } : {}),
    },
  ];
}

export default listBlock;
