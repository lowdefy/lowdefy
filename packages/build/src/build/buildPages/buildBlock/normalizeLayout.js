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
import { ConfigWarning } from '@lowdefy/errors';

const DEPRECATED_LAYOUT_KEYS = {
  contentGutter: 'gap',
  contentGap: 'gap',
  contentJustify: 'justify',
  contentDirection: 'direction',
  contentWrap: 'wrap',
  contentOverflow: 'overflow',
};

function normalizeLayout(block, pageContext) {
  const layout = block.layout;
  if (type.isNone(layout) || !type.isObject(layout)) return;

  // Warn and rename deprecated content* layout properties
  for (const [oldKey, newKey] of Object.entries(DEPRECATED_LAYOUT_KEYS)) {
    if (!type.isNone(layout[oldKey])) {
      pageContext.context.handleWarning(
        new ConfigWarning(
          `Block "${block.blockId}": layout.${oldKey} is deprecated. Use layout.${newKey} instead.`,
          { configKey: block['~k'], prodError: true }
        )
      );
      if (type.isNone(layout[newKey])) {
        layout[newKey] = layout[oldKey];
      }
      delete layout[oldKey];
    }
  }

  // layout.align used for self-alignment is deprecated → layout.selfAlign
  if (!type.isNone(layout.align) && type.isNone(layout.selfAlign)) {
    pageContext.context.handleWarning(
      new ConfigWarning(
        `Block "${block.blockId}": layout.align for self-alignment is deprecated. Use layout.selfAlign instead.`,
        { configKey: block['~k'], prodError: true }
      )
    );
    layout.selfAlign = layout.align;
    delete layout.align;
  }

  // Warn about gutter in slot/area configs
  for (const slot of Object.values(block.slots ?? {})) {
    if (!type.isNone(slot.gutter)) {
      pageContext.context.handleWarning(
        new ConfigWarning(
          `Block "${block.blockId}": slots.*.gutter is deprecated. Use gap instead.`,
          { configKey: block['~k'], prodError: true }
        )
      );
      if (type.isNone(slot.gap)) {
        slot.gap = slot.gutter;
      }
      delete slot.gutter;
    }
  }

  // Also check areas (before they're moved to slots)
  for (const area of Object.values(block.areas ?? {})) {
    if (!type.isNone(area.gutter)) {
      pageContext.context.handleWarning(
        new ConfigWarning(
          `Block "${block.blockId}": areas.*.gutter is deprecated. Use gap instead.`,
          { configKey: block['~k'], prodError: true }
        )
      );
      if (type.isNone(area.gap)) {
        area.gap = area.gutter;
      }
      delete area.gutter;
    }
  }
}

export default normalizeLayout;
