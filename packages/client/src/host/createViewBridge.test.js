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

import createFakeViewLoader from '../test/createFakeViewLoader.js';
import createViewBridge from './createViewBridge.js';

test('createViewBridge throws when the loader handed over no host connection', () => {
  expect(() => createViewBridge({ view: undefined })).toThrow(
    'The view loader handed over no host connection.'
  );
});

test('createViewBridge gives the app origin and basePath from the loader', () => {
  const bridge = createViewBridge({ view: createFakeViewLoader({ basePath: '/base' }) });
  expect(bridge.appOrigin).toBe('https://app.example.com');
  expect(bridge.basePath).toBe('/base');
});

test('createViewBridge reads the view address from the tool result _meta', () => {
  const bridge = createViewBridge({ view: createFakeViewLoader({ path: '/tasks/1?tab=files' }) });
  expect(bridge.getViewPath()).toBe('/tasks/1?tab=files');
});

test('createViewBridge names the missing key when the tool result has no view address', () => {
  const view = createFakeViewLoader();
  view.toolResult = { content: [], structuredContent: { id: 1 } };
  const bridge = createViewBridge({ view });
  expect(() => bridge.getViewPath()).toThrow(
    'The tool result carries no "lowdefy/view" address in _meta.'
  );
});

test('createViewBridge refuses a view address that is not a path', () => {
  const view = createFakeViewLoader({ path: '@other.example/tasks' });
  const bridge = createViewBridge({ view });
  expect(() => bridge.getViewPath()).toThrow('carries no "lowdefy/view" address');
});

test('createViewBridge mints a session by calling the session tool through the host', async () => {
  const view = createFakeViewLoader();
  const bridge = createViewBridge({ view });
  await expect(bridge.mintSession()).resolves.toEqual({
    expiresAt: '2026-01-01T00:15:00.000Z',
    token: 'token-1',
  });
  expect(view.host.callServerTool).toHaveBeenCalledWith({
    name: 'lowdefy_view_session',
    arguments: {},
  });
});

test('createViewBridge names the missing key when the session result has no _meta token', async () => {
  const view = createFakeViewLoader();
  view.host.callServerTool = vi.fn(async () => ({ content: [], structuredContent: {} }));
  const bridge = createViewBridge({ view });
  await expect(bridge.mintSession()).rejects.toThrow(
    'The "lowdefy_view_session" result carries no "lowdefy/viewSession" token in _meta.'
  );
});

test('createViewBridge rejects with the message of a refused session', async () => {
  const bridge = createViewBridge({ view: createFakeViewLoader({ tokens: [] }) });
  await expect(bridge.mintSession()).rejects.toThrow('No session for you.');
});

test('createViewBridge reads the display mode from the latest host context', () => {
  const view = createFakeViewLoader();
  const bridge = createViewBridge({ view });
  const listener = vi.fn();
  const stop = bridge.onContextChange(listener);
  expect(bridge.getDisplayMode()).toBe('inline');
  view.setContext({ displayMode: 'fullscreen' });
  expect(bridge.getDisplayMode()).toBe('fullscreen');
  expect(listener).toHaveBeenCalledWith({ displayMode: 'fullscreen' });
  stop();
  view.setContext({});
  expect(bridge.getDisplayMode()).toBeNull();
  expect(listener).toHaveBeenCalledTimes(1);
});

test('createViewBridge passes open-link, send-message and the fallback to the loader', async () => {
  const view = createFakeViewLoader();
  const bridge = createViewBridge({ view });
  await bridge.openLink({ url: 'https://app.example.com/tasks' });
  await bridge.sendMessage({ text: 'Done' });
  bridge.showFallback({ message: 'Could not load.' });
  expect(view.host.openLink).toHaveBeenCalledWith({ url: 'https://app.example.com/tasks' });
  expect(view.host.sendMessage).toHaveBeenCalledWith({ text: 'Done' });
  expect(view.showFallback).toHaveBeenCalledWith({ message: 'Could not load.' });
});

test('createViewBridge replaces the boot answer on the loader object', () => {
  const view = createFakeViewLoader();
  const bridge = createViewBridge({ view });
  const boot = { buildId: 'build-2', js: '/assets/view-2.js', css: [] };
  bridge.setBoot(boot);
  expect(bridge.getBoot()).toBe(boot);
  expect(view.boot).toBe(boot);
});
