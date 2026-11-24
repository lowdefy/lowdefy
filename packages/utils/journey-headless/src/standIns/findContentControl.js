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

import collectBlockParents from '../collectBlockParents.js';
import { collectRenderedBlocks } from '../collectMountOrder.js';
import isBlockShown from '../isBlockShown.js';
import isInsideBlock from './isInsideBlock.js';

// The block in `block`'s content area that a plain click on `block` lands on. The browser runner
// clicks the first interactive control inside the block (resolveClickTarget); headless reads it as
// the first shown block whose component renders (no skeleton in its place), in the order React
// draws them with children first, that is an input or answers a click (onClick). A container's own
// element is no control, so a control inside it comes first. Null when the content holds none: the
// click lands on the block itself.
function findContentControl({ actor, block }) {
  const { context, mountFinished, openBlocks } = actor.page;
  const { blockMetas } = context._internal.lowdefy._internal;
  const { parents } = collectBlockParents({ context });
  const rendered = collectRenderedBlocks({
    mountFinished,
    openBlocks,
    slots: context._internal.RootSlots,
  });
  const renderedSet = new Set(rendered);
  const control = rendered.find(
    (content) =>
      isInsideBlock({ block: content, container: block, parents }) &&
      isBlockShown({ block: content, page: actor.page, parents, rendered: renderedSet }) &&
      (blockMetas[content.type]?.category === 'input' ||
        Object.hasOwn(content.Events.events, 'onClick'))
  );
  return type.isUndefined(control) ? null : control;
}

export default findContentControl;
