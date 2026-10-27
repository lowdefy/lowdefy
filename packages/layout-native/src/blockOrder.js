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

import isFlexChild from './isFlexChild.js';
import resolveColumn from './resolveColumn.js';

/**
 * A block's order in its area at a breakpoint (default 0). React Native has no `order` style, so
 * the renderer sorts an area's blocks by it.
 */
function blockOrder({ breakpoint, layout = {} }) {
  if (isFlexChild(layout)) {
    return layout.order ?? 0;
  }
  return resolveColumn({ breakpoint, layout }).order;
}

export default blockOrder;
