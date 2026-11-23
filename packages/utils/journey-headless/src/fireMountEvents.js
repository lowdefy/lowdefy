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

import { collectMounts } from './collectMountOrder.js';
import unmountComponent from './standIns/unmountComponent.js';
import unmountContent from './standIns/unmountContent.js';

// Brings a page's mounts up to date with what the web client's Block components render
// (client/src/block/Block.js, CategorySwitch.js and MountEvents.js), as React does after a render:
// - A block that is hidden or shows its skeleton renders neither its component nor any of its
//   content (collectMounts' dropped): its component's state starts again (unmountComponent: an
//   open Modal shows closed again), and the mounted blocks inside it unmount (unmountContent), so
//   they mount again, firing onMount, once it renders them again.
// - Every block it now reaches that is not in page.mounted mounts: its onMount fires, all started
//   in mount order as React runs their effects, and its onMountAsync once its own onMount has
//   finished, which nothing waits for. The block is then in page.mountFinished, so it is no
//   longer loading (MountEvents' waitForMount), and onMountFinished is called: content its
//   skeleton held back may now mount.
// page.mounted maps each mounted Block (the engine's instance: a list row added in place of a
// removed one can take its id) to a token for this mount. An onMount that finishes after its
// block unmounted, and maybe mounted again, leaves mountFinished alone: the new mount's own
// onMount is still running, as a new MountEvents starts loading.
// Resolves when every onMount it fired has finished.
async function fireMountEvents({ actor, onMountFinished = () => undefined }) {
  const { page } = actor;
  const { context, mounted, mountFinished, openBlocks } = page;
  const progress = () => undefined;
  const { dropped, mounts } = collectMounts({
    mountFinished,
    openBlocks,
    slots: context._internal.RootSlots,
  });
  dropped.forEach(({ block, content }) => {
    unmountComponent({ actor, block });
    if (content.some((inside) => mounted.has(inside))) {
      unmountContent({ actor, block });
    }
  });
  const blocks = mounts.map(({ block }) => block).filter((block) => !mounted.has(block));
  const tokens = new Map(blocks.map((block) => [block, {}]));
  tokens.forEach((token, block) => mounted.set(block, token));
  await Promise.all(
    blocks.map(async (block) => {
      await block.triggerEvent({ name: 'onMount', progress });
      block.triggerEvent({ name: 'onMountAsync', progress });
      if (mounted.get(block) === tokens.get(block)) {
        mountFinished.add(block);
        onMountFinished();
      }
    })
  );
}

export default fireMountEvents;
