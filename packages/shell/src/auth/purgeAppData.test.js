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

import { expect, test, vi } from 'vitest';
import { Image } from 'expo-image';
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
    cacheStore: { removeApp: vi.fn() },
    kv,
    queueStore: { removeApp: vi.fn() },
    slug: null,
    tokenStore: { clear: vi.fn() },
  });
}

test('a sign-out stops tracking and geofencing, drops the backlog and clears notifications', async () => {
  const tracking = { stopTracking: vi.fn(), stopGeofencing: vi.fn() };
  const notifications = { cancel: vi.fn(), setBadgeCount: vi.fn() };
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

test('a sign-out clears the images expo-image cached in memory and on disk', async () => {
  const clearMemoryCache = vi.spyOn(Image, 'clearMemoryCache');
  const clearDiskCache = vi.spyOn(Image, 'clearDiskCache');
  await purge(memoryKv({}));
  expect(clearMemoryCache).toHaveBeenCalled();
  expect(clearDiskCache).toHaveBeenCalled();
  clearMemoryCache.mockRestore();
  clearDiskCache.mockRestore();
});

test('an image cache that fails to clear does not fail the sign-out', async () => {
  const clearDiskCache = vi
    .spyOn(Image, 'clearDiskCache')
    .mockRejectedValue(new Error('disk cache busy'));
  const kv = memoryKv({ 'lowdefy-shell:tracking-backlog': '[]' });
  await expect(purge(kv)).resolves.toBeUndefined();
  expect([...kv.values.keys()]).toEqual([]);
  clearDiskCache.mockRestore();
});

test('a sign-out on a shell without tracking or notifications still purges', async () => {
  const kv = memoryKv({ 'lowdefy-shell:tracking-backlog': '[]' });
  await purge(kv);
  expect([...kv.values.keys()]).toEqual([]);
});

test('a feature that fails to stop does not stop the purge', async () => {
  const tracking = {
    stopTracking: vi.fn().mockRejectedValue(new Error('denied')),
    stopGeofencing: vi.fn(),
  };
  const removeDevice = installDevice({ tracking });
  const tokenStore = { clear: vi.fn() };
  await purgeAppData({
    appId: 'app',
    cacheStore: { removeApp: vi.fn() },
    kv: memoryKv({}),
    queueStore: { removeApp: vi.fn() },
    slug: null,
    tokenStore,
  });
  removeDevice();
  expect(tracking.stopGeofencing).toHaveBeenCalled();
  expect(tokenStore.clear).toHaveBeenCalled();
});
