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

// The keys that make a block a flex child rather than a grid column, mirroring
// deriveFlex in @lowdefy/layout: any of them short-circuits the span classes.
const FLEX_KEYS = ['flex', 'grow', 'shrink', 'size'];

function isFlexChild(layout) {
  return FLEX_KEYS.some((key) => !type.isNone(layout[key]));
}

export default isFlexChild;
