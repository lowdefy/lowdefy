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

function setBlockId(block, { pageId, blockIdCounter }) {
  block.blockId = block.id;
  if (block.blockId === pageId && blockIdCounter.getCount(block.blockId) > 0) {
    throw new ConfigError(
      `Block id "${block.blockId}" on page "${pageId}" collides with the page id. A block cannot have the same id as its page.`,
      { configKey: block['~k'] }
    );
  }
  block.id = `block:${pageId}:${block.blockId}:${blockIdCounter.getCount(block.blockId)}`;
  blockIdCounter.increment(block.blockId);
}

export default setBlockId;
