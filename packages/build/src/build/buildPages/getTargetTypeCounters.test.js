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

import { expect, test } from 'vitest';
import getTargetTypeCounters from './getTargetTypeCounters.js';
import testContext from '../../test-utils/testContext.js';

test('getTargetTypeCounters returns the web counters for a web page', () => {
  const context = testContext();
  expect(getTargetTypeCounters({ target: 'web', context })).toBe(context.typeCounters);
});

test('getTargetTypeCounters returns the mobile counters for a mobile page', () => {
  const context = testContext();
  expect(getTargetTypeCounters({ target: 'mobile', context })).toBe(context.typeCountersMobile);
});

test('the mobile counters share the server-side counters with the web counters', () => {
  const context = testContext();
  const mobile = context.typeCountersMobile;
  expect(mobile.requests).toBe(context.typeCounters.requests);
  expect(mobile.connections).toBe(context.typeCounters.connections);
  expect(mobile.operators.server).toBe(context.typeCounters.operators.server);
  expect(mobile.blocks).not.toBe(context.typeCounters.blocks);
  expect(mobile.actions).not.toBe(context.typeCounters.actions);
  expect(mobile.operators.client).not.toBe(context.typeCounters.operators.client);
});

test('getTargetTypeCounters counts a shared page into the web and the mobile counters', () => {
  const context = testContext();
  const counters = getTargetTypeCounters({ target: 'both', context });
  counters.blocks.increment('Title', 'k1');
  counters.actions.increment('SetState', 'k2');
  counters.operators.client.increment('_state', 'k3');
  counters.requests.increment('AxiosHttp', 'k4');
  expect(context.typeCounters.blocks.getCounts()).toEqual({ Title: 1 });
  expect(context.typeCountersMobile.blocks.getCounts()).toEqual({ Title: 1 });
  expect(context.typeCounters.actions.getCounts()).toEqual({ SetState: 1 });
  expect(context.typeCountersMobile.actions.getCounts()).toEqual({ SetState: 1 });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({ _state: 1 });
  expect(context.typeCountersMobile.operators.client.getCounts()).toEqual({ _state: 1 });
  expect(context.typeCounters.requests.getCounts()).toEqual({ AxiosHttp: 1 });
});
