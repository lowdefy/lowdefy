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

import createPrint from './createPrint.js';

function safeStringify(value) {
  if (typeof value === 'string') return value;
  if (value == null) return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatMessage(message, args) {
  if (args.length === 0) return safeStringify(message);
  return [message, ...args].map(safeStringify).join(' ');
}

function formatError(errorOrMessage, args) {
  if (args.length > 0) return formatMessage(errorOrMessage, args);
  if (typeof errorOrMessage === 'string') return errorOrMessage;
  if (errorOrMessage?.print) return errorOrMessage.print();
  if (errorOrMessage && (errorOrMessage.name || errorOrMessage.message !== undefined)) {
    const name = errorOrMessage.name || 'Error';
    const message = errorOrMessage.message ?? '';
    return `[${name}] ${message}`;
  }
  return safeStringify(errorOrMessage);
}

function createCliLogger({ logLevel } = {}) {
  const ui = createPrint({ logLevel });

  const logger = {
    ui,
    error: (errorOrMessage, ...args) => ui.error(formatError(errorOrMessage, args)),
    warn: (message, ...args) => ui.warn(formatMessage(message, args)),
    info: (message, ...args) => ui.info(formatMessage(message, args)),
    debug: (message, ...args) => ui.debug(formatMessage(message, args)),
    log: (message, ...args) => ui.log(formatMessage(message, args)),
    child: () => logger,
    isLevelEnabled: () => true,
  };

  return logger;
}

export default createCliLogger;
