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

import trackActionMethods from './trackActionMethods.js';

function createContext() {
  return { _internal: { DependencyTracker: { requireFullUpdate: vi.fn() } } };
}

test('trackActionMethods leaves callAPI to report its own api change', async () => {
  const context = createContext();
  const callAPI = vi.fn().mockResolvedValue({ success: true });
  const tracked = trackActionMethods({ context, methods: { callAPI } });
  await tracked.callAPI({ endpointId: 'ep_one' });
  expect(callAPI).toHaveBeenCalledWith({ endpointId: 'ep_one' });
  expect(context._internal.DependencyTracker.requireFullUpdate).not.toHaveBeenCalled();
});

test('trackActionMethods makes a method that does not report its changes ask for a full pass', async () => {
  const context = createContext();
  const callMethod = vi.fn().mockResolvedValue(undefined);
  const tracked = trackActionMethods({ context, methods: { callMethod } });
  await tracked.callMethod({ blockId: 'a', method: 'start' });
  expect(context._internal.DependencyTracker.requireFullUpdate).toHaveBeenCalledTimes(2);
});
