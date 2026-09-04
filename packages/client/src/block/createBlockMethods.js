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
// method that is not on it throws a located BlockError naming the block and
// listing the methods that are, instead of the bare "methods.x is not a
// function" TypeError the ErrorBoundary would otherwise report. A key that the
// plugin API used to carry gets its removal and replacement named as well.
// Generic on purpose: every future removal, and every typo, is explained
// without a registry anyone has to remember to update.
//
// Dev only. The developer who needs the message is always in dev, and the
// trap runs on every property access of `methods` in every block render, so
// production takes the bare TypeError instead. Both server vite configs define
// process.env.NODE_ENV, so the whole branch is eliminated from the production
// bundle.
const IS_DEV = process.env.NODE_ENV !== 'production';

// Names JavaScript itself probes for on any object it is handed: awaiting a
// value reads `then`, JSON.stringify reads `toJSON`. Neither is a block
// reaching for a method that does not exist. Every other inherited name
// (toString, valueOf, hasOwnProperty) is already on the prototype chain and so
// passes the `in` check.
const PROBE_KEYS = new Set(['then', 'toJSON']);

const METHOD_NAME = /^[a-z][A-Za-z0-9]*$/;

// One proxy per bag: the render sites call this on every render over the same
// engine methods object (Object.assign mutates and returns it), and before the
// proxy that same object WAS the `methods` prop — referentially stable across
// renders. Caching on the bag keeps that identity contract, so React.memo
// blocks and plugin effects with `methods` in their deps behave as before.
// The cached proxy captures the blockId it was first created with, which is
// correct only because the engine gives every block its own bag
// (packages/engine/src/Block.js). Sharing one bag between two render sites
// would name the wrong block in the error.
const proxyCache = new WeakMap();

function missingMethodMessage({ blockId, blockType, key, target }) {
  const removed = REMOVED_BLOCK_METHODS[key];
  if (removed) {
    return `Block "${blockId}" (type ${blockType}) called the removed block method "${key}". ${removed} (plugin API v${PLUGIN_API_VERSION})`;
  }
  const available = Object.keys(target).sort();
  return `Block "${blockId}" (type ${blockType}) called the block method "${key}", which it does not have. Available methods: ${
    available.length === 0 ? 'none' : available.join(', ')
  }. A block's own methods come from methods.registerMethod. (plugin API v${PLUGIN_API_VERSION})`;
}

function createBlockMethods({ blockId, blockType, configKey, methods }) {
  if (!IS_DEV) {
    return methods;
  }
  const cached = proxyCache.get(methods);
  if (cached) {
    return cached;
  }
  const proxy = new Proxy(methods, {
    get(target, key, receiver) {
      if (
        typeof key === 'string' &&
        !(key in target) &&
        !PROBE_KEYS.has(key) &&
        METHOD_NAME.test(key)
      ) {
        throw new BlockError(missingMethodMessage({ blockId, blockType, key, target }), {
          typeName: blockType,
          configKey,
        });
      }
      return Reflect.get(target, key, receiver);
    },
  });
  proxyCache.set(methods, proxy);
  return proxy;
}

export default createBlockMethods;
