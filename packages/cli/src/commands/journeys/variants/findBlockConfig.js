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
import { normaliseBlockId } from '@lowdefy/node-utils';

function findInBlock({ block, blockId }) {
  if (block.blockId === blockId) {
    return block;
  }
  for (const slot of Object.values(block.slots ?? {})) {
    for (const child of slot.blocks ?? []) {
      const found = findInBlock({ block: child, blockId });
      if (!type.isNull(found)) {
        return found;
      }
    }
  }
  return null;
}

// A block's built config, looked up by id across the pages the journey
// visited (GET /lowdefy-docs/page-config), the start page first. A List
// item's id is looked up in its config form, with `$`.
function findBlockConfig({ pageConfigs, blockId }) {
  const configId = normaliseBlockId(blockId);
  for (const pageConfig of pageConfigs) {
    const found = findInBlock({ block: pageConfig, blockId: configId });
    if (!type.isNull(found)) {
      return found;
    }
  }
  return null;
}

export default findBlockConfig;
