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

import { serializer } from '@lowdefy/helpers';

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
  const { logger } = context;

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
      logger[levelName](serializer.deserialize({ '~e': parsed.err }));
      return;
    }

    const msg = typeof parsed.msg === 'string' && parsed.msg !== '' ? parsed.msg : null;

    // Strip pino metadata — level/time/name are already handled by the CLI logger
    // Also strip CLI control fields — they are passed via the mergeObj, not displayed as data
    const {
      level,
      time,
      name,
      pid,
      hostname,
      msg: _msg,
      source,
      color,
      spin,
      succeed,
      ...data
    } = parsed;
    const dataEntries = Object.entries(data);

    if (msg == null && dataEntries.length === 0) {
      logger[levelName](line);
      return;
    }

    const dataLines = dataEntries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `  ${key}: ${JSON.stringify(value)}`;
      }
      return `  ${key}: ${value}`;
    });

    // First line gets source/color/spin/succeed, rest are plain indented lines
    if (msg) {
      logger[levelName]({ source, color, spin, succeed }, msg);
    } else if (dataLines.length > 0) {
      logger[levelName]({ source, color, spin, succeed }, dataLines.shift());
    }
    for (const dataLine of dataLines) {
      logger[levelName](dataLine);
    }
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
