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

const mockPublish = jest.fn();
jest.unstable_mockModule('../devEventBus.js', () => ({ publish: mockPublish }));
jest.unstable_mockModule('../getBuildId.js', () => ({ default: () => 'build-1' }));
jest.unstable_mockModule('../readBuildArtifact.js', () => ({ default: () => ({ status: 'ok' }) }));
jest.unstable_mockModule('../getPageBuildStatus.js', () => ({ default: () => [] }));

const { default: clientErrorStore } = await import('../clientErrorStore.js');
const { default: serverErrorStore } = await import('../serverErrorStore.js');
const { default: getBuildStatus } = await import('../getBuildStatus.js');
const { getWalk, registerWalk, removeWalk } = await import('./walkSessions.js');

const run = '20261003T151200Z-p0d4rm';
const walkRecording = { source: 'explorer', run, journey: 'walk-1' };

beforeEach(() => {
  registerWalk({ walkId: 'walk-1', run, journey: 'walk-1' });
});
afterEach(() => {
  removeWalk('walk-1');
});

test.each([
  ['client', clientErrorStore, 'clientErrors', 'client_error'],
  ['server', serverErrorStore, 'serverErrors', 'server_error'],
])(
  'a %s error a walk caused reaches only its walk; a developer error in the same window reaches the store, build-status and the event bus',
  (_, store, statusKey, eventType) => {
    store.push({
      timestamp: '2026-10-03T15:12:01.000Z',
      message: 'walk',
      recording: walkRecording,
    });
    store.push({ timestamp: '2026-10-03T15:12:01.500Z', message: 'developer', recording: null });

    expect(getWalk('walk-1').errors).toEqual([
      {
        timestamp: '2026-10-03T15:12:01.000Z',
        message: 'walk',
        recording: walkRecording,
        buildId: 'build-1',
      },
    ]);
    expect(store.list().map((entry) => entry.message)).toEqual(['developer']);
    expect(getBuildStatus()[statusKey].map((entry) => entry.message)).toEqual(['developer']);
    expect(mockPublish.mock.calls.map(([event]) => [event.type, event.message])).toEqual([
      [eventType, 'developer'],
    ]);
  }
);

test('an error stamped for a closed walk is dropped, not stored', () => {
  removeWalk('walk-1');
  clientErrorStore.push({
    timestamp: '2026-10-03T15:12:01.000Z',
    message: 'late',
    recording: walkRecording,
  });
  expect(clientErrorStore.list().map((entry) => entry.message)).not.toContain('late');
  expect(mockPublish).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'late' }));
});

test('an error from a journey run, not an explorer walk, stays in the shared store', () => {
  serverErrorStore.push({
    timestamp: '2026-10-03T15:12:02.000Z',
    message: 'journey',
    recording: { source: 'journey', run, journey: 'tests/journeys/a.yaml#A' },
  });
  expect(serverErrorStore.list().map((entry) => entry.message)).toContain('journey');
});
