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

import createPrint from './createPrint.js';
import formatUiMessage from '../formatUiMessage.js';

const colorNames = ['red', 'green', 'yellow', 'blue', 'gray', 'white'];

function createCliLogger({ logLevel } = {}) {
  const print = createPrint({ logLevel });

  function createLevelMethod(level) {
    const isErrorLevel = level === 'error' || level === 'warn';

    const method = (first, options) => {
      // Handle spin/succeed options
      if (options?.spin) {
        print.spin(typeof first === 'string' ? first : formatUiMessage(first));
        return;
      }
      if (options?.succeed) {
        print.succeed(typeof first === 'string' ? first : formatUiMessage(first));
        return;
      }

      // Error object handling (warn/error only)
      if (
        isErrorLevel &&
        typeof first !== 'string' &&
        first &&
        (first.name || first.message !== undefined)
      ) {
        if (first.source) {
          logger.info.blue(first.source);
        }
        print[level](formatUiMessage(first), { color: options?.color });
        return;
      }

      // String message
      const text = typeof first === 'string' ? first : formatUiMessage(first);
      print[level](text, { color: options?.color });
    };

    // Attach color sub-methods
    for (const color of colorNames) {
      method[color] = (first, options) => {
        if (options?.spin) {
          print.spin(typeof first === 'string' ? first : formatUiMessage(first));
          return;
        }
        if (options?.succeed) {
          print.succeed(typeof first === 'string' ? first : formatUiMessage(first));
          return;
        }

        if (
          isErrorLevel &&
          typeof first !== 'string' &&
          first &&
          (first.name || first.message !== undefined)
        ) {
          if (first.source) {
            logger.info.blue(first.source);
          }
          print[level](formatUiMessage(first), { color });
          return;
        }

        const text = typeof first === 'string' ? first : formatUiMessage(first);
        print[level](text, { color });
      };
    }

    return method;
  }

  const logger = {
    error: createLevelMethod('error'),
    warn: createLevelMethod('warn'),
    info: createLevelMethod('info'),
    debug: createLevelMethod('debug'),
    child: () => logger,
    isLevelEnabled: () => true,
  };

  return logger;
}

export default createCliLogger;
