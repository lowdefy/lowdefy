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
import { ConfigError } from '@lowdefy/node-utils';

function validateBlock(block, { pageId, context }) {
  const configKey = block?.['~k'];
  if (!type.isObject(block)) {
    throw new ConfigError({
      message: `Expected block to be an object on page "${pageId}". Received ${JSON.stringify(
        block
      )}.`,
      configKey,
      context,
    });
  }
  if (type.isUndefined(block.id)) {
    throw new ConfigError({
      message: `Block id missing at page "${pageId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(block.id)) {
    throw new ConfigError({
      message: `Block id is not a string at page "${pageId}". Received ${JSON.stringify(
        block.id
      )}.`,
      configKey,
      context,
    });
  }
  if (type.isNone(block.type)) {
    throw new ConfigError({
      message: `Block type is not defined at "${block.id}" on page "${pageId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(block.type)) {
    throw new ConfigError({
      message: `Block type is not a string at "${
        block.id
      }" on page "${pageId}". Received ${JSON.stringify(block.type)}.`,
      configKey,
      context,
    });
  }
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new ConfigError({
        message: `Requests is not an array at "${
          block.id
        }" on page "${pageId}". Received ${JSON.stringify(block.requests)}`,
        configKey,
        context,
      });
    }
  }
}

export default validateBlock;
