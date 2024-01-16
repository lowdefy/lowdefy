/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { set, type } from '@lowdefy/helpers';

function recMoveSkeletonBlocksToArea(block, blockId, pageId) {
  if (!type.isNone(block.blocks)) {
    if (!type.isArray(block.blocks)) {
      throw new Error(
        `Skeleton blocks at ${blockId} on page ${pageId} is not an array. Received ${JSON.stringify(
          block.blocks
        )}`
      );
    }
    set(block, 'areas.content.blocks', block.blocks);
    delete block.blocks;
  }
  Object.keys(block.areas || {}).forEach((area) => {
    block.areas[area].blocks.forEach((block, i) => {
      recMoveSkeletonBlocksToArea(block, `${blockId}.areas.${area}.${i}.blocks`, pageId);
    });
  });
}

function moveSkeletonBlocksToArea(block, pageContext) {
  if (type.isObject(block.skeleton)) {
    recMoveSkeletonBlocksToArea(block.skeleton, `${block.blockId}.skeleton`, pageContext.pageId);
  }
}

export default moveSkeletonBlocksToArea;
