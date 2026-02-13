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
import createNodeLogger from '../node/createNodeLogger.js';

function createDevLogger({ level = 'info', name = 'lowdefy build' } = {}) {
  const destination = pino.destination({ dest: 1, sync: true });
  let logger;
  logger = createNodeLogger({
    name,
    level,
    base: { pid: undefined, hostname: undefined },
    destination,
    mixin: (context, levelNumber) => ({
      ...context,
      print: context.print ?? logger.levels.labels[levelNumber],
    }),
  });

  const createUi = (target) => ({
    log: (text) => target.info({ print: 'log' }, text),
    dim: (text) => target.info({ print: 'dim' }, text),
    info: (text) => target.info({ print: 'info' }, text),
    warn: (messageOrObj) => {
      if (messageOrObj?.source) {
        target.info({ print: 'link' }, messageOrObj.source);
      }
      target.warn({ print: 'warn' }, formatUiMessage(messageOrObj));
    },
    error: (messageOrObj) => {
      if (messageOrObj?.source) {
        target.info({ print: 'link' }, messageOrObj.source);
      }
      target.error({ print: 'error' }, formatUiMessage(messageOrObj));
    },
    debug: (text) => target.debug({ print: 'debug' }, text),
    link: (text) => target.info({ print: 'link' }, text),
    spin: (text) => target.info({ print: 'spin' }, text),
    succeed: (text) => target.info({ print: 'succeed' }, text),
  });

  logger.ui = createUi(logger);
  if (logger.child) {
    const originalChild = logger.child.bind(logger);
    logger.child = (...args) => {
      const child = originalChild(...args);
      child.ui = createUi(child);
      return child;
    };
  }
  return logger;
}

export default createDevLogger;
