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

const { default: pollTab, closePolledTabs } = await import('./pollTab.js');
const { findPageInstance, listTabs, requestFromTab, updateTabPage } = await import(
  './tabChannel.js'
);

const origin = { source: 'dev', automated: false };

afterEach(() => {
  closePolledTabs();
});

test('a first poll registers a tab and answers its id as a tab event', () => {
  const { tabId, events } = pollTab({ origin, readReloadStamp: () => '1', now: 0 });
  expect(events).toEqual([{ event: 'tab', data: JSON.stringify({ tabId }) }]);
  expect(listTabs().map((tab) => tab.id)).toEqual([tabId]);
});

test('a poll takes the requests sent to the tab since the last poll', () => {
  const { tabId } = pollTab({ origin, readReloadStamp: () => '1', now: 0 });
  updateTabPage({ id: tabId, pageId: 'home', pathParams: {}, instanceKey: 'page:home' });
  expect(findPageInstance({ pageId: 'home' }).tab.id).toBe(tabId);
  requestFromTab({ pageId: 'home', event: 'inspect-request', timeout: 50 });
  const { events } = pollTab({ tabId, origin, readReloadStamp: () => '1', now: 1000 });
  expect(events).toHaveLength(1);
  expect(events[0].event).toBe('inspect-request');
  expect(JSON.parse(events[0].data)).toMatchObject({ pageId: 'home', instanceKey: 'page:home' });
  expect(pollTab({ tabId, origin, readReloadStamp: () => '1', now: 2000 }).events).toEqual([]);
});

test('a poll after a build answers a reload event once', () => {
  let stamp = '1';
  const { tabId } = pollTab({ origin, readReloadStamp: () => stamp, now: 0 });
  stamp = '2';
  expect(pollTab({ tabId, origin, readReloadStamp: () => stamp, now: 1000 }).events).toEqual([
    { event: 'reload', data: '{}' },
  ]);
  expect(pollTab({ tabId, origin, readReloadStamp: () => stamp, now: 2000 }).events).toEqual([]);
});

test('a tab not polled for 10 s is unregistered, and its next poll opens a new tab', () => {
  const { tabId } = pollTab({ origin, readReloadStamp: () => null, now: 0 });
  const next = pollTab({ tabId, origin, readReloadStamp: () => null, now: 20000 });
  expect(next.tabId).not.toBe(tabId);
  expect(next.events[0].event).toBe('tab');
  expect(listTabs().map((tab) => tab.id)).toEqual([next.tabId]);
});
