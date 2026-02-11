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
  const time = new Date(Date.now());
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  return `${h > 9 ? '' : '0'}${h}:${m > 9 ? '' : '0'}${m}:${s > 9 ? '' : '0'}${s}`;
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

function filterLevels(logger, level) {
  const levelValue = logLevelValues[level];
  Object.keys(logger).forEach((key) => {
    if (logLevelValues[key] < levelValue) {
      logger[key] = () => {};
    }
  });
  return logger;
}

function createOraPrint({ logLevel }) {
  const spinner = ora({
    spinner: 'random',
    prefixText: () => colors.gray(getTime()),
    color: 'blue',
  });
  return filterLevels(
    {
      error: (text, { color } = {}) => spinner.fail(colors[color ?? defaultColors.error](text)),
      warn: (text, { color } = {}) => spinner.warn(colors[color ?? defaultColors.warn](text)),
      info: (text, { color } = {}) =>
        spinner.stopAndPersist({
          symbol: '∙',
          text: colors[color ?? defaultColors.info](text),
        }),
      debug: (text, { color } = {}) => {
        if (spinner.isSpinning) {
          spinner.stopAndPersist({ symbol: '∙' });
        }
        spinner.stopAndPersist({
          symbol: colors.gray('+'),
          text: colors[color ?? defaultColors.debug](text),
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

function createPrint({ logLevel }) {
  if (print) return print;
  if (process.env.CI === 'true' || process.env.CI === '1') {
    print = createBasicPrint({ logLevel });
    return print;
  }
  print = createOraPrint({ logLevel });
  return print;
}

export { createOraPrint, createBasicPrint };

export default createPrint;
