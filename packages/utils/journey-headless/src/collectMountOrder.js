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

import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';
import SLOTS_KEEP_OWN_LOADING from './SLOTS_KEEP_OWN_LOADING.js';

// Whether a block is loading, as the web client's Block component works it out (Block.js): its
// own onMount is still running (MountEvents' waitForMount), its parent passed its loading down,
// or its own `loading` is set. mountFinished holds the ids of the blocks whose onMount finished.
function isLoading({ block, mountFinished, parentLoading }) {
  const mountRunning =
    Object.hasOwn(block.Events.events, 'onMount') && !mountFinished.has(block.id);
  return mountRunning || parentLoading || Boolean(block.eval?.loading);
}

// Why the web client renders none of a block's children, or null when it renders them: a hidden
// block renders none (CategorySwitch), a loading block with an object `skeleton` renders its
// skeleton in their place (CategorySwitch, LoadingBlock), and a closed Modal or Drawer renders its
// content only when forceRender is set.
function readDroppedContent({ block, loading, openBlocks }) {
  if (block.eval?.visible === false) {
    return 'hidden';
  }
  if (loading && type.isObject(block.eval?.skeleton)) {
    return 'skeleton';
  }
  if (
    POPUP_BLOCK_TYPES.has(block.type) &&
    !openBlocks.has(block.id) &&
    block.eval?.properties?.forceRender !== true
  ) {
    return 'closed';
  }
  return null;
}

// Every block in a block's subSlots, at any depth.
function collectContent({ block, slots }) {
  return (slots.subSlots[block.id] ?? []).flatMap((subSlots) =>
    Object.values(subSlots.slots).flatMap((slot) =>
      slot.blocks.flatMap((child) => [child, ...collectContent({ block: child, slots: subSlots })])
    )
  );
}

// The blocks of a page as the web client mounts them, in the order React mounts them, so in the
// order their onMount fires: a block's children before the block (effects run child first), each
// slot's blocks in config order. The web client mounts every block it reaches, whatever its
// visibility or loading, but not the children of a block that renders none (readDroppedContent).
// A block passes its loading to its children, so content inside a loading block shows its own
// skeleton, except a block whose component keeps its slots' blocks to their own loading
// (SLOTS_KEEP_OWN_LOADING). Returns { mounts, dropped }: mounts, in mount order, each
// { block, rendered }, rendered being whether the block's component renders (it is visible and
// shows no skeleton); dropped, each { block, content } for a block that is hidden or shows its
// skeleton, whose content (every block inside it) the web client has unmounted.
// openBlocks holds the ids of the open Modals and Drawers.
function walkMounts({ mountFinished, openBlocks, parentLoading, slots }) {
  const mounts = [];
  const dropped = [];
  Object.values(slots.slots).forEach((slot) => {
    slot.blocks.forEach((block) => {
      const loading = isLoading({ block, mountFinished, parentLoading });
      const droppedContent = readDroppedContent({ block, loading, openBlocks });
      if (droppedContent === null) {
        const childLoading = SLOTS_KEEP_OWN_LOADING.has(block.type) ? false : loading;
        (slots.subSlots[block.id] ?? []).forEach((subSlots) => {
          const children = walkMounts({
            mountFinished,
            openBlocks,
            parentLoading: childLoading,
            slots: subSlots,
          });
          mounts.push(...children.mounts);
          dropped.push(...children.dropped);
        });
      } else if (droppedContent !== 'closed') {
        dropped.push({ block, content: collectContent({ block, slots }) });
      }
      mounts.push({
        block,
        rendered: block.eval?.visible !== false && droppedContent !== 'skeleton',
      });
    });
  });
  return { mounts, dropped };
}

function collectMounts({ mountFinished = new Set(), openBlocks = new Set(), slots }) {
  return walkMounts({ mountFinished, openBlocks, parentLoading: false, slots });
}

// The blocks the web client mounts, in mount order (walkMounts).
function collectMountOrder(options) {
  return collectMounts(options).mounts.map(({ block }) => block);
}

// The mounted blocks whose component renders, in mount order: not hidden and not showing their
// skeleton (walkMounts).
function collectRenderedBlocks(options) {
  return collectMounts(options)
    .mounts.filter(({ rendered }) => rendered)
    .map(({ block }) => block);
}

export { collectMounts, collectRenderedBlocks };

export default collectMountOrder;
