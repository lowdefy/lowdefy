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

const createTracePayload = jest.fn(({ record }) => ({ success: record.success, record }));

jest.unstable_mockModule('../src/trace/createTracePayload.js', () => ({
  default: createTracePayload,
}));

console.error = () => {};

function failingCallAPI() {
  throw new Error('Timed out.');
}

async function setup(onClick) {
  const { default: testContext } = await import('./testContext.js');
  const context = await testContext({
    lowdefy: { pageId: 'one', _internal: { actions: { CallAPI: failingCallAPI } } },
    pageConfig: {
      id: 'root',
      type: 'Box',
      blocks: [{ id: 'button', type: 'Button', events: { onClick } }],
    },
  });
  return context._internal.RootSlots.map.button;
}

beforeEach(() => {
  createTracePayload.mockClear();
});

test('a successful event with nobody subscribed does not build a trace payload', async () => {
  const button = await setup([{ id: 'set', type: 'SetState', params: { clicked: true } }]);
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(true);
  expect(createTracePayload).not.toHaveBeenCalled();
});

test('a failed event with nobody subscribed builds a payload to hold', async () => {
  const button = await setup([{ id: 'load', type: 'CallAPI', params: { endpointId: 'x' } }]);
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(false);
  expect(createTracePayload).toHaveBeenCalledTimes(1);
});
