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

import getCronEnvironmentNames from '../utils/getCronEnvironmentNames.js';

// Environment names become a path segment (/api/cron-forward/<environment>/<endpointId>).
const environmentNamePattern = /^[A-Za-z0-9\-_]+$/;

function isAbsoluteHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns true when the environment is forwarded to (has a url), false for the host environment.
function validateCronEnvironment({ name, environment, configKey }) {
  if (name === 'default') {
    throw new ConfigError(
      'Cron environment name "default" is reserved: it names the schedules every environment inherits.',
      { configKey }
    );
  }
  if (!environmentNamePattern.test(name)) {
    throw new ConfigError(
      `Cron environment name "${name}" is invalid. Environment names must only contain A-Z, a-z, 0-9, "-" and "_".`,
      { configKey }
    );
  }
  if (!type.isObject(environment)) {
    throw new ConfigError(`Cron environment "${name}" is not an object.`, {
      received: environment,
      configKey,
    });
  }
  if (!type.isUndefined(environment.enabled) && !type.isBoolean(environment.enabled)) {
    throw new ConfigError(`Cron environment "${name}" enabled is not a boolean.`, {
      received: environment.enabled,
      configKey: environment['~k'] ?? configKey,
    });
  }
  if (type.isUndefined(environment.url)) {
    if (!type.isUndefined(environment.secret)) {
      throw new ConfigError(
        `Cron environment "${name}" has a secret but no url. The environment without a url is the deployment that runs the crons and needs no secret.`,
        { configKey: environment['~k'] ?? configKey }
      );
    }
    return false;
  }
  if (!type.isString(environment.url) || !isAbsoluteHttpUrl(environment.url)) {
    throw new ConfigError(
      `Cron environment "${name}" url is not an absolute http(s) URL, e.g. "https://staging.example.com".`,
      { received: environment.url, configKey: environment['~k'] ?? configKey }
    );
  }
  if (!type.isString(environment.secret) || environment.secret === '') {
    throw new ConfigError(
      `Cron environment "${name}" has a url but no secret. Set secret to the Lowdefy secret name that holds the environment's CRON_SECRET.`,
      { received: environment.secret, configKey: environment['~k'] ?? configKey }
    );
  }
  return true;
}

// Validates config.cron: the deployment environments scheduled endpoints run in. Exactly one
// environment has no url — the deployment whose crons Vercel fires — and every other environment
// is forwarded to from there, so it needs a url and the secret that authorizes the forwarded call.
function validateCronConfig({ components }) {
  const cron = components.config.cron;
  if (type.isUndefined(cron)) return;
  const configKey = cron['~k'] ?? components.config['~k'];
  if (!type.isObject(cron)) {
    throw new ConfigError('lowdefy.config.cron is not an object.', { received: cron, configKey });
  }
  if (!type.isObject(cron.environments)) {
    throw new ConfigError('lowdefy.config.cron.environments is not an object.', {
      received: cron.environments,
      configKey,
    });
  }
  const names = getCronEnvironmentNames(cron.environments);
  if (names.length === 0) {
    throw new ConfigError('lowdefy.config.cron.environments declares no environments.', {
      configKey,
    });
  }
  const hosts = names.filter(
    (name) => !validateCronEnvironment({ name, environment: cron.environments[name], configKey })
  );
  if (hosts.length !== 1) {
    throw new ConfigError(
      `Exactly one environment in lowdefy.config.cron.environments must have no url (the deployment that runs the crons). Received ${JSON.stringify(
        hosts
      )}.`,
      { configKey }
    );
  }
}

export default validateCronConfig;
