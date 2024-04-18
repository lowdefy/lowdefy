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

import { applyArrayIndices, type } from '@lowdefy/helpers';

function createCallMethod({ arrayIndices, context }) {
  return function callMethod(params) {
    const { blockId, method, args = [] } = params;
    const blockMethod =
      context._internal.RootBlocks.map[applyArrayIndices(arrayIndices, blockId)].methods[method];
    if (!type.isArray(args)) {
      throw new Error(
        `Failed to call method "${method}" on block "${blockId}": "args" should be an array. Received "${JSON.stringify(
          params
        )}".`
      );
    }
    if (!type.isFunction(blockMethod)) {
      throw new Error(
        `Failed to call method "${method}" on block "${blockId}". Check if "${method}" is a valid block method for block "${blockId}". Received "${JSON.stringify(
          params
        )}".`
      );
    }
    return blockMethod(...args);
  };
}

export default createCallMethod;
