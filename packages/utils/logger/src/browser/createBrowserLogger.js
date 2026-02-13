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
      console.error(formatBrowserError(errorOrMessage));
    },
    warn: (...args) => console.warn(...args),
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
    log: (...args) => console.log(...args),
  };

  logger.ui = {
    log: (text) => logger.log(text),
    dim: (text) => logger.log(text),
    info: (text) => logger.info(text),
    warn: (messageOrObj) => {
      if (messageOrObj?.source) logger.info(messageOrObj.source);
      logger.warn(formatUiMessage(messageOrObj));
    },
    error: (messageOrObj) => {
      if (messageOrObj?.source) logger.info(messageOrObj.source);
      logger.error(formatUiMessage(messageOrObj));
    },
    debug: (text) => logger.debug(text),
    link: (text) => logger.info(text),
    spin: (text) => logger.info(text),
    succeed: (text) => logger.info(text),
  };

  return logger;
}

export default createBrowserLogger;
