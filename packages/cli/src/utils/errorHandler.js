/*
  Copyright 2020-2021 Lowdefy, Inc

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

import axios from 'axios';
import createPrint from './print';
import packageJson from '../../package.json';

const { version: cliVersion } = packageJson;

/* TODO:
  - log lowdefy version
  - log command
  - respect disable telemetry
*/
async function logError(error) {
  try {
    await axios.request({
      method: 'post',
      url: 'https://api.lowdefy.net/errors',
      headers: {
        'User-Agent': `Lowdefy CLI v${cliVersion}`,
      },
      data: {
        source: 'cli',
        cliVersion,
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    });
  } catch (error) {
    // pass
  }
}

function errorHandler(fn, options = {}) {
  async function run(...args) {
    try {
      const res = await fn(...args);
      return res;
    } catch (error) {
      const print = createPrint();
      print.error(error.message);
      await logError(error);
      // TODO: Stay alive feature
    }
  }
  return run;
}

export default errorHandler;
