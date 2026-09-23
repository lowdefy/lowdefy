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
import validateCronConfig from './validateCronConfig.js';

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
  const { url, cron, email } = environment;
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
    if (!type.isUndefined(cron.enabled) && !type.isBoolean(cron.enabled)) {
      throw new ConfigError(`App "config.environments.${name}.cron.enabled" should be a boolean.`, {
        received: cron.enabled,
        configKey: cron['~k'] ?? key,
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

// The 6.0 config.cron.environments shape: { url, secret, enabled } per environment, where the one
// environment without a url is the deployment Vercel fires crons on. Mapped onto the
// config.environments shape so the rest of the build and the runtime read one shape.
function fromCronEnvironments(cronEnvironments) {
  const environments = {};
  getEnvironmentNames(cronEnvironments).forEach((name) => {
    const { url, secret, enabled } = cronEnvironments[name];
    const environment = {};
    if (!type.isUndefined(cronEnvironments[name]['~k'])) {
      environment['~k'] = cronEnvironments[name]['~k'];
    }
    if (!type.isUndefined(url)) environment.url = url;
    const cron = {};
    if (!type.isUndefined(secret)) cron.secret = secret;
    if (!type.isUndefined(enabled)) cron.enabled = enabled;
    if (Object.keys(cron).length > 0) environment.cron = cron;
    environments[name] = environment;
  });
  return environments;
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
//   - config.environments holds every declared environment in one shape ({ url, cron, email }),
//     whether it was authored as config.environments or as the legacy config.cron.environments;
//   - config.environment names the environment this build is for (config.environment, else the
//     LOWDEFY_ENVIRONMENT variable), and must be declared when environments are;
//   - config.cron is gone.
// Everything environment-specific (cron registration and forwarding, notification links, the auth
// base URL, the email delivery filter, the Sentry environment) reads the current environment from
// there instead of from its own environment variable.
function buildEnvironments({ components, context }) {
  const config = components.config;
  const configKey = config['~k'];
  let current = getCurrentEnvironmentName({ config });

  const legacy = config.cron;
  if (!type.isUndefined(legacy)) {
    if (!type.isUndefined(config.environments)) {
      throw new ConfigError(
        'App "config.cron.environments" and "config.environments" cannot both be set. Move the environments to "config.environments".',
        { configKey: legacy?.['~k'] ?? configKey }
      );
    }
    validateCronConfig({ components });
    config.environments = fromCronEnvironments(legacy.environments);
    context.handleWarning(
      new ConfigWarning(
        'App "config.cron.environments" is deprecated. Declare the environments under "config.environments" instead: move each "secret" to "cron.secret" and "enabled" to "cron.enabled", give every environment its "url", and set LOWDEFY_ENVIRONMENT on each deployment.',
        { configKey: legacy['~k'] ?? configKey }
      )
    );
    // The 6.0 shape fixed the environment Vercel fires crons on as the one without a url, whatever
    // deployment ran the build — keep that when no current environment is set.
    if (type.isUndefined(current)) {
      current = getEnvironmentNames(config.environments).find((name) =>
        type.isUndefined(config.environments[name].url)
      );
    }
    delete config.cron;
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
  } else {
    config.environment = current;
  }

  // Sentry reports under the environment name unless the app names one itself. logger.sentry is
  // created when absent: Sentry is enabled by SENTRY_DSN, not by the config being present.
  if (!type.isUndefined(current)) {
    components.logger = components.logger ?? {};
    const sentry = components.logger.sentry ?? {};
    if (type.isNone(sentry.environment)) {
      components.logger.sentry = { ...sentry, environment: current };
    }
  }
}

export default buildEnvironments;
