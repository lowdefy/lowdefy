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

// The environment a cron run resolves its schedules for. A forwarded request names it in the
// x-lowdefy-cron-environment header; a request without one is the deployment running its own crons,
// which is the environment declared without a url (the one Vercel fires crons on). Without
// config.cron there are no environments and the endpoint's plain schedules apply.
function resolveCronEnvironment({ config, environment }) {
  const environments = config?.cron?.environments;
  if (type.isNone(environments)) {
    if (!type.isNone(environment)) {
      throw new ConfigError(
        `Cron environment "${environment}" is not configured: lowdefy.config.cron.environments is not defined.`
      );
    }
    return undefined;
  }
  if (!type.isNone(environment)) {
    if (!type.isObject(environments[environment])) {
      throw new ConfigError(
        `Cron environment "${environment}" is not declared in lowdefy.config.cron.environments.`
      );
    }
    return environment;
  }
  return Object.keys(environments).find(
    (name) => type.isObject(environments[name]) && type.isUndefined(environments[name].url)
  );
}

export default resolveCronEnvironment;
