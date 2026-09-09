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

import createPageLifecycleManager from './createPageLifecycleManager.js';

const allEvents = {
  onVisible: [],
  onHidden: [],
  onOnline: [],
  onOffline: [],
  onResize: [],
};

const setVisibilityState = (state) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
};

const getContext = ({ events = allEvents, triggerPageEvent } = {}) => ({
  _internal: {
    rootBlock: { events },
    triggerPageEvent: triggerPageEvent ?? jest.fn(() => Promise.resolve()),
    lowdefy: {
      _internal: {
        globals: { document, window },
        handleError: jest.fn(),
      },
    },
  },
});

beforeEach(() => {
  jest.useFakeTimers();
  setVisibilityState('visible');
});

afterEach(() => {
  jest.useRealTimers();
});

test('does not fire on init', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  jest.advanceTimersByTime(1000);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
  manager.destroy();
});

test('onVisible fires on visibilitychange to visible', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  setVisibilityState('hidden');
  manager.init(context);
  setVisibilityState('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onVisible',
    event: { visible: true, reason: 'visibility' },
  });
  manager.destroy();
});

test('onVisible fires on window focus', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  setVisibilityState('hidden');
  manager.init(context);
  window.dispatchEvent(new Event('focus'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onVisible',
    event: { visible: true, reason: 'focus' },
  });
  manager.destroy();
});

test('a focus and visibilitychange pair is coalesced into one onVisible', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  setVisibilityState('hidden');
  manager.init(context);
  setVisibilityState('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('focus'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onVisible',
    event: { visible: true, reason: 'visibility' },
  });
  manager.destroy();
});

test('visibility wins the reason when focus arrives first', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  setVisibilityState('hidden');
  manager.init(context);
  window.dispatchEvent(new Event('focus'));
  setVisibilityState('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onVisible',
    event: { visible: true, reason: 'visibility' },
  });
  manager.destroy();
});

test('a focus while the page is already visible does not fire onVisible', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  window.dispatchEvent(new Event('focus'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
  manager.destroy();
});

test('onHidden fires on visibilitychange to hidden', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  setVisibilityState('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onHidden',
    event: { visible: false, reason: 'visibility' },
  });
  manager.destroy();
});

test('onHidden fires on window blur', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  window.dispatchEvent(new Event('blur'));
  jest.advanceTimersByTime(300);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onHidden',
    event: { visible: false, reason: 'focus' },
  });
  manager.destroy();
});

test('onOnline and onOffline fire with the online payload', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  window.dispatchEvent(new Event('offline'));
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onOffline',
    event: { online: false },
  });
  window.dispatchEvent(new Event('online'));
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onOnline',
    event: { online: true },
  });
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(2);
  manager.destroy();
});

test('onResize is debounced and carries the window size', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  window.innerWidth = 800;
  window.innerHeight = 600;
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('resize'));
  jest.advanceTimersByTime(100);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
  window.innerWidth = 1024;
  window.innerHeight = 768;
  window.dispatchEvent(new Event('resize'));
  jest.advanceTimersByTime(200);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledWith({
    name: 'onResize',
    event: { width: 1024, height: 768 },
  });
  manager.destroy();
});

test('listeners are removed on destroy', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  manager.destroy();
  setVisibilityState('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('blur'));
  window.dispatchEvent(new Event('offline'));
  window.dispatchEvent(new Event('resize'));
  jest.advanceTimersByTime(1000);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
});

test('a pending event does not fire after destroy', () => {
  const context = getContext();
  const manager = createPageLifecycleManager();
  manager.init(context);
  setVisibilityState('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  manager.destroy();
  jest.advanceTimersByTime(1000);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
});

test('listeners are only attached for configured events', () => {
  const context = getContext({ events: { onResize: [] } });
  const manager = createPageLifecycleManager();
  manager.init(context);
  setVisibilityState('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('offline'));
  jest.advanceTimersByTime(1000);
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
  window.dispatchEvent(new Event('resize'));
  jest.advanceTimersByTime(200);
  expect(context._internal.triggerPageEvent).toHaveBeenCalledTimes(1);
  manager.destroy();
});

test('no listeners are attached when the page has no lifecycle events', () => {
  const context = getContext({ events: { onMount: [] } });
  const addEventListener = jest.spyOn(window, 'addEventListener');
  const manager = createPageLifecycleManager();
  manager.init(context);
  expect(addEventListener).not.toHaveBeenCalled();
  addEventListener.mockRestore();
  manager.destroy();
});

test('an error in a lifecycle chain is handled', async () => {
  const error = new Error('Test error.');
  const context = getContext({ triggerPageEvent: jest.fn(() => Promise.reject(error)) });
  const manager = createPageLifecycleManager();
  manager.init(context);
  window.dispatchEvent(new Event('offline'));
  await Promise.resolve();
  expect(context._internal.lowdefy._internal.handleError).toHaveBeenCalledWith(error);
  manager.destroy();
});

test('init is a noop when there are no browser globals', () => {
  const context = getContext();
  context._internal.lowdefy._internal.globals = {};
  const manager = createPageLifecycleManager();
  manager.init(context);
  manager.destroy();
  expect(context._internal.triggerPageEvent).not.toHaveBeenCalled();
});
