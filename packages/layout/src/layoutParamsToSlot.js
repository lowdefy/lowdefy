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

function resolveDeprecated(layout, newName, ...oldNames) {
  if (!type.isNone(layout[newName])) {
    return layout[newName];
  }
  for (const oldName of oldNames) {
    if (!type.isNone(layout[oldName])) {
      console.warn(`[Lowdefy] layout.${oldName} is deprecated. Use layout.${newName} instead.`);
      return layout[oldName];
    }
  }
  return undefined;
}

function resolveLayoutAlign(layout) {
  if (!type.isNone(layout.align) && type.isNone(layout.selfAlign)) {
    console.warn(
      '[Lowdefy] layout.align for self-alignment is deprecated. Use layout.selfAlign instead.'
    );
    return undefined;
  }
  return layout.align;
}

function layoutParamsToSlot({ slotKey, slot = {}, layout = {} }) {
  // Normalize slot.gutter → slot.gap (deprecated)
  if (!type.isNone(slot.gutter) && type.isNone(slot.gap)) {
    console.warn('[Lowdefy] slots.content.gutter is deprecated. Use gap instead.');
    slot.gap = slot.gutter;
  }

  if (slotKey !== 'content') {
    return slot;
  }

  const layoutAlign = resolveLayoutAlign(layout);

  if (type.isNone(slot.gap))
    slot.gap = resolveDeprecated(layout, 'gap', 'contentGutter', 'contentGap');
  if (type.isNone(slot.align)) slot.align = layoutAlign;
  if (type.isNone(slot.justify))
    slot.justify = resolveDeprecated(layout, 'justify', 'contentJustify');
  if (type.isNone(slot.direction))
    slot.direction = resolveDeprecated(layout, 'direction', 'contentDirection');
  if (type.isNone(slot.wrap)) slot.wrap = resolveDeprecated(layout, 'wrap', 'contentWrap');
  if (type.isNone(slot.overflow))
    slot.overflow = resolveDeprecated(layout, 'overflow', 'contentOverflow');
  return slot;
}

export default layoutParamsToSlot;
