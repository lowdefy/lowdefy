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

// Map pino numeric levels to level names
const pinoLevelToName = {
  10: 'debug', // trace
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error', // fatal
};

function createStdOutLineHandler({ context }) {
  const logger = context?.logger ?? {
    error: (text) => console.error(text),
    warn: (text) => console.warn(text),
    info: (text) => console.info(text),
    debug: (text) => console.debug(text),
  };

  // Ensure color sub-methods exist for fallback logger
  if (!logger.info.blue) {
    logger.info.blue = logger.info;
  }

  function stdOutLineHandler(line) {
    try {
      const parsed = JSON.parse(line);
      const { level, color, spin, succeed, source, err } = parsed;
      const msg = typeof parsed.msg === 'string' ? parsed.msg : JSON.stringify(parsed.msg);
      const levelName = pinoLevelToName[level] ?? 'info';

      if (msg == null || msg === '' || msg === 'undefined') {
        logger.info(line);
        return;
      }

      const resolvedSource = err?.source ?? source;
      if (resolvedSource && (levelName === 'error' || levelName === 'warn')) {
        logger.info.blue(resolvedSource);
      }

      if (spin) {
        logger.info(msg, { spin: true });
        return;
      }
      if (succeed) {
        logger.info(msg, { succeed: true });
        return;
      }

      if (color) {
        logger[levelName](msg, { color });
      } else {
        logger[levelName](msg);
      }
    } catch (error) {
      logger.info(line);
    }
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
