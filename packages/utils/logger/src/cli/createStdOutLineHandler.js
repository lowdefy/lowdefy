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

import {
  ActionError,
  BlockError,
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';

// Map pino numeric levels to level names
const pinoLevelToName = {
  10: 'debug', // trace
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error', // fatal
};

const lowdefyErrorTypes = {
  ActionError,
  BlockError,
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  UserError,
};

function reconstructError(flatObj) {
  const ErrorClass = lowdefyErrorTypes[flatObj.name] || Error;
  const error = Object.create(ErrorClass.prototype);
  for (const [k, v] of Object.entries(flatObj)) {
    error[k] = v;
  }
  return error;
}

function createStdOutLineHandler({ context }) {
  const logger = context?.logger ?? {
    error: (text) => console.error(text),
    warn: (text) => console.warn(text),
    info: (text) => console.info(text),
    debug: (text) => console.debug(text),
  };

  function stdOutLineHandler(line) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      logger.info(line);
      return;
    }

    const levelName = pinoLevelToName[parsed.level] ?? 'info';

    if (parsed.err) {
      logger[levelName](reconstructError(parsed.err));
      return;
    }

    const msg = typeof parsed.msg === 'string' ? parsed.msg : null;
    if (msg == null || msg === '') {
      logger.info(line);
      return;
    }

    logger[levelName](
      { source: parsed.source, color: parsed.color, spin: parsed.spin, succeed: parsed.succeed },
      msg
    );
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
