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

async function getApiState(page, endpointId) {
  return page.evaluate((id) => {
    const lowdefy = window.lowdefy;
    return lowdefy?.apiResponses?.[id]?.[0];
  }, endpointId);
}

async function getApiResponse(page, { endpointId }) {
  const state = await getApiState(page, endpointId);
  return state?.response;
}

async function expectApi(page, { endpointId, loading, response, payload, timeout = 30000 }) {
  if (loading !== undefined) {
    await expect
      .poll(
        async () => {
          const state = await getApiState(page, endpointId);
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
          const state = await getApiState(page, endpointId);
          return state?.response;
        },
        { timeout }
      )
      .toEqual(expect.objectContaining(response));
  }

  if (payload !== undefined) {
    await expect
      .poll(
        async () => {
          const state = await getApiState(page, endpointId);
          return state?.payload;
        },
        { timeout }
      )
      .toEqual(expect.objectContaining(payload));
  }
}

export { getApiState, getApiResponse, expectApi };
