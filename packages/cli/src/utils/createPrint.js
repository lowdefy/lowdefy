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

import ora from 'ora';

const reset = '\x1b[0m';
const red = (text) => `\x1b[31m${text}${reset}`;
const green = (text) => `\x1b[32m${text}${reset}`;
const yellow = (text) => `\x1b[33m${text}${reset}`;
const blue = (text) => `\x1b[34m${text}${reset}`;
const dim = (text) => `\x1b[2m${text}${reset}`;

function getTime() {
  const time = new Date(Date.now());
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  return `${h > 9 ? '' : '0'}${h}:${m > 9 ? '' : '0'}${m}:${s > 9 ? '' : '0'}${s}`;
}

// Same levels as pino with added custom levels
const logLevelValues = {
  error: 50,
  warn: 40,
  succeed: 33,
  spin: 32,
  log: 31,
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
    prefixText: () => dim(getTime()),
    color: 'blue',
  });
  return filterLevels(
    {
      error: (text) => spinner.fail(red(text)),
      info: (text) => spinner.info(blue(text)),
      log: (text) => spinner.stopAndPersist({ symbol: '∙', text }),
      spin: (text) => spinner.start(text),
      succeed: (text) => spinner.succeed(green(text)),
      warn: (text) => spinner.warn(yellow(text)),
      debug: (text) => {
        if (spinner.isSpinning) {
          spinner.stopAndPersist({ symbol: '∙' });
        }
        spinner.stopAndPersist({ symbol: dim('+'), text: dim(text) });
      },
    },
    logLevel
  );
}

function createBasicPrint({ logLevel = 'info' }) {
  const { error, info, log, warn, debug } = console;
  return filterLevels(
    {
      error,
      info,
      log,
      spin: log,
      succeed: log,
      warn,
      debug,
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
