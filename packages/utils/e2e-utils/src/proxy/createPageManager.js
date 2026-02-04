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

import { getBlock } from '../core/locators.js';
import { waitForReady, waitForPage } from '../core/navigation.js';
import { getState, getBlockState, setState, expectState } from '../core/state.js';
import { getRequestResponse, expectRequest } from '../core/requests.js';
import { getValidation } from '../core/validation.js';
import { expectUrl, expectUrlQuery, setUrlQuery } from '../core/url.js';

import createBlockProxy from './createBlockProxy.js';

function createPageManager({ page, manifest, helperRegistry, mockManager }) {
  let currentBlockMap = null;
  let currentPageId = null;

  function ensurePageLoaded() {
    if (!currentBlockMap) {
      throw new Error('Call goto() before accessing blocks');
    }
  }

  return {
    // Navigation (control flow)
    async goto(path) {
      await page.goto(path);
      await waitForReady(page);
      currentPageId = await page.evaluate(() => window.lowdefy?.pageId);
      currentBlockMap = manifest.pages[currentPageId];
      if (!currentBlockMap) {
        const available = Object.keys(manifest.pages).join(', ');
        throw new Error(
          `Page "${currentPageId}" not found in manifest. Available pages: ${available || '(none)'}`
        );
      }
    },

    async waitForPage(path) {
      await waitForPage(page, path);
      currentPageId = await page.evaluate(() => window.lowdefy?.pageId);
      currentBlockMap = manifest.pages[currentPageId];
    },

    get pageId() {
      return currentPageId;
    },

    // Actions (ldf.do.*)
    do: {
      get blocks() {
        ensurePageLoaded();
        return createBlockProxy({
          page,
          blockMap: currentBlockMap,
          helperRegistry,
          mode: 'do',
        });
      },
      state: (params) => setState(page, params),
      urlQuery: (params) => setUrlQuery(page, params),
    },

    // Assertions (ldf.expect.*)
    expect: {
      // Page-level assertions
      state: (params) => expectState(page, params),
      url: (params) => expectUrl(page, params),
      urlQuery: (params) => expectUrlQuery(page, params),
      request: (params) => expectRequest(page, params, mockManager),

      // Block-level assertions
      get blocks() {
        ensurePageLoaded();
        return createBlockProxy({
          page,
          blockMap: currentBlockMap,
          helperRegistry,
          mode: 'expect',
        });
      },
    },

    // Read operations (ldf.get.*)
    get: {
      state: () => getState(page),
      blockState: (params) => getBlockState(page, params),
      validation: (params) => getValidation(page, params.blockId),
      requestResponse: (params) => getRequestResponse(page, params),
    },

    // Direct block locator access (for custom assertions)
    block: (blockId) => getBlock(page, blockId),

    // Mocking (per-test overrides)
    mock: {
      request: (requestId, options) => mockManager?.mockRequest(requestId, options),
      api: (apiId, options) => mockManager?.mockApi(apiId, options),
      getCapturedRequest: (requestId) => mockManager?.getCapturedRequest(requestId),
      clearCapturedRequests: () => mockManager?.clearCapturedRequests(),
    },
  };
}

export default createPageManager;
