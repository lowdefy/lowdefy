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

const layoutParamsToSlot = ({ slotKey, slot = {}, layout = {} }) => {
  if (slotKey !== 'content') {
    return slot;
  }
  slot.align = type.isNone(slot.align) ? layout.contentAlign : slot.align;
  slot.direction = type.isNone(slot.direction) ? layout.contentDirection : slot.direction;
  slot.gutter = type.isNone(slot.gutter) ? layout.contentGutter : slot.gutter;
  slot.justify = type.isNone(slot.justify) ? layout.contentJustify : slot.justify;
  slot.overflow = type.isNone(slot.overflow) ? layout.contentOverflow : slot.overflow;
  slot.wrap = type.isNone(slot.wrap) ? layout.contentWrap : slot.wrap;
  return slot;
};

export default layoutParamsToSlot;
