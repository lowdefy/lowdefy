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

import { jest } from '@jest/globals';

import buildEnvironments from './buildEnvironments.js';
import testContext from '../test-utils/testContext.js';

const originalEnvironment = process.env.LOWDEFY_ENVIRONMENT;

function makeContext({ stage = 'test' } = {}) {
  const warn = jest.fn();
  const context = testContext({ logger: { warn } });
  context.stage = stage;
  return { context, warn };
}

beforeEach(() => {
  delete process.env.LOWDEFY_ENVIRONMENT;
});

afterAll(() => {
  if (originalEnvironment === undefined) {
    delete process.env.LOWDEFY_ENVIRONMENT;
  } else {
    process.env.LOWDEFY_ENVIRONMENT = originalEnvironment;
  }
});

const environments = {
  prod: { url: 'https://app.example.com' },
  staging: {
    url: 'https://staging.example.com',
    cron: { secret: 'STAGING_CRON_SECRET' },
    email: { filter: { replaceAddress: 'team@example.com' } },
  },
};

test('buildEnvironments sets config.environment from LOWDEFY_ENVIRONMENT', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'staging';
  const { context } = makeContext();
  const components = { config: { environments } };
  buildEnvironments({ components, context });
  expect(components.config.environment).toEqual('staging');
  expect(components.config.environments).toEqual(environments);
});

test('buildEnvironments prefers an authored config.environment over LOWDEFY_ENVIRONMENT', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'staging';
  const { context } = makeContext();
  const components = { config: { environment: 'prod', environments } };
  buildEnvironments({ components, context });
  expect(components.config.environment).toEqual('prod');
});

test('buildEnvironments throws when the current environment is not declared', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'preview';
  const { context } = makeContext();
  const components = { config: { environments } };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'The current environment "preview" (LOWDEFY_ENVIRONMENT) is not declared in "config.environments". Declared environments: prod, staging.'
  );
});

test('buildEnvironments names the environment without declared environments', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'prod';
  const { context } = makeContext();
  const components = { config: {} };
  buildEnvironments({ components, context });
  expect(components.config).toEqual({ environment: 'prod' });
});

test('buildEnvironments leaves config.environment unset without LOWDEFY_ENVIRONMENT', () => {
  const { context, warn } = makeContext();
  const components = { config: { environments } };
  buildEnvironments({ components, context });
  expect(components.config.environment).toBeUndefined();
  expect(warn).not.toHaveBeenCalled();
});

test('buildEnvironments warns in a prod build when environments are declared but none is current', () => {
  const { context, warn } = makeContext({ stage: 'prod' });
  const components = { config: { environments } };
  buildEnvironments({ components, context });
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toMatch('no current environment is set');
});

test('buildEnvironments throws when a cron.secret environment has no url', () => {
  const { context } = makeContext();
  const components = {
    config: { environments: { prod: {}, staging: { cron: { secret: 'STAGING_CRON_SECRET' } } } },
  };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'Environment "staging" has a cron.secret but no url.'
  );
});

test('buildEnvironments throws for an environment url that is not an absolute http url', () => {
  const { context } = makeContext();
  const components = { config: { environments: { prod: { url: 'app.example.com' } } } };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'App "config.environments.prod.url" should be an absolute http(s) URL'
  );
});

test('buildEnvironments throws for an environment named default', () => {
  const { context } = makeContext();
  const components = { config: { environments: { default: {} } } };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'Environment name "default" is reserved'
  );
});

test('buildEnvironments throws when an email filter allowlist is not an array of strings', () => {
  const { context } = makeContext();
  const components = {
    config: { environments: { prod: { email: { filter: { allowlist: 'example.com' } } } } },
  };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'App "config.environments.prod.email.filter.allowlist" should be an array of strings.'
  );
});

test('buildEnvironments fails the build on the replaced config.cron', () => {
  const { context } = makeContext();
  const components = {
    config: { cron: { environments: { production: {}, staging: { url: 'https://s.co' } } } },
  };
  expect(() => buildEnvironments({ components, context })).toThrow(
    'App "config.cron" is replaced by "config.environments".'
  );
});

test('buildEnvironments records the current environment in the app metadata', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'staging';
  const { context } = makeContext();
  const components = { config: { environments }, appMeta: { name: 'app' } };
  buildEnvironments({ components, context });
  expect(components.appMeta).toEqual({ name: 'app', environment: 'staging' });
});

test('buildEnvironments defaults the Sentry environment to the current environment', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'staging';
  const { context } = makeContext();
  const components = { config: { environments }, logger: { sentry: { tracesSampleRate: 0.5 } } };
  buildEnvironments({ components, context });
  expect(components.logger.sentry).toEqual({ tracesSampleRate: 0.5, environment: 'staging' });
});

test('buildEnvironments keeps an authored Sentry environment', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'staging';
  const { context } = makeContext();
  const components = { config: { environments }, logger: { sentry: { environment: 'qa' } } };
  buildEnvironments({ components, context });
  expect(components.logger.sentry).toEqual({ environment: 'qa' });
});

test('buildEnvironments sets the Sentry environment when only SENTRY_DSN enables Sentry', () => {
  process.env.LOWDEFY_ENVIRONMENT = 'prod';
  const { context } = makeContext();
  const components = { config: { environments }, logger: {} };
  buildEnvironments({ components, context });
  expect(components.logger.sentry).toEqual({ environment: 'prod' });
});
