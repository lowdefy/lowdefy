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

const DEFAULT_BLOCK_SIZE = 200;
const DEFAULT_MAX_BLOCKS = 20;

// `data: { mode: 'server', request, blockSize, maxBlocks }`, or null for client rows.
function normalizeServerData(data) {
  if (!type.isObject(data)) return null;
  if (data.mode !== 'server') {
    throw new Error(
      `Table "data" must be a list of rows or { mode: server, request }. Received ${JSON.stringify(
        data
      )}.`
    );
  }
  if (!type.isString(data.request)) {
    throw new Error(
      `Table server data requires "request", the id of a request on the page. Received ${JSON.stringify(
        data.request
      )}.`
    );
  }
  const blockSize = data.blockSize ?? DEFAULT_BLOCK_SIZE;
  if (!type.isInt(blockSize) || blockSize < 1) {
    throw new Error(
      `Table "data.blockSize" must be a positive integer. Received ${JSON.stringify(blockSize)}.`
    );
  }
  const maxBlocks = data.maxBlocks ?? DEFAULT_MAX_BLOCKS;
  if (!type.isInt(maxBlocks) || maxBlocks < 2) {
    throw new Error(
      `Table "data.maxBlocks" must be an integer of at least 2. Received ${JSON.stringify(
        maxBlocks
      )}.`
    );
  }
  return { request: data.request, blockSize, maxBlocks };
}

export default normalizeServerData;
