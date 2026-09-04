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

// The keys BlockLayout can act on. `disabled` is included: a block that opts out
// of the grid still asked for the wrapper div, so it keeps one.
// The content-arrangement keys (gap, align, justify, direction, wrap, overflow)
// are deliberately absent - they configure a container's slot Area, not the
// block's own column. See hasAreaKeys.
const LAYOUT_KEYS = [
  'disabled',
  'flex',
  'grow',
  'offset',
  'order',
  'pull',
  'push',
  'selfAlign',
  'shrink',
  'size',
  'span',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
];

// Key presence, not value: a layout key whose operator evaluates to null on this
// render still means "this block is laid out". Reading the value instead would
// add and remove the wrapper div as state changes, restructuring the DOM under
// the app on every toggle.
function hasLayoutKeys(layout) {
  if (!type.isObject(layout)) return false;
  return LAYOUT_KEYS.some((key) => key in layout);
}

export default hasLayoutKeys;
