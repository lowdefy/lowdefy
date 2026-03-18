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
import { ConfigWarning } from '@lowdefy/errors';

function validateSlots(block, pageContext) {
  const blockMeta = pageContext.context.blockMetas?.[block.type];
  if (!blockMeta) return;
  if (blockMeta.slots === false) return;
  if (!type.isArray(blockMeta.slots)) return;

  if (!type.isObject(block.slots)) return;

  const validSlots = new Set(blockMeta.slots);
  for (const slotKey of Object.keys(block.slots)) {
    if (!validSlots.has(slotKey)) {
      pageContext.context.handleWarning(
        new ConfigWarning(
          `Block "${block.blockId}" (${block.type}): Unknown slot "${slotKey}". Valid slots: ${[...validSlots].join(', ')}.`,
          { configKey: block.slots[slotKey]?.['~k'] ?? block['~k'] }
        )
      );
    }
  }
}

export default validateSlots;
