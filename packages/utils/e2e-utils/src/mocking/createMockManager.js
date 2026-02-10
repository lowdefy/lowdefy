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

  async function mockRequest(requestId, { response, error, pageId }) {
    const key = pageId ? `request:${pageId}:${requestId}` : `request:${requestId}`;

    if (activeMocks.has(key)) {
      await page.unroute(activeMocks.get(key).pattern);
    }

    // If pageId is provided, match only that page's requests
    // Otherwise, match all pages (wildcard)
    const pattern = pageId
      ? `**/api/request/${pageId}/${requestId}`
      : `**/api/request/*/${requestId}`;
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
          body: JSON.stringify({ name: 'Error', message: error }),
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
          body: JSON.stringify({ name: 'Error', message: error }),
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
    // New format: { requests: [...], api: [...] }
    const { requests = [], api = [] } = mocks ?? {};

    // Apply request mocks
    for (const config of requests) {
      // Playwright glob: * matches single segment, ** matches multiple
      // User wildcards like fetch_* should stay as-is (matches fetch_users, fetch_items)
      const requestPattern = config.requestId;
      const pagePattern = config.pageId ?? '*';

      const pattern = `**/api/request/${pagePattern}/${requestPattern}`;
      const key = `static:request:${config.pageId ?? '*'}:${config.requestId}`;

      const handler = async (route) => {
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
        capturedRequests.set(config.requestId, {
          payload,
          timestamp: Date.now(),
        });

        if (config.error) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ name: 'Error', message: config.error }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: config.response }),
          });
        }
      };

      await page.route(pattern, handler);
      activeMocks.set(key, { pattern, handler });
    }

    // Apply API mocks
    for (const config of api) {
      const pattern = `**/api/endpoints/${config.endpointId}`;
      const key = `static:api:${config.endpointId}`;

      const handler = async (route) => {
        if (config.method && route.request().method() !== config.method.toUpperCase()) {
          await route.continue();
          return;
        }

        if (config.error) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ name: 'Error', message: config.error }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: config.response }),
          });
        }
      };

      await page.route(pattern, handler);
      activeMocks.set(key, { pattern, handler });
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
