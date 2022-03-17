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
import chalk from 'chalk';

function getTime() {
  const time = new Date(Date.now());
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  return `${h > 9 ? '' : '0'}${h}:${m > 9 ? '' : '0'}${m}:${s > 9 ? '' : '0'}${s}`;
}

function createOraPrint() {
  const spinner = ora({
    spinner: 'random',
    prefixText: () => chalk.dim(getTime()),
    color: 'blue',
  });
  return {
    type: 'ora',
    error: (text) => spinner.fail(chalk.red(text)),
    info: (text) => spinner.info(chalk.blue(text)),
    log: (text) => spinner.start(text).stopAndPersist({ symbol: '∙' }),
    spin: (text) => spinner.start(text),
    succeed: (text) => spinner.succeed(chalk.green(text)),
    warn: (text) => spinner.warn(chalk.yellow(text)),
  };
}

function createBasicPrint() {
  const { error, info, log, warn } = console;
  return {
    type: 'basic',
    error,
    info,
    log,
    spin: log,
    succeed: log,
    warn,
  };
}

// Memoise print so that error handler can get the same spinner object
let print;

function createPrint() {
  // TODO: Add debug
  if (print) return print;
  if (process.env.CI === 'true') {
    print = createBasicPrint();
    return print;
  }
  print = createOraPrint();
  return print;
}

export { createOraPrint, createBasicPrint };

export default createPrint;
