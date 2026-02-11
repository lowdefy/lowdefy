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

import formatUiMessage from '../formatUiMessage.js';

function formatBrowserError(errorOrMessage) {
  if (typeof errorOrMessage === 'string') return errorOrMessage;
  if (errorOrMessage?.print) return errorOrMessage.print();
  if (errorOrMessage && (errorOrMessage.name || errorOrMessage.message !== undefined)) {
    const name = errorOrMessage.name || 'Error';
    const message = errorOrMessage.message ?? '';
    return `[${name}] ${message}`;
  }
  return errorOrMessage;
}

function createBrowserLogger() {
  const logger = {
    error: (errorOrMessage, ...args) => {
      if (args.length > 0) {
        console.error(errorOrMessage, ...args);
        return;
      }
      if (
        typeof errorOrMessage !== 'string' &&
        errorOrMessage &&
        (errorOrMessage.name || errorOrMessage.message !== undefined)
      ) {
        if (errorOrMessage.source) {
          console.info(errorOrMessage.source);
        }
        console.error(formatBrowserError(errorOrMessage));
        return;
      }
      console.error(formatBrowserError(errorOrMessage));
    },
    warn: (messageOrObj, ...args) => {
      if (args.length > 0) {
        console.warn(messageOrObj, ...args);
        return;
      }
      if (
        typeof messageOrObj !== 'string' &&
        messageOrObj &&
        (messageOrObj.name || messageOrObj.message !== undefined)
      ) {
        if (messageOrObj.source) {
          console.info(messageOrObj.source);
        }
        console.warn(formatUiMessage(messageOrObj));
        return;
      }
      console.warn(formatUiMessage(messageOrObj));
    },
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
  };

  return logger;
}

export default createBrowserLogger;
