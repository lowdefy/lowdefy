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

import scheduleBackground from './scheduleBackground.js';

const endpointConfig = {
  endpointId: 'bg_ep',
  '~k': 'endpoint:bg_ep',
};

function createContext() {
  return {
    rid: 'r1',
    pageId: 'p1',
    blockId: 'b1',
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      eventsConfig: { level: 'all' },
    },
  };
}

test('scheduleBackground emits endpoint_completed when an async endpoint routine returns', async () => {
  const context = createContext();
  await scheduleBackground(
    context,
    { endpointConfig, event: 'background_endpoint', endpointId: 'bg_ep' },
    async () => ({ error: null, status: 'return' })
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'endpoint_completed',
      endpoint_id: 'bg_ep',
      entry: 'background',
      config_key: 'endpoint:bg_ep',
      status: 'return',
      success: true,
      duration_ms: expect.any(Number),
    })
  );
});

test('scheduleBackground emits endpoint_failed when the async routine rejects', async () => {
  const context = createContext();
  await scheduleBackground(
    context,
    { endpointConfig, event: 'background_endpoint', endpointId: 'bg_ep' },
    async () => {
      throw new Error('boom');
    }
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'endpoint_failed',
      endpoint_id: 'bg_ep',
      entry: 'background',
      status: 'error',
      success: false,
      error: expect.objectContaining({ message: 'boom' }),
    }),
    'boom'
  );
});

test('scheduleBackground emits endpoint_failed when the routine returns an error status', async () => {
  const context = createContext();
  const error = new Error('step failed');
  await scheduleBackground(
    context,
    { endpointConfig, event: 'background_endpoint', endpointId: 'bg_ep' },
    async () => ({ error, status: 'error' })
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'endpoint_failed', success: false }),
    'step failed'
  );
});

test('scheduleBackground emits no endpoint event for background work that is not an endpoint run', async () => {
  const context = createContext();
  await scheduleBackground(
    context,
    { event: 'detached_dispatch', endpointId: 'child_ep' },
    async () => ({
      status: 200,
    })
  );
  expect(context.logger.info).toHaveBeenCalledTimes(1);
  expect(context.logger.info).toHaveBeenCalledWith({
    event: 'detached_dispatch_done',
    endpointId: 'child_ep',
    status: 200,
  });
});
