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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import getEnvironmentNames from '../utils/getEnvironmentNames.js';

// Environment names become a path segment (/api/cron-forward/<environment>/<endpointId>).
const environmentNamePattern = /^[A-Za-z0-9\-_]+$/;

// Features an environment can switch off with `<feature>.enabled: false`. Logging has no switch.
const switchableFeatures = ['cron', 'email', 'posthog', 'sentry'];

function isAbsoluteHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateEmailFilter({ name, filter, configKey }) {
  const where = `config.environments.${name}.email.filter`;
  if (!type.isObject(filter)) {
    throw new ConfigError(`App "${where}" should be an object.`, { received: filter, configKey });
  }
  const { replaceAddress, allowlist, regex } = filter;
  if (!type.isNone(replaceAddress) && (!type.isString(replaceAddress) || replaceAddress === '')) {
    throw new ConfigError(`App "${where}.replaceAddress" should be a non-empty string.`, {
      received: replaceAddress,
      configKey,
    });
  }
  if (
    !type.isNone(allowlist) &&
    (!type.isArray(allowlist) || !allowlist.every((domain) => type.isString(domain)))
  ) {
    throw new ConfigError(`App "${where}.allowlist" should be an array of strings.`, {
      received: allowlist,
      configKey,
    });
  }
  if (!type.isNone(regex) && !type.isString(regex)) {
    throw new ConfigError(`App "${where}.regex" should be a string.`, {
      received: regex,
      configKey,
    });
  }
}

function validateEnvironment({ name, environment, configKey }) {
  if (name === 'default') {
    throw new ConfigError(
      'Environment name "default" is reserved: it names the value every other environment inherits.',
      { configKey }
    );
  }
  if (!environmentNamePattern.test(name)) {
    throw new ConfigError(
      `Environment name "${name}" is invalid. Environment names must only contain A-Z, a-z, 0-9, "-" and "_".`,
      { configKey }
    );
  }
  if (!type.isObject(environment)) {
    throw new ConfigError(`App "config.environments.${name}" should be an object.`, {
      received: environment,
      configKey,
    });
  }
  const key = environment['~k'] ?? configKey;
  const { url, cron, email, posthog, sentry } = environment;
  if (!type.isUndefined(url) && (!type.isString(url) || !isAbsoluteHttpUrl(url))) {
    throw new ConfigError(
      `App "config.environments.${name}.url" should be an absolute http(s) URL, e.g. "https://staging.example.com".`,
      { received: url, configKey: key }
    );
  }
  if (!type.isUndefined(cron)) {
    if (!type.isObject(cron)) {
      throw new ConfigError(`App "config.environments.${name}.cron" should be an object.`, {
        received: cron,
        configKey: key,
      });
    }
    if (!type.isUndefined(cron.secret)) {
      if (!type.isString(cron.secret) || cron.secret === '') {
        throw new ConfigError(
          `App "config.environments.${name}.cron.secret" should be the name of the Lowdefy secret holding the environment's CRON_SECRET.`,
          { received: cron.secret, configKey: cron['~k'] ?? key }
        );
      }
      if (type.isUndefined(url)) {
        throw new ConfigError(
          `Environment "${name}" has a cron.secret but no url. Crons are forwarded to an environment's url, so set the environment's deployment origin.`,
          { configKey: key }
        );
      }
    }
  }
  [
    ['posthog', posthog],
    ['sentry', sentry],
  ].forEach(([feature, value]) => {
    if (!type.isUndefined(value) && !type.isObject(value)) {
      throw new ConfigError(`App "config.environments.${name}.${feature}" should be an object.`, {
        received: value,
        configKey: key,
      });
    }
  });
  switchableFeatures.forEach((feature) => {
    const enabled = environment[feature]?.enabled;
    if (!type.isUndefined(enabled) && !type.isBoolean(enabled)) {
      throw new ConfigError(
        `App "config.environments.${name}.${feature}.enabled" should be a boolean.`,
        { received: enabled, configKey: environment[feature]['~k'] ?? key }
      );
    }
  });
  if (!type.isUndefined(email)) {
    if (!type.isObject(email)) {
      throw new ConfigError(`App "config.environments.${name}.email" should be an object.`, {
        received: email,
        configKey: key,
      });
    }
    if (!type.isUndefined(email.filter)) {
      validateEmailFilter({ name, filter: email.filter, configKey: email['~k'] ?? key });
    }
  }
}

function getCurrentEnvironmentName({ config }) {
  if (!type.isNone(config.environment)) {
    if (!type.isString(config.environment) || config.environment === '') {
      throw new ConfigError('App "config.environment" should be a non-empty string.', {
        received: config.environment,
        configKey: config['~k'],
      });
    }
    return config.environment;
  }
  const fromEnv = process.env.LOWDEFY_ENVIRONMENT?.trim();
  return fromEnv === '' ? undefined : fromEnv;
}

// Resolves the deployment environments once for the whole build. After this step:
//   - config.environments holds every declared environment ({ url, cron, email }), validated;
//   - config.environment names the environment this build is for (config.environment, else the
//     LOWDEFY_ENVIRONMENT variable), and must be declared when environments are.
// Everything environment-specific (cron registration and forwarding, notification links, the auth
// base URL, the email delivery filter, the Sentry environment) reads the current environment from
// there instead of from its own environment variable.
function buildEnvironments({ components, context }) {
  const config = components.config;
  const configKey = config['~k'];
  const current = getCurrentEnvironmentName({ config });

  // config.cron.environments (6.0) is replaced by config.environments. Fail with the migration
  // rather than run two shapes side by side.
  if (!type.isUndefined(config.cron)) {
    throw new ConfigError(
      'App "config.cron" is replaced by "config.environments". Declare the deployment environments under "config.environments": give every environment its "url", move each "secret" to "cron.secret" and "enabled" to "cron.enabled", and set LOWDEFY_ENVIRONMENT on each deployment.',
      { configKey: config.cron?.['~k'] ?? configKey }
    );
  }

  const environments = config.environments;
  if (!type.isUndefined(environments)) {
    if (!type.isObject(environments)) {
      throw new ConfigError('App "config.environments" should be an object.', {
        received: environments,
        configKey,
      });
    }
    const envKey = environments['~k'] ?? configKey;
    const names = getEnvironmentNames(environments);
    if (names.length === 0) {
      throw new ConfigError('App "config.environments" declares no environments.', {
        configKey: envKey,
      });
    }
    names.forEach((name) =>
      validateEnvironment({ name, environment: environments[name], configKey: envKey })
    );
    if (!type.isUndefined(current) && !names.includes(current)) {
      throw new ConfigError(
        `The current environment "${current}" (LOWDEFY_ENVIRONMENT) is not declared in "config.environments". Declared environments: ${names.join(
          ', '
        )}.`,
        { configKey: envKey }
      );
    }
    if (type.isUndefined(current) && context.stage === 'prod') {
      context.handleWarning(
        new ConfigWarning(
          'App "config.environments" is declared but no current environment is set. Set LOWDEFY_ENVIRONMENT to the environment this deployment is: until then no environment setting (url, cron, email filter) applies and only the "default" schedules are registered.',
          { configKey: envKey }
        )
      );
    }
  }

  if (type.isUndefined(current)) {
    delete config.environment;
    return;
  }
  config.environment = current;
  const settings = config.environments?.[current] ?? {};
  const disabled = switchableFeatures.filter((feature) => settings[feature]?.enabled === false);

  // App metadata is the deploy identity the server stamps on every log line and the client reads
  // with _app, so the environment and the features it switches off travel with it — the browser
  // has no other view of config.environments.
  if (type.isObject(components.appMeta)) {
    components.appMeta.environment = current;
    components.appMeta.disabled = disabled;
  }

  // Sentry reports under the environment name unless the app names one itself, and is off on both
  // sides when the environment switches it off. logger.sentry is created when absent: Sentry is
  // enabled by SENTRY_DSN, not by the config being present.
  components.logger = components.logger ?? {};
  const sentry = { ...(components.logger.sentry ?? {}) };
  if (type.isNone(sentry.environment)) {
    sentry.environment = current;
  }
  if (disabled.includes('sentry')) {
    sentry.client = false;
    sentry.server = false;
  }
  components.logger.sentry = sentry;
}

export default buildEnvironments;
