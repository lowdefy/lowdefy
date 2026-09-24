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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectEnvironmentGuards from '../utils/collectEnvironmentGuards.js';

// Checks the current environment's guards against the build's environment variables. Values are
// never echoed: a failure names the variable, not what it holds.
function checkEnvironmentGuards({ name, guards, configKey }) {
  const failures = collectEnvironmentGuards({ guards }).filter(({ variable, pattern }) => {
    const value = process.env[variable];
    return !type.isString(value) || !new RegExp(pattern).test(value);
  });
  if (failures.length === 0) return;
  throw new ConfigError(
    `Environment "${name}" guards failed: ${failures
      .map(({ label, variable }) =>
        type.isString(process.env[variable])
          ? `${label} does not match its guard`
          : `${label} is not set (${variable})`
      )
      .join(
        '; '
      )}. Update the guard in config.environments.${name}.guards together with the value, or fix the value.`,
    { configKey }
  );
}

export default checkEnvironmentGuards;
