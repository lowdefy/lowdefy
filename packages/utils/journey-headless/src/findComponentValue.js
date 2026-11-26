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

import { type } from '@lowdefy/helpers';

import collectBlockParents from './collectBlockParents.js';

// Block types whose component writes the block's value itself, from its own state, which a
// headless page does not load: blocks-table's Table sets its view (sort, filters, groups and the
// groups folded, from defaultView, a persisted or saved view) and its selection as it mounts, and
// again after each change a person makes (useTableState).
const COMPONENT_VALUE_TYPES = new Set(['Table']);

function toDotPath(path) {
  return path.replace(/\[(\d+)\]/g, '.$1');
}

// Whether one dot path is the other or holds it.
function overlaps(a, b) {
  return a === b || a.startsWith(`${b}.`) || b.startsWith(`${a}.`);
}

// Why expect.state on `path` needs a browser, or undefined: the path reads the value of a block
// on the page whose component writes it (COMPONENT_VALUE_TYPES), or a state object holding it,
// which stays unset headless. The block's value sits in state under its blockId.
function findComponentValue({ actor, path }) {
  if (type.isNone(actor.page)) {
    return undefined;
  }
  const statePath = toDotPath(String(path));
  const block = collectBlockParents({ context: actor.page.context }).blocks.find(
    (candidate) =>
      COMPONENT_VALUE_TYPES.has(candidate.type) && overlaps(statePath, toDotPath(candidate.blockId))
  );
  if (block === undefined) {
    return undefined;
  }
  return `State "${path}" reads the value of ${block.type} "${block.blockId}", which its component writes in a browser and a headless run does not model: the step runs in a browser.`;
}

export default findComponentValue;
