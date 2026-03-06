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
  const components = {};
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: {},
  });
});

test('buildLogger empty logger object', () => {
  const components = { logger: {} };
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: {},
  });
});

test('buildLogger logger null', () => {
  const components = { logger: null };
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: {},
  });
});

test('buildLogger sentry with defaults', () => {
  const components = { logger: { sentry: {} } };
  const result = buildLogger({ components });
  expect(result).toEqual({
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
  const components = { logger: { sentry: { tracesSampleRate: 0.5 } } };
  const result = buildLogger({ components });
  expect(result).toEqual({
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
  const components = { logger: { sentry: { client: false } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.client).toBe(false);
  expect(result.logger.sentry.server).toBe(true);
});

test('buildLogger sentry server disabled', () => {
  const components = { logger: { sentry: { server: false } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.server).toBe(false);
  expect(result.logger.sentry.client).toBe(true);
});

test('buildLogger sentry custom userFields', () => {
  const components = { logger: { sentry: { userFields: ['id', 'email', 'roles'] } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.userFields).toEqual(['id', 'email', 'roles']);
});

test('buildLogger sentry feedback enabled', () => {
  const components = { logger: { sentry: { feedback: true } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.feedback).toBe(true);
});

test('buildLogger sentry custom environment', () => {
  const components = { logger: { sentry: { environment: 'staging' } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.environment).toBe('staging');
});

test('buildLogger sentry all custom values', () => {
  const components = {
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
  const components = { pages: [], menus: [] };
  const result = buildLogger({ components });
  expect(result.pages).toEqual([]);
  expect(result.menus).toEqual([]);
  expect(result.logger).toEqual({});
});

test('buildLogger sentry null does not apply defaults', () => {
  const components = { logger: { sentry: null } };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toBe(null);
});

test('buildLogger sentry undefined does not apply defaults', () => {
  const components = { logger: { sentry: undefined } };
  const result = buildLogger({ components });
  expect(result.logger.sentry).toBeUndefined();
});

test('buildLogger mutates original components object', () => {
  const components = { logger: { sentry: {} } };
  const result = buildLogger({ components });
  expect(result).toBe(components);
  expect(result.logger.sentry.client).toBe(true);
});

test('buildLogger preserves zero values for sample rates', () => {
  const components = {
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
  const components = { logger: { sentry: { userFields: [] } } };
  const result = buildLogger({ components });
  expect(result.logger.sentry.userFields).toEqual([]);
});

test('buildLogger preserves false boolean values', () => {
  const components = {
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
