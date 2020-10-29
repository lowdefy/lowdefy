/*
  Copyright 2020 Lowdefy, Inc

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

import chalk from 'chalk';

const printToTerminal = (color, options = {}) => (text) => {
  let message;
  if (options.timestamp) {
    const time = options.timestamp === true ? new Date(Date.now()) : new Date(options.timestamp);
    const h = time.getHours();
    const m = time.getMinutes();
    const s = time.getSeconds();
    const timeString = `${h > 9 ? '' : '0'}${h}:${m > 9 ? '' : '0'}${m}:${s > 9 ? '' : '0'}${s}`;
    message = `${chalk.dim(timeString)} - ${color(text)}`;
  } else {
    message = color(text);
  }
  // eslint-disable-next-line no-console
  console.log(message);
};

const createPrint = (options) => ({
  info: printToTerminal(chalk.blue, options),
  log: printToTerminal(chalk.green, options),
  warn: printToTerminal(chalk.yellow, options),
  error: printToTerminal(chalk.red, options),
});

export default createPrint;
