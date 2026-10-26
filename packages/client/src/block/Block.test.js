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

import React from 'react';
import { vi, beforeEach, expect, test } from 'vitest';
import { act, render } from '@testing-library/react';
import { createUpdaters } from '@lowdefy/engine';

const categorySwitchLoading = [];

vi.doMock('./CategorySwitch.js', () => ({
  default: ({ loading }) => {
    categorySwitchLoading.push(loading);
    return <span>{loading ? 'loading' : 'ready'}</span>;
  },
}));

const { default: Block } = await import('./Block.js');

function createBlock({ events, triggerEvent }) {
  return {
    id: 'button',
    blockId: 'button',
    type: 'Button',
    eval: { loading: false },
    Events: { events },
    triggerEvent,
  };
}

function renderBlock({ block, renderHead }) {
  const progress = { dispatch: vi.fn() };
  const lowdefy = { _internal: { progress } };
  const context = { _internal: { lowdefy, updaters: createUpdaters() } };
  const result = render(
    <Block
      block={block}
      Blocks={{}}
      context={context}
      lowdefy={lowdefy}
      parentLoading={false}
      renderHead={renderHead}
    />
  );
  return { ...result, context };
}

beforeEach(() => {
  categorySwitchLoading.length = 0;
});

test('Block without an onMount event renders not loading on its first render', async () => {
  const block = createBlock({ events: {}, triggerEvent: vi.fn(async () => {}) });
  const { container } = renderBlock({ block });
  expect(categorySwitchLoading[0]).toBe(false);
  await act(async () => {});
  expect(categorySwitchLoading).not.toContain(true);
  expect(container.textContent).toBe('ready');
});

test('Block with an onMount event renders loading until the event finishes', async () => {
  let finishMount;
  const triggerEvent = vi.fn(({ name }) => {
    if (name !== 'onMount') return Promise.resolve();
    return new Promise((resolve) => {
      finishMount = resolve;
    });
  });
  const block = createBlock({ events: { onMount: { actions: [] } }, triggerEvent });
  const { container } = renderBlock({ block });
  expect(categorySwitchLoading[0]).toBe(true);
  await act(async () => {});
  expect(container.textContent).toBe('loading');
  await act(async () => {
    finishMount();
  });
  expect(container.textContent).toBe('ready');
});

test('Block renders the head again with the new properties when the block updates', async () => {
  const block = createBlock({ events: {}, triggerEvent: vi.fn(async () => {}) });
  block.eval = { loading: false, properties: { title: 'Task' } };
  const renderHead = ({ properties }) => <title>{properties.title}</title>;
  const { container, context } = renderBlock({ block, renderHead });
  expect(container.querySelector('title').textContent).toBe('Task');
  await act(async () => {
    block.eval = { loading: false, properties: { title: 'Loaded task' } };
    context._internal.updaters.update('button');
  });
  expect(container.querySelector('title').textContent).toBe('Loaded task');
});

test('Block unregisters its updater when it unmounts', async () => {
  const block = createBlock({ events: {}, triggerEvent: vi.fn(async () => {}) });
  const { context, unmount } = renderBlock({ block });
  await act(async () => {});
  const renders = categorySwitchLoading.length;
  unmount();
  context._internal.updaters.update('button');
  expect(categorySwitchLoading).toHaveLength(renders);
});

function trackRegistrations(updaters) {
  const live = new Set();
  const { register } = updaters;
  updaters.register = (blockId, updater) => {
    const entry = { blockId, updater };
    live.add(entry);
    const unregister = register(blockId, updater);
    return () => {
      live.delete(entry);
      unregister();
    };
  };
  return live;
}

class Catch extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <span>failed</span> : this.props.children;
  }
}

function Thrower() {
  throw new Error('discarded');
}

test('Block that renders but never commits does not keep its updater', async () => {
  vi.useFakeTimers();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const block = createBlock({ events: {}, triggerEvent: vi.fn(async () => {}) });
    const progress = { dispatch: vi.fn() };
    const lowdefy = { _internal: { progress } };
    const updaters = createUpdaters();
    const live = trackRegistrations(updaters);
    const context = { _internal: { lowdefy, updaters } };
    const { container } = render(
      <Catch>
        <Block
          block={block}
          Blocks={{}}
          context={context}
          lowdefy={lowdefy}
          parentLoading={false}
        />
        <Thrower />
      </Catch>
    );
    expect(container.textContent).toBe('failed');
    // React retries a failed render once, so more than one discarded render can register.
    expect(live.size).toBeGreaterThan(0);
    vi.advanceTimersByTime(5000);
    expect(live.size).toBe(0);
  } finally {
    consoleError.mockRestore();
    vi.useRealTimers();
  }
});

test('Block keeps one updater after it commits and removes it on unmount', async () => {
  vi.useFakeTimers();
  try {
    const block = createBlock({ events: {}, triggerEvent: vi.fn(async () => {}) });
    const { context, unmount } = renderBlock({ block });
    const live = trackRegistrations(context._internal.updaters);
    vi.advanceTimersByTime(5000);
    // The render registration happened before tracking; the committed copy is the same updater
    // in the engine's set, and an update still reaches it after the timer passed.
    await act(async () => {
      context._internal.updaters.update('button');
    });
    expect(categorySwitchLoading.length).toBeGreaterThan(1);
    unmount();
    categorySwitchLoading.length = 0;
    context._internal.updaters.update('button');
    expect(categorySwitchLoading).toEqual([]);
    expect(live.size).toBeLessThanOrEqual(1);
  } finally {
    vi.useRealTimers();
  }
});
