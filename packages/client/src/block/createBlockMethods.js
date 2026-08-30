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
import { PLUGIN_API_VERSION, REMOVED_BLOCK_METHODS } from '@lowdefy/block-utils';
import { BlockError } from '@lowdefy/errors';

// Wraps the methods bag a block component receives so that reaching for a
// method the plugin API has removed throws a located BlockError naming the
// removal and its replacement, instead of the bare
// "methods.makeCssClass is not a function" TypeError the ErrorBoundary would
// otherwise report. Every other key, and has/set/ownKeys, pass straight
// through to the underlying bag, so blocks that register their own methods
// under a removed name keep working.
function createBlockMethods({ blockId, blockType, configKey, methods }) {
  return new Proxy(methods, {
    get(target, key, receiver) {
      if (typeof key === 'string' && key in REMOVED_BLOCK_METHODS && !(key in target)) {
        throw new BlockError(
          `Block "${blockId}" (type ${blockType}) called the removed block method "${key}". ${REMOVED_BLOCK_METHODS[key]} (plugin API v${PLUGIN_API_VERSION})`,
          { typeName: blockType, configKey }
        );
      }
      return Reflect.get(target, key, receiver);
    },
  });
}

export default createBlockMethods;
