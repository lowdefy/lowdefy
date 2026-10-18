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

import { Hono } from 'hono';

const { closePolledTabs } = await import('../../lib/docs/pollTab.js');
const { listTabs } = await import('../../lib/docs/tabChannel.js');
const { default: reloadHandler } = await import('./reload.js');

function poll({ query, headers }) {
  const app = new Hono();
  app.get('/api/reload', reloadHandler);
  return app.request(`/api/reload?transport=poll&${query}`, { headers });
}

afterEach(() => {
  closePolledTabs();
});

test('a phone shell registers as a device tab with its shell version, platform and app id', async () => {
  const res = await poll({
    query: 'client=lowdefy-dev-tab-client&platform=ios&app=com.lowdefy.dev',
    headers: { 'x-lowdefy-shell': '7.1.0' },
  });
  expect(res.status).toBe(200);
  const { tabId } = await res.json();
  expect(listTabs()).toEqual([
    expect.objectContaining({
      id: tabId,
      device: { shell: '7.1.0', platform: 'ios', app: 'com.lowdefy.dev', paired: false },
    }),
  ]);
});

test('a phone paired over the network is marked paired', async () => {
  await poll({
    query: 'platform=android',
    headers: { 'x-lowdefy-shell': '7.1.0', 'x-lowdefy-dev-remote': '1' },
  });
  expect(listTabs()[0].device).toEqual({
    shell: '7.1.0',
    platform: 'android',
    app: null,
    paired: true,
  });
});

test('a browser tab is no device, whatever its query says', async () => {
  await poll({ query: 'platform=ios', headers: {} });
  expect(listTabs()[0].device).toBeNull();
});

test('an unknown platform is recorded as none', async () => {
  await poll({ query: 'platform=watchos', headers: { 'x-lowdefy-shell': '7.1.0' } });
  expect(listTabs()[0].device.platform).toBeNull();
});
