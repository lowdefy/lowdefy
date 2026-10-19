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

import handlePointerLeave from './handlePointerLeave.js';
import handlePointerOver from './handlePointerOver.js';
import handleRowBlur from './handleRowBlur.js';
import handleRowFocus from './handleRowFocus.js';
import useFastScroll from './useFastScroll.js';

// Feeds `api.cellActivity`, which tier-1 cells (core/LazyCell.js) read to decide when to mount:
// the hovered row and the focused row through the grid's delegated listeners, and fast scrolling
// from the scroller. Its handlers never stop the chain.
const lazyCellsFeature = {
  name: 'lazyCells',
  gridHandlers: {
    blur: handleRowBlur,
    focus: handleRowFocus,
    pointerleave: handlePointerLeave,
    pointerover: handlePointerOver,
  },
  useGridFeature: useFastScroll,
};

export default lazyCellsFeature;
