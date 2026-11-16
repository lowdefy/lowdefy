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
import pollUntil from './pollUntil.js';

function readBlockId(target) {
  return type.isString(target) ? target : target?.blockId;
}

// The block a step targets once the actor's page shows it (isBlockShown: it and every block
// holding it visible, and every Modal or Drawer among them open), waiting up to `timeout` ms, as
// the browser waits for a target to be visible. Throws when it is not shown by then.
async function waitForShownBlock({ actor, target, timeout }) {
  const blockId = readBlockId(target);
  const read = () => {
    const context = actor.page?.context;
    const block = context?._internal.RootSlots.map[blockId];
    if (type.isNone(block)) {
      return null;
    }
    const { parents } = collectBlockParents({ context });
    return isBlockShown({ block, openBlocks: actor.page.openBlocks, parents }) ? block : null;
  };
  const { held, value } = await pollUntil({ check: (block) => block !== null, read, timeout });
  if (!held) {
    throw new Error(`Block "${blockId}" is not visible. Waited ${timeout} ms.`);
  }
  return value;
}

export default waitForShownBlock;
