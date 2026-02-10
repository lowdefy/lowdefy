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

// Map pino numeric levels to print method names
const pinoLevelToPrint = {
  10: 'debug', // trace
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error', // fatal
};

function createStdOutLineHandler({ context }) {
  const ui = context?.logger?.ui ??
    context?.print ?? {
      log: (text) => console.log(text),
      dim: (text) => console.log(text),
      info: (text) => console.info(text),
      warn: (text) => console.warn(text),
      error: (text) => console.error(text),
      debug: (text) => console.debug(text),
      link: (text) => console.info(text),
      spin: (text) => console.log(text),
      succeed: (text) => console.log(text),
    };

  function stdOutLineHandler(line) {
    try {
      const { print, level, msg, source, err } = JSON.parse(line);
      const printLevel = print ?? pinoLevelToPrint[level] ?? 'info';

      if (msg == null || msg === '' || msg === 'undefined') {
        ui.log(line);
        return;
      }

      const resolvedSource = err?.source ?? source;
      if (resolvedSource && (printLevel === 'error' || printLevel === 'warn')) {
        ui.link(resolvedSource);
      }

      ui[printLevel]?.(msg);
    } catch (error) {
      ui.log(line);
    }
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
