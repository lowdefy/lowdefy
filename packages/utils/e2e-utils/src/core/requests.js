/*
  Copyright 2020-2024 Lowdefy, Inc

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

function objectContains(actual, expected) {
  if (actual === expected) return true;
  if (actual == null || expected == null) return false;
  if (typeof expected !== 'object') return actual === expected;

  for (const key of Object.keys(expected)) {
    if (!objectContains(actual[key], expected[key])) {
      return false;
    }
  }
  return true;
}

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
  await expect
    .poll(
      async () => {
        const state = await getRequestState(page, requestId);
        if (!state) return { error: 'Request not found' };

        if (loading !== undefined && state.loading !== loading) {
          return { loading: state.loading };
        }

        if (response !== undefined) {
          const matches = JSON.stringify(state.response) === JSON.stringify(response);
          if (!matches) return { response: state.response };
        }

        // Payload is stored in the request state by the Lowdefy engine.
        // It's the evaluated payload from the request config (client-side).
        if (payload !== undefined) {
          const payloadMatches = objectContains(state.payload, payload);
          if (!payloadMatches) return { payload: state.payload };
        }

        return true;
      },
      { timeout }
    )
    .toBe(true);
}

export { getRequestState, getRequestResponse, expectRequest };
