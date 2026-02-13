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

function wrapErrorLogger(logger, { includeSource = true } = {}) {
  if (logger.error._lowdefyWrapped) return logger;

  const originalError = logger.error.bind(logger);
  const originalInfo = logger.info?.bind(logger);

  const wrappedError = (errorOrMessage, ...args) => {
    if (args.length > 0) {
      originalError(errorOrMessage, ...args);
      return;
    }

    if (typeof errorOrMessage === 'string') {
      originalError(errorOrMessage);
      return;
    }

    if (errorOrMessage && (errorOrMessage.name || errorOrMessage.message !== undefined)) {
      // Log source as separate blue link line
      if (includeSource && errorOrMessage.source && originalInfo) {
        originalInfo({ print: 'link' }, errorOrMessage.source);
      }

      const msg = errorOrMessage.print
        ? errorOrMessage.print()
        : `[${errorOrMessage.name || 'Error'}] ${errorOrMessage.message}`;
      originalError(msg);
      return;
    }

    originalError(errorOrMessage);
  };

  wrappedError._lowdefyWrapped = true;
  logger.error = wrappedError;

  return logger;
}

export default wrapErrorLogger;
