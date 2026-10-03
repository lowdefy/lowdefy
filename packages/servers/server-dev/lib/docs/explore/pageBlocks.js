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

// The actions of every event of a block, flattened: a built event is
// { try: [actions], catch: [actions] }.
function eventActions(block) {
  return Object.values(block.events ?? {}).flatMap((event) => {
    if (type.isArray(event)) return event;
    return [...(event?.try ?? []), ...(event?.catch ?? [])];
  });
}

// Every block of a built page below its root, with the actions its events
// run. The page root's own events (onInit, onMount) ran when the page opened;
// no candidate triggers them.
function pageBlocks(page) {
  const blocks = [];
  function visit(block) {
    blocks.push({ blockId: block.blockId, actions: eventActions(block) });
    childBlocks(block).forEach(visit);
  }
  childBlocks(page).forEach(visit);
  return blocks;
}

function childBlocks(block) {
  return ['slots', 'areas'].flatMap((key) =>
    Object.values(block[key] ?? {}).flatMap((container) => container?.blocks ?? [])
  );
}

export default pageBlocks;
