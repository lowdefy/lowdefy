/*
  Copyright 2020-2022 Lowdefy, Inc

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

import buildBlock from './buildBlock.js';

async function buildSubBlocks(block, pageContext) {
  if (type.isObject(block.areas)) {
    let promises = [];
    Object.keys(block.areas).forEach((key) => {
      if (type.isNone(block.areas[key].blocks)) {
        block.areas[key].blocks = [];
      }
      if (!type.isArray(block.areas[key].blocks)) {
        throw new Error(
          `Expected blocks to be an array at ${block.blockId} in area ${key} on page ${
            pageContext.pageId
          }. Received ${JSON.stringify(block.areas[key].blocks)}`
        );
      }
      const blockPromises = block.areas[key].blocks.map(async (blk) => {
        await buildBlock(blk, pageContext);
      });
      promises = promises.concat(blockPromises);
    });
    await Promise.all(promises);
  }
}

export default buildSubBlocks;
