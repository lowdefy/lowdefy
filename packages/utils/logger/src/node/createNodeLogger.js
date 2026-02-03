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

function attachUi(logger) {
  if (logger.ui) return logger;
  logger.ui = {
    log: (text) => logger.info({ print: 'log' }, text),
    dim: (text) => logger.info({ print: 'dim' }, text),
    info: (text) => logger.info({ print: 'info' }, text),
    warn: (text) => logger.warn({ print: 'warn' }, text),
    error: (text) => logger.error({ print: 'error' }, text),
    debug: (text) => logger.debug({ print: 'debug' }, text),
    link: (text) => logger.info({ print: 'link' }, text),
    spin: (text) => logger.info({ print: 'spin' }, text),
    succeed: (text) => logger.info({ print: 'succeed' }, text),
  };

  if (logger.child && !logger.child._lowdefyWrapped) {
    const originalChild = logger.child.bind(logger);
    logger.child = (...args) => attachUi(originalChild(...args));
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
  return attachUi(logger);
}

export default createNodeLogger;
export { defaultErrSerializer };
