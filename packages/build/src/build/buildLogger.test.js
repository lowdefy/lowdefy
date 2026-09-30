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

import buildLogger from './buildLogger.js';

test('buildLogger no logger defined', () => {
  const components = { config: {} };
  const result = buildLogger({ components });
  expect(result).toEqual({ config: {}, logger: {} });
});

test('buildLogger empty logger object', () => {
  const components = { config: {}, logger: {} };
  const result = buildLogger({ components });
  expect(result).toEqual({ config: {}, logger: {} });
});

test('buildLogger logger null', () => {
  const components = { config: {}, logger: null };
  const result = buildLogger({ components });
  expect(result).toEqual({ config: {}, logger: {} });
});

test('buildLogger sentry with defaults', () => {
  const components = { config: {}, logger: { sentry: {} } };
  const result = buildLogger({ components });
  expect(result).toEqual({
    config: {},
    logger: {
      sentry: {
        client: true,
        server: true,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.1,
        feedback: false,
        userFields: ['id', '_id'],
      },
    },
  });
});

test('buildLogger sentry with custom tracesSampleRate', () => {
  const components = { config: {}, logger: { sentry: { tracesSampleRate: 0.5 } } };
  const result = buildLogger({ components });
  expect(result).toEqual({
    config: {},
    logger: {
      sentry: {
        client: true,
        server: true,
        tracesSampleRate: 0.5,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.1,
        feedback: false,
        userFields: ['id', '_id'],
      },
    },
  });
});

test('buildLogger sentry client disabled', () => {
  const components = { config: {}, logger: { sentry: { client: false } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.client).toBe(false);
  expect(result.logger.sentry.server).toBe(true);
});

test('buildLogger sentry server disabled', () => {
  const components = { config: {}, logger: { sentry: { server: false } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.server).toBe(false);
  expect(result.logger.sentry.client).toBe(true);
});

test('buildLogger sentry custom userFields', () => {
  const components = { config: {}, logger: { sentry: { userFields: ['id', 'email', 'roles'] } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.userFields).toEqual(['id', 'email', 'roles']);
});

test('buildLogger sentry feedback enabled', () => {
  const components = { config: {}, logger: { sentry: { feedback: true } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.feedback).toBe(true);
});

test('buildLogger sentry custom environment', () => {
  const components = { config: {}, logger: { sentry: { environment: 'staging' } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.environment).toBe('staging');
});

test('buildLogger sentry all custom values', () => {
  const components = {
    config: {},
    logger: {
      sentry: {
        client: false,
        server: true,
        tracesSampleRate: 0.25,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 0.5,
        feedback: true,
        environment: 'production',
        userFields: ['id', 'organization'],
      },
    },
  };
  const result = buildLogger({ components });
  expect(result).toEqual({
    config: {},
    logger: {
      sentry: {
        client: false,
        server: true,
        tracesSampleRate: 0.25,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 0.5,
        feedback: true,
        environment: 'production',
        userFields: ['id', 'organization'],
      },
    },
  });
});

test('buildLogger returns components object', () => {
  const components = { config: {}, pages: [], menus: [] };
  const result = buildLogger({ components });
  expect(result.pages).toEqual([]);
  expect(result.menus).toEqual([]);
  expect(result.logger).toEqual({});
});

test('buildLogger sentry null does not apply defaults', () => {
  const components = { config: {}, logger: { sentry: null } };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toBe(null);
});

test('buildLogger sentry undefined does not apply defaults', () => {
  const components = { config: {}, logger: { sentry: undefined } };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toBeUndefined();
});

test('buildLogger mutates original components object', () => {
  const components = { config: {}, logger: { sentry: {} } };
  const result = buildLogger({ components });
  expect(result).toBe(components);
  expect(result.logger.sentry.client).toBe(true);
});

test('buildLogger preserves zero values for sample rates', () => {
  const components = {
    config: {},
    logger: {
      sentry: {
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      },
    },
  };
  const result = buildLogger({ components });
  expect(result.logger.sentry.tracesSampleRate).toBe(0);
  expect(result.logger.sentry.replaysSessionSampleRate).toBe(0);
  expect(result.logger.sentry.replaysOnErrorSampleRate).toBe(0);
});

test('buildLogger preserves empty userFields array', () => {
  const components = { config: {}, logger: { sentry: { userFields: [] } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.userFields).toEqual([]);
});

test('buildLogger preserves false boolean values', () => {
  const components = {
    config: {},
    logger: {
      sentry: {
        client: false,
        server: false,
        feedback: false,
      },
    },
  };
  const result = buildLogger({ components });
  expect(result.logger.sentry.client).toBe(false);
  expect(result.logger.sentry.server).toBe(false);
  expect(result.logger.sentry.feedback).toBe(false);
});

test('buildLogger creates the Sentry config with the current environment name', () => {
  const components = { config: { environment: 'staging', environments: { staging: {} } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toEqual({
    client: true,
    server: true,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    feedback: false,
    userFields: ['id', '_id'],
    environment: 'staging',
  });
});

test('buildLogger keeps an authored Sentry environment over the current environment', () => {
  const components = {
    config: { environment: 'staging', environments: { staging: {} } },
    logger: { sentry: { environment: 'qa' } },
  };
  const result = buildLogger({ components });
  expect(result.logger.sentry.environment).toBe('qa');
});

test('buildLogger turns Sentry off on both sides when the current environment switches it off', () => {
  const components = {
    config: { environment: 'staging', environments: { staging: { sentry: { enabled: false } } } },
    logger: { sentry: { tracesSampleRate: 0.5 } },
  };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toMatchObject({
    client: false,
    server: false,
    tracesSampleRate: 0.5,
    environment: 'staging',
  });
});
