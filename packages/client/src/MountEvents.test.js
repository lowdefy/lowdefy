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

import MountEvents from './MountEvents.js';

function renderMountEvents({ triggerEvent, waitForMount }) {
  const renders = [];
  const triggerEventAsync = jest.fn();
  const result = render(
    <MountEvents
      context={{}}
      triggerEvent={triggerEvent}
      triggerEventAsync={triggerEventAsync}
      waitForMount={waitForMount}
    >
      {(loading) => {
        renders.push(loading);
        return <span>{loading ? 'loading' : 'ready'}</span>;
      }}
    </MountEvents>
  );
  return { renders, triggerEventAsync, ...result };
}

test('MountEvents never renders loading when it does not wait for the mount event', async () => {
  const triggerEvent = jest.fn(async () => {});
  const { renders, triggerEventAsync, container } = renderMountEvents({
    triggerEvent,
    waitForMount: false,
  });
  await act(async () => {});
  expect(renders[0]).toBe(false);
  expect(renders).not.toContain(true);
  expect(container.textContent).toBe('ready');
  expect(triggerEvent).toHaveBeenCalledTimes(1);
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});

test('MountEvents renders loading until the mount event finishes when it waits for it', async () => {
  let finishMount;
  const triggerEvent = jest.fn(
    () =>
      new Promise((resolve) => {
        finishMount = resolve;
      })
  );
  const { renders, triggerEventAsync, container } = renderMountEvents({
    triggerEvent,
    waitForMount: true,
  });
  await act(async () => {});
  expect(renders[0]).toBe(true);
  expect(container.textContent).toBe('loading');
  expect(triggerEventAsync).not.toHaveBeenCalled();
  await act(async () => {
    finishMount();
  });
  expect(container.textContent).toBe('ready');
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});
