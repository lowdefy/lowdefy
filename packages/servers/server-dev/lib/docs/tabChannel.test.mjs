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

const {
  findPageInstance,
  listTabs,
  registerTab,
  requestFromTab,
  resolveTabRequest,
  unregisterTab,
  updateTabPage,
} = await import('./tabChannel.js');

// tabChannel keeps its registries at module scope, so clear connected tabs
// between tests to keep them independent.
afterEach(() => {
  listTabs().forEach((tab) => unregisterTab({ id: tab.id }));
});

function ticket({ space = 's', ticketId }) {
  return {
    pageId: 'ticket',
    pathParams: { space, ticket_id: ticketId },
    instanceKey: `page:ticket#tickets/${space}/${ticketId}`,
  };
}

function connectTab({ id, pageId, send = jest.fn(), ...origin }) {
  registerTab({ id, send, ...origin });
  if (pageId) {
    updateTabPage({ id, pageId, pathParams: {}, instanceKey: `page:${pageId}` });
  }
  return send;
}

test('registerTab adds a tab visible via listTabs, on no page until its first page renders', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  const tabs = listTabs();
  expect(tabs).toHaveLength(1);
  expect(tabs[0]).toMatchObject({ id: 'tab-1', pageId: null, pathParams: null, instanceKey: null });
  expect(tabs[0].connectedAt).toBeInstanceOf(Date);
});

test('registerTab throws when id is missing', () => {
  expect(() => registerTab({ send: jest.fn() })).toThrow('registerTab requires');
});

test('registerTab throws when send is not a function', () => {
  expect(() => registerTab({ id: 'tab-1' })).toThrow('registerTab requires a "send" function');
});

test('unregisterTab removes a tab from the registry', () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  unregisterTab({ id: 'tab-1' });
  expect(listTabs()).toHaveLength(0);
});

test('updateTabPage records the page instance a tab shows', () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '2' }) });
  expect(listTabs()[0]).toMatchObject({
    id: 'tab-1',
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '2' },
    instanceKey: 'page:ticket#tickets/s/2',
  });
});

test('updateTabPage on an unknown tab id does not throw', () => {
  expect(() =>
    updateTabPage({ id: 'missing', pageId: 'about', instanceKey: 'page:about' })
  ).not.toThrow();
});

test('updateTabPage throws when the instance key is missing', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  expect(() => updateTabPage({ id: 'tab-1', pageId: 'about' })).toThrow(
    'updateTabPage requires "pageId" and "instanceKey" strings'
  );
});

test('findPageInstance reads the instance on screen when the tab is on the page', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '2' }) });
  const { tab, ...instance } = findPageInstance({ pageId: 'ticket' });
  expect(tab.id).toEqual('tab-1');
  expect(instance).toEqual(ticket({ ticketId: '2' }));
});

test('findPageInstance reads the most recently rendered instance when no tab is on the page', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  registerTab({ id: 'tab-2', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  updateTabPage({ id: 'tab-2', ...ticket({ ticketId: '2' }) });
  updateTabPage({ id: 'tab-1', pageId: 'home', instanceKey: 'page:home' });
  updateTabPage({ id: 'tab-2', pageId: 'home', instanceKey: 'page:home' });
  const { tab, ...instance } = findPageInstance({ pageId: 'ticket' });
  expect(tab.id).toEqual('tab-2');
  expect(instance).toEqual(ticket({ ticketId: '2' }));
});

test('findPageInstance prefers a tab showing the page over a later render elsewhere', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  registerTab({ id: 'tab-2', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  updateTabPage({ id: 'tab-2', ...ticket({ ticketId: '2' }) });
  updateTabPage({ id: 'tab-2', pageId: 'home', instanceKey: 'page:home' });
  const { tab, ...instance } = findPageInstance({ pageId: 'ticket' });
  expect(tab.id).toEqual('tab-1');
  expect(instance).toEqual(ticket({ ticketId: '1' }));
});

test('findPageInstance with pathParams reads that instance, comparing values as strings', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '2' }) });
  const { tab, ...instance } = findPageInstance({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: 1 },
  });
  expect(tab.id).toEqual('tab-1');
  expect(instance).toEqual(ticket({ ticketId: '1' }));
});

test('findPageInstance returns undefined for values no tab has rendered', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  expect(
    findPageInstance({ pageId: 'ticket', pathParams: { space: 's', ticket_id: '3' } })
  ).toBeUndefined();
  expect(findPageInstance({ pageId: 'ticket', pathParams: { space: 's' } })).toBeUndefined();
});

test('findPageInstance without a pageId reads the most recently connected tab on screen', () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  connectTab({ id: 'tab-2', pageId: 'about' });
  registerTab({ id: 'tab-3', send: jest.fn() });
  const { tab, ...instance } = findPageInstance();
  expect(tab.id).toEqual('tab-2');
  expect(instance).toEqual({ pageId: 'about', pathParams: {}, instanceKey: 'page:about' });
});

test('findPageInstance forgets the instances of a tab that disconnected', () => {
  registerTab({ id: 'tab-1', send: jest.fn() });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  unregisterTab({ id: 'tab-1' });
  expect(findPageInstance({ pageId: 'ticket' })).toBeUndefined();
});

test('requestFromTab sends the event to the matching tab and resolves via resolveTabRequest', async () => {
  const send = connectTab({ id: 'tab-1', pageId: 'home' });
  const promise = requestFromTab({ pageId: 'home', event: 'inspect-request' });

  expect(send).toHaveBeenCalledTimes(1);
  const [event, payload] = send.mock.calls[0];
  expect(event).toEqual('inspect-request');
  expect(payload.requestId).toEqual(expect.any(String));

  const resolved = resolveTabRequest({ requestId: payload.requestId, result: 'snapshot' });
  expect(resolved).toBe(true);
  await expect(promise).resolves.toEqual('snapshot');
});

test('requestFromTab names the instance to read in the event it sends', async () => {
  const send = jest.fn();
  registerTab({ id: 'tab-1', send });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '1' }) });
  updateTabPage({ id: 'tab-1', ...ticket({ ticketId: '2' }) });
  requestFromTab({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    event: 'eval-request',
    payload: { expression: { _state: 'a' } },
    timeout: 10,
  });
  expect(send.mock.calls[0][1]).toEqual({
    requestId: expect.any(String),
    ...ticket({ ticketId: '1' }),
    expression: { _state: 'a' },
  });
});

test('requestFromTab targets the tab on the given pageId', async () => {
  const sendHome = connectTab({ id: 'tab-home', pageId: 'home' });
  const sendAbout = connectTab({ id: 'tab-about', pageId: 'about' });

  const promise = requestFromTab({ pageId: 'about', event: 'eval-request' });
  expect(sendAbout).toHaveBeenCalledTimes(1);
  expect(sendHome).not.toHaveBeenCalled();

  const requestId = sendAbout.mock.calls[0][1].requestId;
  resolveTabRequest({ requestId, result: { value: '1' } });
  await expect(promise).resolves.toEqual({ value: '1' });
});

test('requestFromTab picks the most recently registered tab when pageId is omitted', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const sendLatest = connectTab({ id: 'tab-2', pageId: 'about' });

  const promise = requestFromTab({ event: 'inspect-request' });
  expect(sendLatest).toHaveBeenCalledTimes(1);

  const requestId = sendLatest.mock.calls[0][1].requestId;
  resolveTabRequest({ requestId, result: 'ok' });
  await expect(promise).resolves.toEqual('ok');
});

test('requestFromTab resolves with an error when no tab matches the pageId', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const response = await requestFromTab({ pageId: 'missing-page', event: 'inspect-request' });
  expect(response.error).toContain('No browser tab connected');
});

test('requestFromTab names the pathParams in its error when no tab has that instance', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const response = await requestFromTab({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    event: 'inspect-request',
  });
  expect(response.error).toEqual(
    'No browser tab connected on page "ticket" with pathParams {"space":"s","ticket_id":"1"}. Ask the developer to open the page, or use source: "headless".'
  );
});

test('requestFromTab resolves with a timeout error when no response arrives in time', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const response = await requestFromTab({ pageId: 'home', event: 'inspect-request', timeout: 10 });
  expect(response.error).toContain('Timed out');
});

test('resolveTabRequest returns false for an unknown requestId', () => {
  expect(resolveTabRequest({ requestId: 'unknown', result: 'x' })).toBe(false);
});

test('resolveTabRequest returns false when called again for an already-settled requestId', async () => {
  const send = connectTab({ id: 'tab-1', pageId: 'home' });
  const promise = requestFromTab({ pageId: 'home', event: 'inspect-request' });
  const requestId = send.mock.calls[0][1].requestId;

  expect(resolveTabRequest({ requestId, result: 'first' })).toBe(true);
  await promise;
  expect(resolveTabRequest({ requestId, result: 'second' })).toBe(false);
});

test('requestFromTab skips an automated journey tab for the developer tab on the same page', async () => {
  const developerSend = connectTab({ id: 'developer', pageId: 'tickets' });
  const walkSend = connectTab({
    id: 'walk',
    pageId: 'tickets',
    source: 'journey',
    automated: true,
  });
  const promise = requestFromTab({ pageId: 'tickets', event: 'inspect-request', timeout: 50 });
  expect(developerSend).toHaveBeenCalledTimes(1);
  expect(walkSend).not.toHaveBeenCalled();
  const [, { requestId }] = developerSend.mock.calls[0];
  resolveTabRequest({ requestId, result: { state: {} } });
  await expect(promise).resolves.toEqual({ state: {} });
  expect(listTabs().map(({ id, source, automated }) => ({ id, source, automated }))).toEqual([
    { id: 'developer', source: 'dev', automated: false },
    { id: 'walk', source: 'journey', automated: true },
  ]);
});

test('requestFromTab finds no tab when only an automated tab is on the page', async () => {
  connectTab({ id: 'walk', pageId: 'tickets', source: 'journey', automated: true });
  await expect(requestFromTab({ pageId: 'tickets', event: 'inspect-request' })).resolves.toEqual({
    error:
      'No browser tab connected on page "tickets". Ask the developer to open the page, or use source: "headless".',
  });
});
