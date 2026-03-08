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

function layoutParamsToArea({ areaKey, area = {}, layout = {} }) {
  // Normalize area.gutter → area.gap (deprecated)
  if (!type.isNone(area.gutter) && type.isNone(area.gap)) {
    console.warn('[Lowdefy] slots.content.gutter is deprecated. Use gap instead.');
    area.gap = area.gutter;
  }

  if (areaKey !== 'content') {
    return area;
  }

  const layoutAlign = resolveLayoutAlign(layout);

  if (type.isNone(area.gap))
    area.gap = resolveDeprecated(layout, 'gap', 'contentGutter', 'contentGap');
  if (type.isNone(area.align)) area.align = layoutAlign;
  if (type.isNone(area.justify))
    area.justify = resolveDeprecated(layout, 'justify', 'contentJustify');
  if (type.isNone(area.direction))
    area.direction = resolveDeprecated(layout, 'direction', 'contentDirection');
  if (type.isNone(area.wrap)) area.wrap = resolveDeprecated(layout, 'wrap', 'contentWrap');
  if (type.isNone(area.overflow))
    area.overflow = resolveDeprecated(layout, 'overflow', 'contentOverflow');
  return area;
}

export default layoutParamsToArea;
