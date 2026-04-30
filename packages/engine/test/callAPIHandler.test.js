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

import { expect, jest } from '@jest/globals';

import callAPIHandler from '../src/callAPIHandler.js';

function createContext({ callAPI }) {
  return {
    pageId: 'page1',
    _internal: {
      update: jest.fn(),
      lowdefy: {
        apiResponses: {},
        _internal: {
          callAPI,
        },
      },
    },
  };
}

test('callAPIHandler stores response and resolves', async () => {
  const callAPI = jest
    .fn()
    .mockResolvedValue({ response: { items: [1, 2] }, status: 'success', success: true });
  const context = createContext({ callAPI });
  await callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {} },
  });
  expect(context._internal.lowdefy.apiResponses.ep_one[0]).toMatchObject({
    blockId: 'block_id',
    endpointId: 'ep_one',
    loading: false,
    response: { items: [1, 2] },
    status: 'success',
    success: true,
  });
  expect(context._internal.lowdefy.apiResponses.ep_one[0].holdValue).toBeUndefined();
});

test('callAPIHandler holdValue keeps previous response while loading', async () => {
  let resolveSecond;
  const callAPI = jest
    .fn()
    .mockResolvedValueOnce({ response: { items: [1, 2] }, status: 'success', success: true })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = () =>
            resolve({ response: { items: [3, 4] }, status: 'success', success: true });
        })
    );
  const context = createContext({ callAPI });

  await callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {} },
  });
  expect(context._internal.lowdefy.apiResponses.ep_one[0].response).toEqual({ items: [1, 2] });

  const promise = callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {}, holdValue: true },
  });

  const inFlight = context._internal.lowdefy.apiResponses.ep_one[0];
  expect(inFlight.loading).toBe(true);
  expect(inFlight.holdValue).toBe(true);
  expect(inFlight.response).toEqual({ items: [1, 2] });

  resolveSecond();
  await promise;
  expect(context._internal.lowdefy.apiResponses.ep_one[0].response).toEqual({ items: [3, 4] });
  expect(context._internal.lowdefy.apiResponses.ep_one[0].loading).toBe(false);
});

test('callAPIHandler holdValue with no previous response leaves response null', async () => {
  let resolveCall;
  const callAPI = jest.fn().mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveCall = () =>
          resolve({ response: { hello: 'world' }, status: 'success', success: true });
      })
  );
  const context = createContext({ callAPI });
  const promise = callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {}, holdValue: true },
  });
  const inFlight = context._internal.lowdefy.apiResponses.ep_one[0];
  expect(inFlight.loading).toBe(true);
  expect(inFlight.holdValue).toBe(true);
  expect(inFlight.response).toBe(null);
  resolveCall();
  await promise;
});

test('callAPIHandler holdValue retains previous response on error', async () => {
  const callAPI = jest
    .fn()
    .mockResolvedValueOnce({ response: { items: [1, 2] }, status: 'success', success: true })
    .mockRejectedValueOnce(new Error('mock error'));
  const context = createContext({ callAPI });

  await callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {} },
  });
  expect(context._internal.lowdefy.apiResponses.ep_one[0].response).toEqual({ items: [1, 2] });

  await expect(
    callAPIHandler(context, {
      blockId: 'block_id',
      params: { endpointId: 'ep_one', payload: {}, holdValue: true },
    })
  ).rejects.toThrow('mock error');

  const entry = context._internal.lowdefy.apiResponses.ep_one[0];
  expect(entry.loading).toBe(false);
  expect(entry.holdValue).toBe(true);
  expect(entry.response).toEqual({ items: [1, 2] });
  expect(entry.error).toEqual(new Error('mock error'));
  expect(entry.status).toBe('error');
  expect(entry.success).toBe(false);
});

test('callAPIHandler without holdValue clears response on error', async () => {
  const callAPI = jest
    .fn()
    .mockResolvedValueOnce({ response: { items: [1, 2] }, status: 'success', success: true })
    .mockRejectedValueOnce(new Error('mock error'));
  const context = createContext({ callAPI });

  await callAPIHandler(context, {
    blockId: 'block_id',
    params: { endpointId: 'ep_one', payload: {} },
  });

  await expect(
    callAPIHandler(context, {
      blockId: 'block_id',
      params: { endpointId: 'ep_one', payload: {} },
    })
  ).rejects.toThrow('mock error');

  const entry = context._internal.lowdefy.apiResponses.ep_one[0];
  expect(entry.response).toBe(null);
  expect(entry.holdValue).toBeUndefined();
});
