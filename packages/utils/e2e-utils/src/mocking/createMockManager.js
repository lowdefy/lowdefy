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

function createMockManager({ page }) {
  const activeMocks = new Map();
  const capturedRequests = new Map();

  async function mockRequest(requestId, { response, error }) {
    const key = `request:${requestId}`;

    if (activeMocks.has(key)) {
      await page.unroute(activeMocks.get(key).pattern);
    }

    const pattern = `**/api/request/*/${requestId}`;
    const handler = async (route) => {
      // Capture the request body for assertions
      const postData = route.request().postData();
      let payload = null;
      if (postData) {
        try {
          const parsed = JSON.parse(postData);
          payload = parsed.payload;
        } catch {
          payload = postData;
        }
      }
      capturedRequests.set(requestId, {
        payload,
        timestamp: Date.now(),
      });

      if (error) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: error }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, response }),
        });
      }
    };

    await page.route(pattern, handler);
    activeMocks.set(key, { pattern, handler });
  }

  async function mockApi(apiId, { response, error, method }) {
    const key = `api:${apiId}`;

    if (activeMocks.has(key)) {
      await page.unroute(activeMocks.get(key).pattern);
    }

    const pattern = `**/api/endpoints/${apiId}`;
    const handler = async (route) => {
      if (method && route.request().method() !== method.toUpperCase()) {
        await route.continue();
        return;
      }

      if (error) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: error }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, response }),
        });
      }
    };

    await page.route(pattern, handler);
    activeMocks.set(key, { pattern, handler });
  }

  async function applyStaticMocks(mocks) {
    for (const [id, config] of Object.entries(mocks ?? {})) {
      if (config.type === 'api') {
        await mockApi(id, config);
      } else {
        await mockRequest(id, config);
      }
    }
  }

  async function cleanup() {
    for (const { pattern } of activeMocks.values()) {
      await page.unroute(pattern);
    }
    activeMocks.clear();
  }

  function getCapturedRequest(requestId) {
    return capturedRequests.get(requestId) ?? null;
  }

  function clearCapturedRequests() {
    capturedRequests.clear();
  }

  return {
    mockRequest,
    mockApi,
    applyStaticMocks,
    cleanup,
    getCapturedRequest,
    clearCapturedRequests,
  };
}

export default createMockManager;
