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
import { jest } from '@jest/globals';
import { act, render } from '@testing-library/react';

const categorySwitchLoading = [];

jest.unstable_mockModule('./CategorySwitch.js', () => ({
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

function renderBlock({ block }) {
  const progress = { dispatch: jest.fn() };
  const lowdefy = { _internal: { progress } };
  const context = { _internal: { lowdefy, updaters: {} } };
  return render(
    <Block block={block} Blocks={{}} context={context} lowdefy={lowdefy} parentLoading={false} />
  );
}

beforeEach(() => {
  categorySwitchLoading.length = 0;
});

test('Block without an onMount event renders not loading on its first render', async () => {
  const block = createBlock({ events: {}, triggerEvent: jest.fn(async () => {}) });
  const { container } = renderBlock({ block });
  expect(categorySwitchLoading[0]).toBe(false);
  await act(async () => {});
  expect(categorySwitchLoading).not.toContain(true);
  expect(container.textContent).toBe('ready');
});

test('Block with an onMount event renders loading until the event finishes', async () => {
  let finishMount;
  const triggerEvent = jest.fn(({ name }) => {
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
