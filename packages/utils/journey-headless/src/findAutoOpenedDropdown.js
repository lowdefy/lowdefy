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

import { collectRenderedBlocks } from './collectMountOrder.js';
import hasEventActions from './hasEventActions.js';

// The blocks-antd blocks that open their own dropdown as they render when `autoOpen` is true
// (antd's defaultOpen): their dropdown stays open until a step clicks, types or presses elsewhere.
const AUTO_OPEN_TYPES = new Set(['DateSelector', 'MultipleSelector', 'Selector']);

// Why an interaction step needs a browser, or undefined: the page renders a block that opened its
// own dropdown (AUTO_OPEN_TYPES with autoOpen, not disabled) and has onOpenChange actions. In a
// browser, the step closes that dropdown, or acts in it, and onOpenChange fires; a headless run
// keeps no open state for it and fires no onOpenChange. Not while the block is hidden, shows its
// skeleton or sits in a closed Modal (collectRenderedBlocks), as then it is not drawn.
function findAutoOpenedDropdown({ actor }) {
  if (type.isNone(actor.page)) {
    return undefined;
  }
  const { context, mountFinished, openBlocks } = actor.page;
  const block = collectRenderedBlocks({
    mountFinished,
    openBlocks,
    slots: context._internal.RootSlots,
  }).find(
    (rendered) =>
      AUTO_OPEN_TYPES.has(rendered.type) &&
      rendered.eval.properties?.autoOpen === true &&
      rendered.eval.properties?.disabled !== true &&
      hasEventActions({ block: rendered, name: 'onOpenChange' })
  );
  if (block === undefined) {
    return undefined;
  }
  return `Block "${block.blockId}" (${block.type}) opened its dropdown as it rendered (autoOpen) and has onOpenChange actions, which a browser fires as a step closes the dropdown or acts in it and a headless run does not model: the step runs in a browser.`;
}

export default findAutoOpenedDropdown;
