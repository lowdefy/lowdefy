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

import areaBlocksOf from './areaBlocksOf.js';
import walkSiblings from './walkSiblings.js';

// Walk one sub-slot's areas, each as its own sibling list so rows never span
// two areas, at the width the parent block resolved to.
async function walkAreas({ subSlot, availableWidth, walk }) {
  const areas = {};
  for (const [areaKey, blocks] of Object.entries(areaBlocksOf(subSlot))) {
    areas[areaKey] = await walkSiblings({ blocks, availableWidth, walk });
  }
  return areas;
}

export default walkAreas;
