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

import pino from 'pino';

import formatUiMessage from '../formatUiMessage.js';

const defaultErrSerializer = (err) => {
  if (!err) return err;
  return {
    message: err.message,
    name: err.name,
    stack: err.stack,
    source: err.source,
    config: err.config,
    configKey: err.configKey,
    isServiceError: err.isServiceError,
  };
};

const colorNames = ['red', 'green', 'yellow', 'blue', 'gray', 'white'];

function buildMergeObj(options) {
  if (!options) return {};
  const merge = {};
  if (options.color) merge.color = options.color;
  if (options.spin) merge.spin = true;
  if (options.succeed) merge.succeed = true;
  return merge;
}

function attachLevelMethods(logger) {
  const levels = ['error', 'warn', 'info', 'debug'];

  for (const level of levels) {
    const original = logger[level].bind(logger);
    const isErrorLevel = level === 'error' || level === 'warn';

    const wrapper = (first, second, ...rest) => {
      // Pino-native pass-through: (mergeObj, msg, ...rest)
      if (typeof second === 'string') {
        return original(first, second, ...rest);
      }

      // Error object handling (warn/error only)
      if (
        isErrorLevel &&
        typeof first !== 'string' &&
        first &&
        (first.name || first.message !== undefined)
      ) {
        if (first.source) {
          logger.info({ color: 'blue' }, first.source);
        }
        const msg = formatUiMessage(first);
        const merge = buildMergeObj(second);
        return original(merge, msg);
      }

      // Plain object (not an error): pino merge-object pass-through
      if (typeof first === 'object' && first !== null) {
        return original(first);
      }

      // String message: (msg) or (msg, { color, spin, succeed })
      const merge = buildMergeObj(second);
      return original(merge, first);
    };

    // Attach color sub-methods
    for (const color of colorNames) {
      wrapper[color] = (first, second, ...rest) => {
        if (typeof second === 'string') {
          return original({ ...first, color }, second, ...rest);
        }
        if (
          isErrorLevel &&
          typeof first !== 'string' &&
          first &&
          (first.name || first.message !== undefined)
        ) {
          if (first.source) {
            logger.info({ color: 'blue' }, first.source);
          }
          const msg = formatUiMessage(first);
          return original({ color }, msg);
        }
        // Plain object (not an error): pino merge-object pass-through
        if (typeof first === 'object' && first !== null) {
          return original({ ...first, color });
        }

        const merge = buildMergeObj(second);
        merge.color = color;
        return original(merge, first);
      };
    }

    logger[level] = wrapper;
  }

  // Wrap child to propagate level methods
  if (logger.child && !logger.child._lowdefyWrapped) {
    const originalChild = logger.child.bind(logger);
    logger.child = (...args) => attachLevelMethods(originalChild(...args));
    logger.child._lowdefyWrapped = true;
  }

  return logger;
}

function createNodeLogger({
  name = 'lowdefy',
  level = process.env.LOWDEFY_LOG_LEVEL ?? 'info',
  base = { pid: undefined, hostname: undefined },
  mixin,
  serializers,
  destination,
} = {}) {
  const logger = pino(
    {
      name,
      level,
      base,
      mixin,
      serializers: {
        err: defaultErrSerializer,
        ...serializers,
      },
    },
    destination
  );
  return attachLevelMethods(logger);
}

export default createNodeLogger;
export { defaultErrSerializer };
