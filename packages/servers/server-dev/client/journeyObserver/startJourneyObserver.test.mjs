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

import startJourneyObserver from './startJourneyObserver.js';

function createFakeWindow({ binding } = {}) {
  const observers = [];
  const frames = [];
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnect = jest.fn();
      this.observe = jest.fn();
      observers.push(this);
    }
  }
  const window = {
    document: { body: {} },
    MutationObserver: FakeMutationObserver,
    requestAnimationFrame: jest.fn((callback) => {
      frames.push(callback);
      return frames.length;
    }),
    cancelAnimationFrame: jest.fn(),
  };
  if (binding !== undefined) {
    window.__lowdefyJourneyObserve = binding;
  }
  function mutate() {
    observers.forEach((observer) => observer.callback([]));
  }
  function runFrames() {
    frames.splice(0).forEach((callback) => callback());
  }
  return { window, observers, mutate, runFrames };
}

function createFakeTrace() {
  const unsubscribe = jest.fn();
  const trace = { subscribe: jest.fn(() => unsubscribe) };
  return { getTrace: jest.fn(() => trace), trace, unsubscribe };
}

test('startJourneyObserver does nothing in a developer tab, where there is no binding', () => {
  const { window, observers } = createFakeWindow();
  const { getTrace, trace } = createFakeTrace();
  const stop = startJourneyObserver({
    window,
    lowdefy: { pageId: 'home' },
    getTrace,
    collectVisibleBlockIds: jest.fn(() => ['a']),
  });
  expect(stop).toBeNull();
  expect(trace.subscribe).not.toHaveBeenCalled();
  expect(observers).toHaveLength(0);
});

test('startJourneyObserver forwards completed events and each newly visible block once', () => {
  const binding = jest.fn(async () => {});
  const { window, observers, mutate, runFrames } = createFakeWindow({ binding });
  const { getTrace, trace, unsubscribe } = createFakeTrace();
  const lowdefy = { pageId: 'home' };
  let visible = ['home_title'];
  const stop = startJourneyObserver({
    window,
    lowdefy,
    getTrace,
    collectVisibleBlockIds: () => visible,
  });
  expect(getTrace).toHaveBeenCalledWith(lowdefy);
  // Subscribed without state: the observer never reads it.
  expect(trace.subscribe.mock.calls[0]).toHaveLength(1);
  expect(binding).toHaveBeenCalledWith({
    kind: 'rendered',
    pageId: 'home',
    blockIds: ['home_title'],
  });

  const listener = trace.subscribe.mock.calls[0][0];
  listener({
    scope: 'page',
    pageId: 'home',
    blockId: 'save_button',
    blockType: 'Button',
    eventName: 'onClick',
    actions: [{ id: 'save' }, { id: 'set_saved' }],
    record: {},
  });
  expect(binding).toHaveBeenLastCalledWith({
    kind: 'event',
    scope: 'page',
    pageId: 'home',
    blockId: 'save_button',
    eventName: 'onClick',
    actionIds: ['save', 'set_saved'],
  });

  // Two changes before the next frame sample once; only the new block is sent.
  visible = ['home_title', 'flash_alert'];
  mutate();
  mutate();
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  runFrames();
  expect(binding).toHaveBeenLastCalledWith({
    kind: 'rendered',
    pageId: 'home',
    blockIds: ['flash_alert'],
  });
  const calls = binding.mock.calls.length;
  mutate();
  runFrames();
  expect(binding.mock.calls).toHaveLength(calls);

  stop();
  expect(unsubscribe).toHaveBeenCalled();
  expect(observers[0].disconnect).toHaveBeenCalled();
});

test('startJourneyObserver keeps the app running when the binding or a payload throws', () => {
  const binding = jest.fn(() => {
    throw new Error('context closed');
  });
  const { window } = createFakeWindow({ binding });
  const { getTrace, trace } = createFakeTrace();
  startJourneyObserver({
    window,
    lowdefy: { pageId: 'home' },
    getTrace,
    collectVisibleBlockIds: () => ['a'],
  });
  const listener = trace.subscribe.mock.calls[0][0];
  expect(() => listener(null)).not.toThrow();
  expect(() => listener({ scope: 'page', actions: [] })).not.toThrow();
});
