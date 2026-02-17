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

import { errorToDisplayString } from '@lowdefy/errors';

const lowdefyErrorNames = new Set([
  'ConfigError',
  'ConfigWarning',
  'LowdefyError',
  'PluginError',
  'ServiceError',
  'UserError',
]);

function createBrowserLogger() {
  return {
    error: (...args) => {
      if (lowdefyErrorNames.has(args[0]?.name)) {
        if (args[0].source) {
          console.info('%c%s', 'color: #4a9eff', args[0].source);
        }
        console.error(errorToDisplayString(args[0]));
        return;
      }
      console.error(...args);
    },
    warn: (...args) => {
      if (lowdefyErrorNames.has(args[0]?.name)) {
        if (args[0].source) {
          console.info('%c%s', 'color: #4a9eff', args[0].source);
        }
        console.warn(errorToDisplayString(args[0]));
        return;
      }
      console.warn(...args);
    },
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
  };
}

export default createBrowserLogger;
