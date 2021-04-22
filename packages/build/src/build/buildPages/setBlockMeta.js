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

import { type } from '@lowdefy/helpers';

async function setBlockMeta(block, metaLoader, pageId) {
  if (type.isNone(block.type)) {
    throw new Error(`Block type is not defined at ${block.blockId} on page ${pageId}.`);
  }
  if (!type.isString(block.type)) {
    throw new Error(
      `Block type is not a string at ${block.blockId} on page ${pageId}. Received ${JSON.stringify(
        block.type
      )}`
    );
  }
  const meta = await metaLoader.load(block.type);
  if (!meta) {
    throw new Error(
      `Invalid Block type at ${block.blockId} on page ${pageId}. Received ${JSON.stringify(
        block.type
      )}`
    );
  }
  const { category, loading, moduleFederation, valueType } = meta;
  block.meta = { category, loading, moduleFederation };
  if (category === 'input') {
    block.meta.valueType = valueType;
  }

  if (category === 'list') {
    // include valueType to ensure block has value on init
    block.meta.valueType = 'array';
  }
  // Add user defined loading
  if (block.loading) {
    block.meta.loading = block.loading;
  }
}

export default setBlockMeta;
