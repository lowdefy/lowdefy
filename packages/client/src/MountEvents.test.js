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
import { render, waitFor } from '@testing-library/react';

import MountEvents from './MountEvents.js';

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  delete window.__lowdefy_page_ready;
  delete window.__lowdefy_page_id;
});

test('page_ready is false during init and true once onInit completes', async () => {
  const onInit = deferred();
  const triggerEvent = jest.fn(() => onInit.promise);
  const triggerEventAsync = jest.fn();

  render(
    <MountEvents
      context={{ id: 'context-1' }}
      pageId="page-1"
      triggerEvent={triggerEvent}
      triggerEventAsync={triggerEventAsync}
    >
      {(loading) => <div>{loading ? 'loading' : 'ready'}</div>}
    </MountEvents>
  );

  // During init the flag is false and the loading skeleton is shown.
  expect(window.__lowdefy_page_ready).toBe(false);

  onInit.resolve();

  await waitFor(() => expect(window.__lowdefy_page_ready).toBe(true));
  expect(triggerEventAsync).toHaveBeenCalled();
});

test('page_id is set to the current pageId on mount', () => {
  render(
    <MountEvents
      context={{ id: 'context-1' }}
      pageId="page-1"
      triggerEvent={() => Promise.resolve()}
      triggerEventAsync={() => undefined}
    >
      {() => null}
    </MountEvents>
  );

  expect(window.__lowdefy_page_id).toBe('page-1');
});

test('navigation resets page_ready to false then re-sets it to true', async () => {
  const firstInit = deferred();
  const secondInit = deferred();
  const triggerEvent = jest
    .fn()
    .mockImplementationOnce(() => firstInit.promise)
    .mockImplementationOnce(() => secondInit.promise);
  const triggerEventAsync = jest.fn();

  const props = {
    triggerEvent,
    triggerEventAsync,
    children: (loading) => <div>{loading ? 'loading' : 'ready'}</div>,
  };

  const { rerender } = render(
    <MountEvents context={{ id: 'context-1' }} pageId="page-1" {...props} />
  );

  expect(window.__lowdefy_page_ready).toBe(false);
  firstInit.resolve();
  await waitFor(() => expect(window.__lowdefy_page_ready).toBe(true));

  // Navigate to another page — a new context resets the lifecycle.
  rerender(<MountEvents context={{ id: 'context-2' }} pageId="page-2" {...props} />);

  await waitFor(() => expect(window.__lowdefy_page_ready).toBe(false));
  expect(window.__lowdefy_page_id).toBe('page-2');

  secondInit.resolve();
  await waitFor(() => expect(window.__lowdefy_page_ready).toBe(true));
});
