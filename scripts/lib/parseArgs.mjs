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

import { parseArgs } from 'node:util';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const sharedOptions = {
  'config-directory': { type: 'string', default: path.join(REPO_ROOT, 'app') },
  'log-level': { type: 'string', default: 'info' },
  'skip-build': { type: 'boolean', default: false },
};

function parse(extraOptions = {}) {
  const { values } = parseArgs({
    options: { ...sharedOptions, ...extraOptions },
    strict: false,
  });
  return {
    configDirectory: path.resolve(values['config-directory']),
    logLevel: values['log-level'],
    skipBuild: values['skip-build'],
    values,
  };
}

export { REPO_ROOT };
export default parse;
