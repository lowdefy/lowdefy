/*
  Copyright 2020-2021 Lowdefy, Inc

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
import buildRequests from './buildRequests';
import setBlockMeta from './setBlockMeta';

async function buildBlock(block, blockContext) {
  if (!type.isObject(block)) {
    throw new Error(
      `Expected block to be an object on ${blockContext.pageId}. Received ${JSON.stringify(block)}`
    );
  }
  if (!type.isString(block.id)) {
    if (type.isUndefined(block.id)) {
      throw new Error(`Block id missing at page "${blockContext.pageId}".`);
    }
    throw new Error(
      `Block id is not a string at page "${blockContext.pageId}". Received ${JSON.stringify(
        block.id
      )}.`
    );
  }
  block.blockId = block.id;
  block.id = `block:${blockContext.pageId}:${block.id}`;
  await setBlockMeta(block, blockContext.getMeta, blockContext.pageId);

  let newBlockContext = blockContext;
  if (block.meta.category === 'context') {
    newBlockContext = {
      auth: blockContext.auth,
      contextId: block.blockId,
      getMeta: blockContext.getMeta,
      pageId: blockContext.pageId,
      requests: [],
    };
  }
  buildRequests(block, newBlockContext);
  if (block.meta.category === 'context') {
    block.requests = newBlockContext.requests;
  }

  if (block.events) {
    Object.keys(block.events).map((key) => {
      if (type.isArray(block.events[key])) {
        block.events[key] = {
          try: block.events[key],
          catch: [],
        };
      }
      if (!type.isArray(block.events[key].try)) {
        throw new Error(
          `Events must be an array of actions at ${block.blockId} in events ${key} on page ${
            newBlockContext.pageId
          }. Received ${JSON.stringify(block.events[key].try)}`
        );
      }
      if (!type.isArray(block.events[key].catch) && !type.isNone(block.events[key].catch)) {
        throw new Error(
          `Catch events must be an array of actions at ${block.blockId} in events ${key} on page ${
            newBlockContext.pageId
          }. Received ${JSON.stringify(block.events[key].catch)}`
        );
      }
    });
  }

  if (!type.isNone(block.blocks)) {
    if (!type.isArray(block.blocks)) {
      throw new Error(
        `Blocks at ${block.blockId} on page ${
          newBlockContext.pageId
        } is not an array. Received ${JSON.stringify(block.blocks)}`
      );
    }
    set(block, 'areas.content.blocks', block.blocks);
    delete block.blocks;
  }
  if (type.isObject(block.areas)) {
    let promises = [];
    Object.keys(block.areas).forEach((key) => {
      if (type.isNone(block.areas[key].blocks)) {
        block.areas[key].blocks = [];
      }
      if (!type.isArray(block.areas[key].blocks)) {
        throw new Error(
          `Expected blocks to be an array at ${block.blockId} in area ${key} on page ${
            newBlockContext.pageId
          }. Received ${JSON.stringify(block.areas[key].blocks)}`
        );
      }
      const blockPromises = block.areas[key].blocks.map(async (blk) => {
        await buildBlock(blk, newBlockContext);
      });
      promises = promises.concat(blockPromises);
    });
    await Promise.all(promises);
  }
}

export default buildBlock;
