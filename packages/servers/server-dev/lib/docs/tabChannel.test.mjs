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

const { listTabs, registerTab, requestFromTab, resolveTabRequest, unregisterTab, updateTabPage } =
  await import('./tabChannel.js');

// tabChannel keeps its registries at module scope, so clear connected tabs
// between tests to keep them independent.
afterEach(() => {
  listTabs().forEach((tab) => unregisterTab({ id: tab.id }));
});

test('registerTab adds a tab visible via listTabs', () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  const tabs = listTabs();
  expect(tabs).toHaveLength(1);
  expect(tabs[0]).toMatchObject({ id: 'tab-1', pageId: 'home' });
  expect(tabs[0].connectedAt).toBeInstanceOf(Date);
});

test('registerTab throws when id is missing', () => {
  expect(() => registerTab({ pageId: 'home', send: jest.fn() })).toThrow('registerTab requires');
});

test('registerTab throws when send is not a function', () => {
  expect(() => registerTab({ id: 'tab-1', pageId: 'home' })).toThrow(
    'registerTab requires a "send" function'
  );
});

test('unregisterTab removes a tab from the registry', () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  unregisterTab({ id: 'tab-1' });
  expect(listTabs()).toHaveLength(0);
});

test('updateTabPage changes the pageId of a registered tab', () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  updateTabPage({ id: 'tab-1', pageId: 'about' });
  expect(listTabs()[0].pageId).toEqual('about');
});

test('updateTabPage on an unknown tab id does not throw', () => {
  expect(() => updateTabPage({ id: 'missing', pageId: 'about' })).not.toThrow();
});

test('requestFromTab sends the event to the matching tab and resolves via resolveTabRequest', async () => {
  const send = jest.fn();
  registerTab({ id: 'tab-1', pageId: 'home', send });
  const promise = requestFromTab({ pageId: 'home', event: 'inspect-request' });

  expect(send).toHaveBeenCalledTimes(1);
  const [event, payload] = send.mock.calls[0];
  expect(event).toEqual('inspect-request');
  expect(payload.requestId).toEqual(expect.any(String));

  const resolved = resolveTabRequest({ requestId: payload.requestId, result: 'snapshot' });
  expect(resolved).toBe(true);
  await expect(promise).resolves.toEqual('snapshot');
});

test('requestFromTab targets the tab registered for the given pageId', async () => {
  const sendHome = jest.fn();
  const sendAbout = jest.fn();
  registerTab({ id: 'tab-home', pageId: 'home', send: sendHome });
  registerTab({ id: 'tab-about', pageId: 'about', send: sendAbout });

  const promise = requestFromTab({ pageId: 'about', event: 'eval-request' });
  expect(sendAbout).toHaveBeenCalledTimes(1);
  expect(sendHome).not.toHaveBeenCalled();

  const requestId = sendAbout.mock.calls[0][1].requestId;
  resolveTabRequest({ requestId, result: { value: '1' } });
  await expect(promise).resolves.toEqual({ value: '1' });
});

test('requestFromTab picks the most recently registered tab when pageId is omitted', async () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  const sendLatest = jest.fn();
  registerTab({ id: 'tab-2', pageId: 'about', send: sendLatest });

  const promise = requestFromTab({ event: 'inspect-request' });
  expect(sendLatest).toHaveBeenCalledTimes(1);

  const requestId = sendLatest.mock.calls[0][1].requestId;
  resolveTabRequest({ requestId, result: 'ok' });
  await expect(promise).resolves.toEqual('ok');
});

test('requestFromTab resolves with an error when no tab matches the pageId', async () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  const response = await requestFromTab({ pageId: 'missing-page', event: 'inspect-request' });
  expect(response.error).toContain('No browser tab connected');
});

test('requestFromTab resolves with a timeout error when no response arrives in time', async () => {
  registerTab({ id: 'tab-1', pageId: 'home', send: jest.fn() });
  const response = await requestFromTab({ pageId: 'home', event: 'inspect-request', timeout: 10 });
  expect(response.error).toContain('Timed out');
});

test('resolveTabRequest returns false for an unknown requestId', () => {
  expect(resolveTabRequest({ requestId: 'unknown', result: 'x' })).toBe(false);
});

test('resolveTabRequest returns false when called again for an already-settled requestId', async () => {
  const send = jest.fn();
  registerTab({ id: 'tab-1', pageId: 'home', send });
  const promise = requestFromTab({ pageId: 'home', event: 'inspect-request' });
  const requestId = send.mock.calls[0][1].requestId;

  expect(resolveTabRequest({ requestId, result: 'first' })).toBe(true);
  await promise;
  expect(resolveTabRequest({ requestId, result: 'second' })).toBe(false);
});
