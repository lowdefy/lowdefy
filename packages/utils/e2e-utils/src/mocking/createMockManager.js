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

import { serializer } from '@lowdefy/helpers';

async function fulfillRoute(route, { response, error }) {
  if (error) {
    const errorObj = error instanceof Error ? error : new Error(error);
    const serialized = serializer.serialize(errorObj);
    if (serialized?.['~e']) {
      delete serialized['~e'].received;
      delete serialized['~e'].stack;
      delete serialized['~e'].configKey;
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(serialized),
    });
  } else {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, response: serializer.serialize(response) }),
    });
  }
}

function capturePayload(route) {
  const postData = route.request().postData();
  if (!postData) return null;
  try {
    const parsed = JSON.parse(postData);
    return parsed.payload;
  } catch {
    return postData;
  }
}

function createMockManager({ page }) {
  const activeMocks = new Map();
  const capturedRequests = new Map();

  async function registerRoute(key, pattern, handler) {
    if (activeMocks.has(key)) {
      await page.unroute(activeMocks.get(key).pattern);
    }
    await page.route(pattern, handler);
    activeMocks.set(key, { pattern, handler });
  }

  async function mockRequest(requestId, { response, error, pageId }) {
    const key = pageId ? `request:${pageId}:${requestId}` : `request:${requestId}`;
    // If pageId is provided, match only that page's requests
    // Otherwise, match all pages (wildcard)
    const pattern = pageId
      ? `**/api/request/${pageId}/${requestId}`
      : `**/api/request/*/${requestId}`;

    const captureKey = pageId ? `${pageId}:${requestId}` : requestId;
    const handler = async (route) => {
      capturedRequests.set(captureKey, {
        payload: capturePayload(route),
        timestamp: Date.now(),
      });
      await fulfillRoute(route, { response, error });
    };

    await registerRoute(key, pattern, handler);
  }

  async function mockApi(apiId, { response, error, method }) {
    const key = `api:${apiId}`;
    const pattern = `**/api/endpoints/${apiId}`;

    const handler = async (route) => {
      if (method && route.request().method() !== method.toUpperCase()) {
        await route.continue();
        return;
      }
      await fulfillRoute(route, { response, error });
    };

    await registerRoute(key, pattern, handler);
  }

  async function applyStaticMocks(mocks) {
    const { requests = [], api = [] } = mocks ?? {};

    for (const config of requests) {
      // Playwright glob: * matches single segment, ** matches multiple
      // User wildcards like fetch_* should stay as-is (matches fetch_users, fetch_items)
      const pagePattern = config.pageId ?? '*';
      const pattern = `**/api/request/${pagePattern}/${config.requestId}`;
      const key = `static:request:${config.pageId ?? '*'}:${config.requestId}`;

      const captureKey = config.pageId ? `${config.pageId}:${config.requestId}` : config.requestId;
      const handler = async (route) => {
        capturedRequests.set(captureKey, {
          payload: capturePayload(route),
          timestamp: Date.now(),
        });
        await fulfillRoute(route, { response: config.response, error: config.error });
      };

      await registerRoute(key, pattern, handler);
    }

    for (const config of api) {
      const pattern = `**/api/endpoints/${config.endpointId}`;
      const key = `static:api:${config.endpointId}`;

      const handler = async (route) => {
        if (config.method && route.request().method() !== config.method.toUpperCase()) {
          await route.continue();
          return;
        }
        await fulfillRoute(route, { response: config.response, error: config.error });
      };

      await registerRoute(key, pattern, handler);
    }
  }

  async function cleanup() {
    for (const { pattern } of activeMocks.values()) {
      await page.unroute(pattern);
    }
    activeMocks.clear();
  }

  function getCapturedRequest(requestId, { pageId } = {}) {
    const captureKey = pageId ? `${pageId}:${requestId}` : requestId;
    return capturedRequests.get(captureKey) ?? null;
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
