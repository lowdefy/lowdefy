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

// The keys Area can act on, on a slot's own config.
const AREA_KEYS = ['align', 'direction', 'gap', 'gutter', 'justify', 'overflow', 'wrap'];

// The keys a container's `layout` lends to its `content` slot. Mirrors
// layoutParamsToArea, deprecated aliases included - if a key is read there it
// must be seen here, or the Area that would have applied it is skipped.
const CONTENT_LAYOUT_KEYS = [
  'align',
  'contentAlign',
  'contentDirection',
  'contentGap',
  'contentGutter',
  'contentJustify',
  'contentOverflow',
  'contentWrap',
  'direction',
  'gap',
  'justify',
  'overflow',
  'wrap',
];

// Key presence, not value: see hasLayoutKeys.
function hasAreaKeys({ area, areaKey, layout }) {
  if (type.isObject(area) && AREA_KEYS.some((key) => key in area)) return true;
  if (areaKey !== 'content') return false;
  return type.isObject(layout) && CONTENT_LAYOUT_KEYS.some((key) => key in layout);
}

export default hasAreaKeys;
