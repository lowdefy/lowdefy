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

import isNetworkError from './isNetworkError.js';
import withNetworkErrors from './withNetworkErrors.js';

test('a call the platform fetch rejects is marked as a network failure', async () => {
  const failure = new TypeError('Network request failed');
  const fetch = withNetworkErrors(jest.fn(async () => Promise.reject(failure)));
  const error = await fetch('https://app.example.com/api/user', {}).catch((caught) => caught);
  expect(error).toBe(failure);
  expect(isNetworkError(error)).toBe(true);
});

test('expo/fetch failures, which are not TypeErrors, are marked too', async () => {
  const failure = new Error('fetch failed: The Internet connection appears to be offline.');
  const fetch = withNetworkErrors(jest.fn(async () => Promise.reject(failure)));
  const error = await fetch('https://app.example.com/api/agent', {}).catch((caught) => caught);
  expect(isNetworkError(error)).toBe(true);
});

test('a call the caller aborted is not a network failure', async () => {
  const controller = new AbortController();
  controller.abort();
  const failure = new Error('The operation was aborted.');
  const fetch = withNetworkErrors(jest.fn(async () => Promise.reject(failure)));
  const error = await fetch('https://app.example.com/api/agent', {
    signal: controller.signal,
  }).catch((caught) => caught);
  expect(isNetworkError(error)).toBe(false);
});

test('a TypeError thrown after the answer arrived is not a network failure', async () => {
  const response = { ok: true, status: 200 };
  const fetch = withNetworkErrors(jest.fn(async () => response));
  const res = await fetch('https://app.example.com/api/user', {});
  expect(res).toBe(response);
  let fault;
  try {
    res.headers.get('etag');
  } catch (error) {
    fault = error;
  }
  expect(fault).toBeInstanceOf(TypeError);
  expect(isNetworkError(fault)).toBe(false);
});
