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

import { type } from '@lowdefy/helpers';

function validateBlock(block, { pageId }) {
  if (!type.isObject(block)) {
    throw new Error(
      `Expected block to be an object on page "${pageId}". Received ${JSON.stringify(block)}.`
    );
  }
  if (type.isUndefined(block.id)) {
    throw new Error(`Block id missing at page "${pageId}".`);
  }
  if (!type.isString(block.id)) {
    throw new Error(
      `Block id is not a string at page "${pageId}". Received ${JSON.stringify(block.id)}.`
    );
  }
  if (type.isNone(block.type)) {
    throw new Error(`Block type is not defined at "${block.id}" on page "${pageId}".`);
  }
  if (!type.isString(block.type)) {
    throw new Error(
      `Block type is not a string at "${block.id}" on page "${pageId}". Received ${JSON.stringify(
        block.type
      )}.`
    );
  }
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new Error(
        `Requests is not an array at "${block.id}" on page "${pageId}". Received ${JSON.stringify(
          block.requests
        )}`
      );
    }
  }
}

export default validateBlock;
