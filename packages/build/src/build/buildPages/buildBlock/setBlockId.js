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

import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../../utils/collectExceptions.js';

function setBlockId(
  block,
  { context, pageId, blockIdCounter, blockIdPrefix, checkDuplicateBlockId }
) {
  block.blockId = block.id;
  // Both id checks collect and carry on: the counter still gives this block a
  // unique artifact id, so the page keeps building and reports the rest of its
  // errors in the same build.
  if (block.blockId === pageId && blockIdCounter.getCount(block.blockId) > 0) {
    collectExceptions(
      context,
      new ConfigError(
        `Block id "${block.blockId}" on page "${pageId}" collides with the page id. A block cannot have the same id as its page.`,
        { configKey: block['~k'] }
      )
    );
  }
  // Optional: dynamic content builds its own pageContext without the check —
  // its ids are namespaced under the resolving Dynamic block's id.
  checkDuplicateBlockId?.({ id: block.blockId, configKey: block['~k'] });
  // blockIdPrefix namespaces runtime-built dynamic content ids under the
  // resolving Dynamic block's id so they can never collide with static ids.
  const prefix = blockIdPrefix ?? `block:${pageId}`;
  block.id = `${prefix}:${block.blockId}:${blockIdCounter.getCount(block.blockId)}`;
  blockIdCounter.increment(block.blockId);
}

export default setBlockId;
