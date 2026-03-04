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

import { expect } from '@playwright/test';

async function getRequestState(page, requestId) {
  return page.evaluate((reqId) => {
    const lowdefy = window.lowdefy;
    const pageId = lowdefy?.pageId;
    const requests = lowdefy?.contexts?.[`page:${pageId}`]?.requests?.[reqId];
    return requests?.[0];
  }, requestId);
}

async function getRequestResponse(page, { requestId }) {
  const state = await getRequestState(page, requestId);
  return state?.response;
}

async function expectRequest(page, { requestId, loading, response, payload, timeout = 30000 }) {
  if (loading !== undefined) {
    await expect
      .poll(
        async () => {
          const state = await getRequestState(page, requestId);
          return state?.loading;
        },
        { timeout }
      )
      .toBe(loading);
  }

  if (response !== undefined) {
    await expect
      .poll(
        async () => {
          const state = await getRequestState(page, requestId);
          return state?.response;
        },
        { timeout }
      )
      .toEqual(expect.objectContaining(response));
  }

  // Payload is stored in the request state by the Lowdefy engine.
  // It's the evaluated payload from the request config (client-side).
  if (payload !== undefined) {
    await expect
      .poll(
        async () => {
          const state = await getRequestState(page, requestId);
          return state?.payload;
        },
        { timeout }
      )
      .toEqual(expect.objectContaining(payload));
  }
}

export { getRequestState, getRequestResponse, expectRequest };
