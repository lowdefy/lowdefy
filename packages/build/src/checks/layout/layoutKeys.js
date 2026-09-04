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

// The two halves of the layout object, split the way the runtime splits it.
//
// ITEM_KEYS are read by deriveLayout/BlockLayout and describe the block itself:
// how wide it is and how it sits in its parent. AREA_KEYS are read by
// layoutParamsToArea/Area and describe the block's own content area: how its
// children are arranged. A block's layout: may carry both, because a block
// layout doubles as the shorthand for its content area.
//
// The deprecated content* spellings (contentGap, contentAlign, …) and the
// deprecated `gutter` are renamed by normalizeLayout, which runs in buildBlock
// long before checks, so only the current names can be seen here.
const ITEM_KEYS = [
  'span',
  'offset',
  'order',
  'push',
  'pull',
  'flex',
  'grow',
  'shrink',
  'size',
  'selfAlign',
  'disabled',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
];

const AREA_KEYS = ['direction', 'align', 'justify', 'wrap', 'gap', 'overflow'];

export { AREA_KEYS, ITEM_KEYS };
