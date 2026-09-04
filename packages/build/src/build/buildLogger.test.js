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

const eventsDefaults = { level: 'errors', identity: false };
const journeysDefaults = { enabled: true, sample_rate: 0.05 };

test('buildLogger no logger defined', () => {
  const components = {};
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: { events: eventsDefaults, journeys: journeysDefaults },
  });
});

test('buildLogger empty logger object', () => {
  const components = { logger: {} };
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: { events: eventsDefaults, journeys: journeysDefaults },
  });
});

test('buildLogger logger null', () => {
  const components = { logger: null };
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: { events: eventsDefaults, journeys: journeysDefaults },
  });
});

test('buildLogger events string form becomes the level', () => {
  const components = { logger: { events: 'all' } };
  const result = buildLogger({ components });
  expect(result.logger.events).toEqual({ level: 'all', identity: false });
});

test('buildLogger events object form keeps sample_rate and identity', () => {
  const components = { logger: { events: { sample_rate: 0.05, identity: true } } };
  const result = buildLogger({ components });
  expect(result.logger.events).toEqual({
    level: 'errors',
    sample_rate: 0.05,
    identity: true,
  });
});

test('buildLogger events preserves a zero sample_rate', () => {
  const components = { logger: { events: { sample_rate: 0 } } };
  const result = buildLogger({ components });
  expect(result.logger.events.sample_rate).toBe(0);
});

test('buildLogger journeys defaults to on at a 5% sample rate', () => {
  expect(buildLogger({ components: {} }).logger.journeys).toEqual({
    enabled: true,
    sample_rate: 0.05,
  });
});

test('buildLogger journeys keeps an authored enabled and sample_rate', () => {
  const components = { logger: { journeys: { enabled: false, sample_rate: 1 } } };
  expect(buildLogger({ components }).logger.journeys).toEqual({
    enabled: false,
    sample_rate: 1,
  });
});

test('buildLogger journeys preserves a zero sample_rate', () => {
  const components = { logger: { journeys: { sample_rate: 0 } } };
  expect(buildLogger({ components }).logger.journeys).toEqual({
    enabled: true,
    sample_rate: 0,
  });
});

test('buildLogger sentry with defaults', () => {
  const components = { logger: { sentry: {} } };
  const result = buildLogger({ components });
  expect(result).toEqual({
    logger: {
      events: eventsDefaults,
      journeys: journeysDefaults,
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
      events: eventsDefaults,
      journeys: journeysDefaults,
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
      events: eventsDefaults,
      journeys: journeysDefaults,
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
  expect(result.logger).toEqual({ events: eventsDefaults, journeys: journeysDefaults });
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

test('buildLogger writes no otlp config when the app configured none', () => {
  const result = buildLogger({ components: {} });
  expect(result.logger.otlp).toBeUndefined();
});

test('buildLogger defaults otlp headers, resource and batch', () => {
  const components = { logger: { otlp: { endpoint: 'https://api.axiom.co/v1/logs' } } };
  const result = buildLogger({ components });
  expect(result.logger.otlp).toEqual({
    endpoint: 'https://api.axiom.co/v1/logs',
    headers: {},
    resource: {},
    batch: { size: 50, flush_ms: 2000 },
  });
});

test('buildLogger keeps a header _secret operator node unresolved', () => {
  const components = {
    logger: {
      otlp: {
        endpoint: 'https://api.axiom.co/v1/logs',
        headers: { Authorization: { _secret: 'AXIOM_TOKEN' } },
        batch: { size: 10 },
      },
    },
  };
  const result = buildLogger({ components });
  expect(result.logger.otlp.headers.Authorization).toEqual({ _secret: 'AXIOM_TOKEN' });
  expect(result.logger.otlp.batch).toEqual({ size: 10, flush_ms: 2000 });
});
