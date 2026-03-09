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

import writeLogger from './writeLogger.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeLogger', async () => {
  const components = {
    logger: {
      sentry: {
        client: true,
        server: true,
      },
    },
  };
  await writeLogger({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['logger.json', '{"sentry":{"client":true,"server":true}}'],
  ]);
});

test('writeLogger empty logger', async () => {
  const components = {
    logger: {},
  };
  await writeLogger({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['logger.json', '{}']]);
});

test('writeLogger logger undefined', async () => {
  const components = {};
  await writeLogger({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['logger.json', '{}']]);
});

test('writeLogger logger null', async () => {
  const components = { logger: null };
  await writeLogger({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['logger.json', '{}']]);
});

test('writeLogger with sentry config', async () => {
  const components = {
    logger: {
      sentry: {
        client: true,
        server: true,
        tracesSampleRate: 0.1,
        userFields: ['id', '_id'],
      },
    },
  };
  await writeLogger({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'logger.json',
      '{"sentry":{"client":true,"server":true,"tracesSampleRate":0.1,"userFields":["id","_id"]}}',
    ],
  ]);
});

test('writeLogger preserves all sentry options', async () => {
  const components = {
    logger: {
      sentry: {
        client: false,
        server: true,
        tracesSampleRate: 0.25,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 0.5,
        feedback: true,
        environment: 'production',
        userFields: ['id', 'organization'],
      },
    },
  };
  await writeLogger({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.sentry.client).toBe(false);
  expect(written.sentry.server).toBe(true);
  expect(written.sentry.tracesSampleRate).toBe(0.25);
  expect(written.sentry.replaysSessionSampleRate).toBe(0.1);
  expect(written.sentry.replaysOnErrorSampleRate).toBe(0.5);
  expect(written.sentry.feedback).toBe(true);
  expect(written.sentry.environment).toBe('production');
  expect(written.sentry.userFields).toEqual(['id', 'organization']);
});
