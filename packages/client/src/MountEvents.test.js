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

test('renders children immediately for a prewarmed context without re-running onInit', () => {
  const triggerEvent = jest.fn();
  const triggerEventAsync = jest.fn();
  renderMountEvents({ onInitDone: true, triggerEvent, triggerEventAsync });

  expect(screen.getByText('ready')).toBeTruthy();
  expect(triggerEvent).not.toHaveBeenCalled();
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});

test('blanks during onInit then renders children when the context is not prewarmed', async () => {
  const triggerEvent = jest.fn().mockResolvedValue(undefined);
  const triggerEventAsync = jest.fn();
  renderMountEvents({ onInitDone: false, triggerEvent, triggerEventAsync });

  expect(screen.getByText('loading')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  expect(triggerEvent).toHaveBeenCalledTimes(1);
  expect(triggerEventAsync).toHaveBeenCalledTimes(1);
});
