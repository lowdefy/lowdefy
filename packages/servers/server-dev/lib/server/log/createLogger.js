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

import pino from 'pino';

function formatReceived(message, received) {
  if (received === undefined) {
    return message;
  }
  try {
    return `${message} Received: ${JSON.stringify(received)}`;
  } catch {
    return `${message} Received: [unserializable]`;
  }
}

const pinoLogger = pino({
  name: 'lowdefy_server',
  level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
  base: { pid: undefined, hostname: undefined },
  serializers: {
    err: (err) => ({
      message: err.message,
      name: err.name,
      stack: err.stack,
      source: err.source,
      config: err.config,
      configKey: err.configKey,
      isServiceError: err.isServiceError,
    }),
  },
});

// Wrap logger to handle error objects passed to logger.error(error)
function wrapLogger(logger) {
  const originalError = logger.error.bind(logger);
  const originalInfo = logger.info.bind(logger);

  logger.error = (errorOrMessage, ...args) => {
    // If it's an Error object (has name property - covers Error instances and error-like objects)
    if (errorOrMessage?.name) {
      // Log source first if available
      if (errorOrMessage.source) {
        originalInfo(errorOrMessage.source);
      }
      const errorName = errorOrMessage.name || 'Error';
      // Handle undefined message (which JS converts to string "undefined")
      const rawMessage = errorOrMessage.message;
      const message =
        rawMessage && rawMessage !== 'undefined' ? rawMessage : 'Unknown error';
      const errorMessage = formatReceived(message, errorOrMessage.received);
      originalError(`[${errorName}] ${errorMessage}`);
      return;
    }
    // Pass through normal calls
    originalError(errorOrMessage, ...args);
  };

  return logger;
}

function createLogger(metadata = {}) {
  const childLogger = pinoLogger.child(metadata);
  return wrapLogger(childLogger);
}

export default createLogger;
