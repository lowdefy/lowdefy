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

const { subscribe } = await import('./devEventBus.js');
const { default: devNoticeStore } = await import('./devNoticeStore.js');
const { default: createHandleDevNotice } = await import('./createHandleDevNotice.js');

const keyMap = {
  'request.7': { '~r': 1, '~l': 12, key: 'pages.0.requests.0' },
};
const refMap = {
  1: { path: 'pages/home.yaml' },
};

function createContext({ readConfigFile } = {}) {
  return {
    configDirectory: '/app',
    readConfigFile:
      readConfigFile ??
      jest.fn(async (name) => {
        if (name === 'keyMap.json') return keyMap;
        if (name === 'refMap.json') return refMap;
        return null;
      }),
  };
}

const notice = {
  name: 'TenantNoneNotice',
  level: 'info',
  message: 'Request "requestId" ran unscoped on tenant connection "app_data" (tenant: none).',
  configKey: 'request.7',
  details: {
    connectionId: 'app_data',
    requestId: 'requestId',
    stepId: null,
    field: 'organization_id',
  },
};

// The store publishes every notice it stores on the dev event bus; the reload
// route subscribes to the bus and forwards the dev_notice events to the tabs.
function subscribeToNotices(send) {
  return subscribe((event) => {
    if (event.type !== 'dev_notice') return;
    send(event);
  });
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test('handleDevNotice returns synchronously, resolves the source and stores the entry', async () => {
  const handleDevNotice = createHandleDevNotice({ context: createContext() });
  const returned = handleDevNotice(notice);
  expect(returned).toBeUndefined();
  expect(devNoticeStore.list()).toEqual([]);
  await flush();
  const entries = devNoticeStore.list();
  expect(entries.length).toEqual(1);
  expect(entries[0]).toEqual({
    timestamp: expect.any(String),
    name: 'TenantNoneNotice',
    level: 'info',
    message: notice.message,
    source: '/app/pages/home.yaml:12',
    config: 'pages.0.requests.0',
    details: notice.details,
    configKey: 'request.7',
  });
  expect(new Date(entries[0].timestamp).toISOString()).toEqual(entries[0].timestamp);
});

test('handleDevNotice broadcasts the stored entry to subscribed dev tabs once per config site', async () => {
  const send = jest.fn();
  const unsubscribe = subscribeToNotices(send);
  const handleDevNotice = createHandleDevNotice({ context: createContext() });
  handleDevNotice({ ...notice, configKey: 'request.8' });
  await flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0].configKey).toEqual('request.8');
  expect(send.mock.calls[0][0].source).toEqual(null);

  handleDevNotice({ ...notice, configKey: 'request.8' });
  await flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(devNoticeStore.list().length).toEqual(2);
  unsubscribe();

  handleDevNotice({ ...notice, configKey: 'request.9' });
  await flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(devNoticeStore.list().length).toEqual(3);
});

test('handleDevNotice swallows a rejecting readConfigFile and still stores the notice without a source', async () => {
  const readConfigFile = jest.fn(async () => {
    throw new Error('keyMap missing');
  });
  const handleDevNotice = createHandleDevNotice({ context: createContext({ readConfigFile }) });
  expect(() => handleDevNotice({ ...notice, configKey: 'request.10' })).not.toThrow();
  await flush();
  const entries = devNoticeStore.list();
  expect(entries[entries.length - 1]).toMatchObject({
    configKey: 'request.10',
    source: null,
    config: null,
  });
});

test('handleDevNotice swallows a throwing subscriber', async () => {
  const unsubscribe = subscribeToNotices(() => {
    throw new Error('tab gone');
  });
  const handleDevNotice = createHandleDevNotice({ context: createContext() });
  expect(() => handleDevNotice({ ...notice, configKey: 'request.11' })).not.toThrow();
  await flush();
  expect(devNoticeStore.list()[devNoticeStore.list().length - 1].configKey).toEqual('request.11');
  unsubscribe();
});

test('handleDevNotice swallows a context with no readConfigFile', async () => {
  const handleDevNotice = createHandleDevNotice({ context: {} });
  expect(() => handleDevNotice({ ...notice, configKey: 'request.12' })).not.toThrow();
  await flush();
});

test('handleDevNotice broadcasts a notice raised when the store is already at capacity', async () => {
  // The ring holds 50: a stored entry then also evicts one, leaving the list
  // length unchanged. Inferring "was it stored?" from that length silently
  // stopped every notice from the 51st config site onward.
  for (let i = 0; i < 50; i++) {
    devNoticeStore.push({ configKey: `capacity-${i}` });
  }
  const send = jest.fn();
  const unsubscribe = subscribeToNotices(send);
  const handleDevNotice = createHandleDevNotice({ context: createContext() });

  handleDevNotice({ ...notice, configKey: 'past-capacity' });
  await flush();

  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0].configKey).toEqual('past-capacity');
  unsubscribe();
});
