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

import collectBlockParents from './collectBlockParents.js';
import isBlockShown from './isBlockShown.js';

// The block `blockId` names on the actor's page when the page shows it (isBlockShown: its
// component renders, it and every block holding it are visible, and every Modal or Drawer among
// them is open), else null.
function readShownBlock({ actor, blockId }) {
  const context = actor.page?.context;
  const block = context?._internal.RootSlots.map[blockId];
  if (type.isNone(block)) {
    return null;
  }
  const { parents } = collectBlockParents({ context });
  return isBlockShown({ block, page: actor.page, parents }) ? block : null;
}

export default readShownBlock;
