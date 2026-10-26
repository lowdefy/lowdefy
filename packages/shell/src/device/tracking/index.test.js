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

const mockTasks = {};
const mockValues = new Map();
const mockApp = { triggerAppEvent: jest.fn() };

jest.mock('expo-task-manager', () => ({
  defineTask: (name, task) => {
    mockTasks[name] = task;
  },
}));
jest.mock('expo-location', () => ({
  Accuracy: {},
  GeofencingEventType: { Enter: 1, Exit: 2 },
}));
jest.mock('../../host/createDeviceStore.js', () => () => ({
  get: (key) => mockValues.get(key) ?? null,
  set: (key, value) => mockValues.set(key, value),
}));
jest.mock('../../native/currentApp.js', () => ({
  getCurrentApp: async () => mockApp,
  peekCurrentApp: () => mockApp,
}));
jest.mock('../../native/callEndpoint.js', () => jest.fn());

const callEndpoint = require('../../native/callEndpoint.js');

require('./index.js');

function refusal(status) {
  return Object.assign(new Error(`answered ${status}`), { status });
}

function backlog() {
  return JSON.parse(mockValues.get('lowdefy-shell:tracking-backlog') ?? '[]');
}

const locations = [{ coords: { latitude: 1, longitude: 2 }, timestamp: Date.UTC(2026, 0, 1) }];

beforeEach(() => {
  mockValues.clear();
  mockValues.set('lowdefy-shell:tracking', JSON.stringify({ locationEndpointId: 'trip' }));
});

test('a location post that fails waits in the backlog and goes first on the next wake', async () => {
  callEndpoint.mockRejectedValueOnce(new Error('offline'));
  await mockTasks['lowdefy-location-tracking']({ data: { locations } });
  expect(backlog()).toHaveLength(1);
  callEndpoint.mockResolvedValue(null);
  await mockTasks['lowdefy-location-tracking']({ data: { locations } });
  expect(backlog()).toEqual([]);
  expect(callEndpoint).toHaveBeenCalledTimes(3);
  expect(callEndpoint.mock.calls[1][0]).toMatchObject({ app: mockApp, endpointId: 'trip' });
});

test('a post the server refuses is dropped, so it does not hold up the backlog', async () => {
  mockValues.set(
    'lowdefy-shell:tracking-backlog',
    JSON.stringify([{ endpointId: 'trip', payload: { bad: true } }])
  );
  callEndpoint.mockRejectedValueOnce(refusal(400)).mockResolvedValueOnce(null);
  await mockTasks['lowdefy-location-tracking']({ data: { locations } });
  expect(backlog()).toEqual([]);
  expect(callEndpoint).toHaveBeenCalledTimes(2);
});

test('a post refused for a lost session stays for the next wake', async () => {
  callEndpoint.mockRejectedValueOnce(refusal(401));
  await mockTasks['lowdefy-location-tracking']({ data: { locations } });
  expect(backlog()).toHaveLength(1);
});

test('a geofence crossing raises onGeofence and posts to its endpoint', async () => {
  mockValues.set('lowdefy-shell:tracking', JSON.stringify({ geofenceEndpointId: 'fence' }));
  callEndpoint.mockResolvedValue(null);
  await mockTasks['lowdefy-geofencing']({
    data: {
      eventType: 1,
      region: { identifier: 'depot', latitude: 1, longitude: 2, radius: 100 },
    },
  });
  expect(mockApp.triggerAppEvent).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'onGeofence' })
  );
  expect(callEndpoint.mock.calls[0][0]).toMatchObject({
    endpointId: 'fence',
    payload: { event: 'enter', region: { id: 'depot' } },
  });
});
