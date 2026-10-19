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

function stripDot(key) {
  return key.startsWith('.') ? key.slice(1) : key;
}

function getStyleSlots(style) {
  if (!type.isObject(style)) {
    return {};
  }
  const slots = {};
  const blockStyle = {};
  Object.entries(style).forEach(([key, value]) => {
    if (key.startsWith('.')) {
      slots[stripDot(key)] = value;
    } else if (!key.startsWith('~')) {
      blockStyle[key] = value;
    }
  });
  if (Object.keys(blockStyle).length > 0) {
    slots.block = { ...blockStyle, ...slots.block };
  }
  return slots;
}

function getClassSlots(classValue) {
  if (type.isNone(classValue)) {
    return {};
  }
  if (!type.isObject(classValue)) {
    return { block: classValue };
  }
  return Object.fromEntries(
    Object.entries(classValue)
      .filter(([key]) => !key.startsWith('~'))
      .map(([key, value]) => [stripDot(key), value])
  );
}

/**
 * A loading block's skeleton in the shape useBlockStyles reads a block: its `style` and `class`
 * keyed by slot, as the build's normalizeClassAndStyles keys a block's (a `.element` key is the
 * element slot, plain CSS and a class string are the block slot). The build leaves a skeleton's
 * style and class as config wrote them, so the skeleton's block gets its element style, and the
 * view it is placed in its block style, as a block does.
 *
 * @param {Object} params
 * @param {string} params.blockId The loading block's id, which its skeleton draws under.
 * @param {Object} params.skeleton The evaluated skeleton: `{ type, style, class, ... }`.
 * @returns {{ blockId: string, eval: Object, style: Object }}
 */
function getSkeletonBlock({ blockId, skeleton }) {
  const style = getStyleSlots(skeleton.style);
  return {
    blockId,
    eval: { class: getClassSlots(skeleton.class), configKey: skeleton['~k'], style },
    style,
  };
}

export default getSkeletonBlock;
