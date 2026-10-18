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

import { blockOrder } from '@lowdefy/layout-native';

// React Native has no order style, so an area draws its blocks sorted by their layout order at
// the current breakpoint. The sort is stable: blocks of the same order keep their config order.
function sortByOrder({ blocks, breakpoint, getLayout }) {
  return blocks
    .map((block, index) => ({
      block,
      index,
      order: blockOrder({ breakpoint, layout: getLayout(block) }),
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ block, index }) => ({ block, index }));
}

export default sortByOrder;
