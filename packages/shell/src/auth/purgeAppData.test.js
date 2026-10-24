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

import { installDevice } from '@lowdefy/blocks-native/device';

import purgeAppData from './purgeAppData.js';

function memoryKv(entries) {
  const values = new Map(Object.entries(entries));
  return {
    keys: () => [...values.keys()],
    remove: (key) => values.delete(key),
    values,
  };
}

function purge(kv) {
  return purgeAppData({
    appId: 'app',
    cacheStore: { removeApp: jest.fn() },
    kv,
    queueStore: { removeApp: jest.fn() },
    slug: null,
    tokenStore: { clear: jest.fn() },
  });
}

test('a sign-out stops tracking and geofencing, drops the backlog and clears notifications', async () => {
  const tracking = { stopTracking: jest.fn(), stopGeofencing: jest.fn() };
  const notifications = { cancel: jest.fn(), setBadgeCount: jest.fn() };
  const removeDevice = installDevice({ notifications, tracking });
  const kv = memoryKv({
    'lowdefy-shell:tracking': '{}',
    'lowdefy-shell:tracking-backlog': '[]',
    'lowdefy-shell:preferences': '{}',
  });
  await purge(kv);
  removeDevice();
  expect(tracking.stopTracking).toHaveBeenCalled();
  expect(tracking.stopGeofencing).toHaveBeenCalled();
  expect(notifications.cancel).toHaveBeenCalledWith({ all: true });
  expect(notifications.setBadgeCount).toHaveBeenCalledWith({ count: 0 });
  expect([...kv.values.keys()]).toEqual(['lowdefy-shell:preferences']);
});

test('a sign-out on a shell without tracking or notifications still purges', async () => {
  const kv = memoryKv({ 'lowdefy-shell:tracking-backlog': '[]' });
  await purge(kv);
  expect([...kv.values.keys()]).toEqual([]);
});

test('a feature that fails to stop does not stop the purge', async () => {
  const tracking = {
    stopTracking: jest.fn().mockRejectedValue(new Error('denied')),
    stopGeofencing: jest.fn(),
  };
  const removeDevice = installDevice({ tracking });
  const tokenStore = { clear: jest.fn() };
  await purgeAppData({
    appId: 'app',
    cacheStore: { removeApp: jest.fn() },
    kv: memoryKv({}),
    queueStore: { removeApp: jest.fn() },
    slug: null,
    tokenStore,
  });
  removeDevice();
  expect(tracking.stopGeofencing).toHaveBeenCalled();
  expect(tokenStore.clear).toHaveBeenCalled();
});
