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

import findPageContext from '../tab/findPageContext.js';
import getShownPage from '../tab/getShownPage.js';
import waitUntil from './waitUntil.js';

// A step's target: a block id, or `{ blockId }`. The browser's grid, text and nth targets read the
// DOM, which a phone does not have.
function readBlockId(target) {
  if (type.isString(target)) {
    return target;
  }
  if (type.isObject(target) && type.isString(target.blockId)) {
    const others = Object.keys(target).filter((key) => !['blockId', 'value'].includes(key));
    if (others.length > 0) {
      throw new Error(
        `A step on a phone targets a block by blockId only. Received ${JSON.stringify(target)}.`
      );
    }
    return target.blockId;
  }
  throw new Error(
    `A step target must be a blockId or { blockId }. Received ${JSON.stringify(target)}.`
  );
}

/**
 * The block a step acts on, on the page the shell shows: `{ block, context, page }`. Its view is
 * the one with the block id as testID (client-native BlockLayout), so a step needs no screen
 * position. Waits up to `timeout` ms for the page to render the block and show it.
 */
async function findBlock({ lowdefy, target, timeout }) {
  const blockId = readBlockId(target);
  let lastError = null;
  const found = await waitUntil({
    timeout,
    check: () => {
      const page = getShownPage(lowdefy);
      const { context, error } = findPageContext({ lowdefy, page });
      if (error) {
        lastError = error;
        return undefined;
      }
      const block = context._internal.RootSlots?.map?.[blockId];
      if (type.isNone(block)) {
        lastError = `Block "${blockId}" is not on page "${page.pageId}".`;
        return undefined;
      }
      if (block.eval?.visible === false) {
        lastError = `Block "${blockId}" is not visible.`;
        return undefined;
      }
      return { block, context, page };
    },
  });
  if (found === undefined) {
    throw new Error(`${lastError} Waited ${timeout} ms.`);
  }
  return found;
}

export default findBlock;
