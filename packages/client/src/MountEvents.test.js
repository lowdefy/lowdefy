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
import { render, screen, waitFor } from '@testing-library/react';

import MountEvents from './MountEvents.js';

function renderMountEvents({ onInitDone, triggerEvent, triggerEventAsync }) {
  const context = { _internal: { onInitDone } };
  return render(
    <MountEvents
      context={context}
      triggerEvent={triggerEvent}
      triggerEventAsync={triggerEventAsync}
    >
      {(loading) => <span>{loading ? 'loading' : 'ready'}</span>}
    </MountEvents>
  );
}

test('blanks during the event then renders children once it resolves', async () => {
  const triggerEvent = jest.fn().mockResolvedValue(undefined);
  const triggerEventAsync = jest.fn();
  renderMountEvents({ onInitDone: false, triggerEvent, triggerEventAsync });

  expect(screen.getByText('loading')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  expect(triggerEvent).toHaveBeenCalledTimes(1);
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});

// Regression: MountEvents is shared by Context (page onInit) and Block (per-block
// onMount). It must always fire triggerEvent, regardless of the page context's
// onInitDone flag — gating on it skipped every block's onMount once the page had
// initialised (e.g. dashboards loading data in onMount rendered with no data).
test('fires triggerEvent even when the page context onInitDone is already true', async () => {
  const triggerEvent = jest.fn().mockResolvedValue(undefined);
  const triggerEventAsync = jest.fn();
  renderMountEvents({ onInitDone: true, triggerEvent, triggerEventAsync });

  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  expect(triggerEvent).toHaveBeenCalledTimes(1);
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});
