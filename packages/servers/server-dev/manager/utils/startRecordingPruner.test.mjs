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

const mockPruneRecordings = jest.fn();
jest.unstable_mockModule('./pruneRecordings.mjs', () => ({ default: mockPruneRecordings }));

const { default: startRecordingPruner } = await import('./startRecordingPruner.mjs');

const logger = { debug: jest.fn() };

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  mockPruneRecordings.mockReset();
  mockPruneRecordings.mockReturnValue({ directories: [], files: [] });
  logger.debug.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

test('startRecordingPruner prunes at start and then on the interval, with recording off', () => {
  process.env.LOWDEFY_DEV_RECORD = 'false';
  const interval = startRecordingPruner({ configDirectory: '/app', logger, intervalMs: 1000 });
  expect(mockPruneRecordings).toHaveBeenCalledTimes(1);
  expect(mockPruneRecordings).toHaveBeenCalledWith({ configDirectory: '/app' });
  jest.advanceTimersByTime(2500);
  expect(mockPruneRecordings).toHaveBeenCalledTimes(3);
  clearInterval(interval);
  delete process.env.LOWDEFY_DEV_RECORD;
});

test('startRecordingPruner logs a failure at debug and keeps running', () => {
  mockPruneRecordings.mockImplementationOnce(() => {
    throw new Error('EACCES');
  });
  const interval = startRecordingPruner({ configDirectory: '/app', logger, intervalMs: 1000 });
  expect(logger.debug).toHaveBeenCalledWith('Pruning dev recordings failed: EACCES');
  jest.advanceTimersByTime(1000);
  expect(mockPruneRecordings).toHaveBeenCalledTimes(2);
  clearInterval(interval);
});

test('startRecordingPruner logs what it deleted at debug', () => {
  mockPruneRecordings.mockReturnValue({ directories: ['/a'], files: ['/b', '/c'] });
  const interval = startRecordingPruner({ configDirectory: '/app', logger });
  expect(logger.debug).toHaveBeenCalledWith(
    'Pruned 1 recording date directories and 2 recording files.'
  );
  clearInterval(interval);
});
