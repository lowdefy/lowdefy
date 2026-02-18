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

import ora from 'ora';
import { errorToDisplayString } from '@lowdefy/errors';

const reset = '\x1b[0m';
const colors = {
  red: (text) => `\x1b[31m${text}${reset}`,
  green: (text) => `\x1b[32m${text}${reset}`,
  yellow: (text) => `\x1b[33m${text}${reset}`,
  blue: (text) => `\x1b[34m${text}${reset}`,
  gray: (text) => `\x1b[2m${text}${reset}`,
  white: (text) => text,
};

const defaultColors = {
  error: 'red',
  warn: 'yellow',
  info: 'white',
  debug: 'gray',
};

function getTime() {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}

// Standard pino levels + spin/succeed at info level
const logLevelValues = {
  error: 50,
  warn: 40,
  succeed: 30,
  spin: 30,
  info: 30,
  debug: 20,
};

function filterLevels(obj, level) {
  const levelValue = logLevelValues[level];
  Object.keys(obj).forEach((key) => {
    if (logLevelValues[key] < levelValue) {
      obj[key] = () => {};
    }
  });
  return obj;
}

function colorize(text, color, level) {
  return colors[color ?? defaultColors[level]](text);
}

function createOraPrint({ logLevel }) {
  const spinner = ora({
    spinner: 'random',
    prefixText: () => colors.gray(getTime()),
    color: 'blue',
  });
  return filterLevels(
    {
      error: (text, { color } = {}) => spinner.fail(colorize(text, color, 'error')),
      warn: (text, { color } = {}) => spinner.warn(colorize(text, color, 'warn')),
      info: (text, { color } = {}) =>
        spinner.stopAndPersist({ symbol: '∙', text: colorize(text, color, 'info') }),
      debug: (text, { color } = {}) => {
        if (spinner.isSpinning) {
          spinner.stopAndPersist({ symbol: '∙' });
        }
        spinner.stopAndPersist({
          symbol: colors.gray('+'),
          text: colorize(text, color, 'debug'),
        });
      },
      spin: (text) => spinner.start(text),
      succeed: (text) => spinner.succeed(colors.green(text)),
    },
    logLevel
  );
}

function createBasicPrint({ logLevel = 'info' }) {
  return filterLevels(
    {
      error: (text) => console.error(text),
      warn: (text) => console.warn(text),
      info: (text) => console.log(text),
      debug: (text) => console.debug(text),
      spin: (text) => console.log(text),
      succeed: (text) => console.log(text),
    },
    logLevel
  );
}

// Memoise print so that error handler can get the same spinner object
let print;

function getPrint({ logLevel }) {
  if (!print) {
    const isCI = process.env.CI === 'true' || process.env.CI === '1';
    print = isCI ? createBasicPrint({ logLevel }) : createOraPrint({ logLevel });
  }
  return print;
}

function shouldLogStack(error) {
  return !error.isLowdefyError || error.name === 'LowdefyInternalError';
}

function isErrorLike(input) {
  return (
    input != null &&
    typeof input !== 'string' &&
    input.message !== undefined &&
    (input instanceof Error || input.name !== undefined)
  );
}

function createCliLogger({ logLevel } = {}) {
  const print = getPrint({ logLevel });

  function log(level, first, second) {
    // 1. Error-like first arg
    if (isErrorLike(first)) {
      if (first.source) {
        print.info(first.source, { color: 'blue' });
      }
      print[level](errorToDisplayString(first));
      if (shouldLogStack(first) && first.stack) {
        print[level](first.stack, { color: 'gray' });
      }
      let currentCause = first.cause;
      let depth = 0;
      while (currentCause instanceof Error && depth < 3) {
        print[level](`  Caused by: ${errorToDisplayString(currentCause)}`);
        if (shouldLogStack(currentCause) && currentCause.stack) {
          print[level](currentCause.stack, { color: 'gray' });
        }
        currentCause = currentCause.cause;
        depth++;
      }
      return;
    }

    // 2. Pino two-arg form: (mergeObj, messageString)
    if (typeof second === 'string') {
      if (first?.spin) {
        print.spin(second);
        return;
      }
      if (first?.succeed) {
        print.succeed(second);
        return;
      }
      if (first?.source) {
        print.info(first.source, { color: 'blue' });
      }
      print[level](second, { color: first?.color });
      return;
    }

    // 3. Plain string
    if (typeof first === 'string') {
      print[level](first);
      return;
    }

    // 4. Fallback
    print[level](JSON.stringify(first, null, 2));
  }

  return {
    error: (first, second) => log('error', first, second),
    warn: (first, second) => log('warn', first, second),
    info: (first, second) => log('info', first, second),
    debug: (first, second) => log('debug', first, second),
  };
}

export default createCliLogger;
