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

import cn from './cn.js';

// The block root contract. Every block renders these props on the element it owns,
// so a block is addressable as `#<blockId>` and carries the app author's `class:`
// and `style:` on its own root rather than on a layout wrapper that may not exist.
// The `block` slot is merged in ahead of `element` so the contract stays lossless
// once the layout wrapper stops applying it.
function blockRootProps({ blockId, classNames, styles, className, style } = {}) {
  return {
    id: blockId,
    'data-testid': blockId,
    className: cn(className, classNames?.block, classNames?.element),
    style: { ...style, ...styles?.block, ...styles?.element },
  };
}

export default blockRootProps;
