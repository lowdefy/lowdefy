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

import collectMountOrder from './collectMountOrder.js';

// Fires what the web client's Block component fires when a page's blocks mount
// (client/src/block/Block.js and MountEvents.js): every block's onMount, all started in mount
// order as React runs their effects, and each block's onMountAsync once its own onMount has
// finished, which nothing waits for. A block in `mounted` is already mounted and is left alone;
// each block fired is added to it, so opening a Modal mounts only its content. Resolves when every
// onMount has finished.
async function fireMountEvents({ context, mounted = new Set(), openBlocks }) {
  const progress = () => undefined;
  const blocks = collectMountOrder({ openBlocks, slots: context._internal.RootSlots }).filter(
    (block) => !mounted.has(block.id)
  );
  blocks.forEach((block) => mounted.add(block.id));
  await Promise.all(
    blocks.map(async (block) => {
      await block.triggerEvent({ name: 'onMount', progress });
      block.triggerEvent({ name: 'onMountAsync', progress });
    })
  );
}

export default fireMountEvents;
