/*
  Copyright 2020-2022 Lowdefy, Inc

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

// TODO: Maybe we could look at 256 bit colors
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

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
    prefixText: () => `${dim}${getTime()}${reset}`,
    color: 'blue',
  });
  return filterLevels(
    {
      error: (text) => spinner.fail(`${red}${text}${reset}`),
      info: (text) => spinner.info(`${blue}${text}${reset}`),
      log: (text) => spinner.stopAndPersist({ symbol: '∙', text }),
      spin: (text) => spinner.start(text),
      succeed: (text) => spinner.succeed(`${green}${text}${reset}`),
      warn: (text) => spinner.warn(`${yellow}${text}${reset}`),
      debug: (text) => {
        if (spinner.isSpinning) {
          spinner.stopAndPersist({ symbol: '∙', text });
        }
        spinner.stopAndPersist({ symbol: `${dim}+${reset}`, text: `${dim}${text}${reset}` });
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
