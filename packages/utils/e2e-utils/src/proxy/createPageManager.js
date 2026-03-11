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

import { getBlock } from '../core/locators.js';
import { waitForReady, waitForPage } from '../core/navigation.js';
import { getState, getBlockState, setState, expectState } from '../core/state.js';
import { getRequestState, getRequestResponse, expectRequest } from '../core/requests.js';
import { getApiState, getApiResponse, expectApi } from '../core/api.js';
import { getValidation } from '../core/validation.js';
import { expectUrl, expectUrlQuery, setUrlQuery } from '../core/url.js';
import { setUserCookie, clearUserCookie } from '../core/userCookie.js';

import { get, type } from '@lowdefy/helpers';

import createBlockMethodProxy from './createBlockMethodProxy.js';

function createPageManager({ page, manifest, helperRegistry, mockManager }) {
  let currentBlockMap = null;
  let currentPageId = null;

  function ensurePageLoaded() {
    if (!currentBlockMap) {
      throw new Error('Call goto() before accessing blocks');
    }
  }

  return {
    // Raw Playwright page
    page,

    // User session (cookie-based, for server-e2e)
    async user(userObj) {
      if (type.isNone(userObj)) {
        await clearUserCookie(page);
        return;
      }
      await setUserCookie(page, userObj);
    },

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

    // Block locator - ldf.block('id').do.*/expect.*/locator()/state()/validation()
    block(blockId) {
      ensurePageLoaded();
      const blockInfo = currentBlockMap[blockId];
      if (!blockInfo) {
        const available = Object.keys(currentBlockMap).join(', ');
        throw new Error(
          `Block "${blockId}" not found on page. Available blocks: ${available || '(none)'}`
        );
      }

      return {
        do: createBlockMethodProxy({ page, blockId, blockInfo, helperRegistry, mode: 'do' }),
        expect: createBlockMethodProxy({
          page,
          blockId,
          blockInfo,
          helperRegistry,
          mode: 'expect',
        }),
        locator: () => getBlock(page, blockId),
        state: () => getBlockState(page, { blockId }),
        validation: () => getValidation(page, blockId),
      };
    },

    // Request locator - ldf.request('id').expect.*/response()/state()
    request(requestId) {
      return {
        expect: {
          toFinish: (opts) => expectRequest(page, { requestId, loading: false, ...opts }),
          toHaveResponse: (response, opts) => expectRequest(page, { requestId, response, ...opts }),
          toHavePayload: (payload, opts) => expectRequest(page, { requestId, payload, ...opts }),
        },
        response: () => getRequestResponse(page, { requestId }),
        state: () => getRequestState(page, requestId),
      };
    },

    // API endpoint locator - ldf.api('id').expect.*/response()/state()
    api(endpointId) {
      return {
        expect: {
          toFinish: (opts) => expectApi(page, { endpointId, loading: false, ...opts }),
          toHaveResponse: (response, opts) => expectApi(page, { endpointId, response, ...opts }),
          toHavePayload: (payload, opts) => expectApi(page, { endpointId, payload, ...opts }),
        },
        response: () => getApiResponse(page, { endpointId }),
        state: () => getApiState(page, endpointId),
      };
    },

    // State locator - ldf.state('key').do.*/expect.*/value() or ldf.state().value()
    state(key) {
      if (type.isNone(key)) {
        return {
          value: () => getState(page),
        };
      }

      return {
        do: {
          set: (value) => setState(page, { key, value }),
        },
        expect: {
          toBe: (value, opts) => expectState(page, { key, value, ...opts }),
        },
        value: () => getState(page).then((s) => get(s, key)),
      };
    },

    // URL locator - ldf.url().expect.*/value()
    url() {
      return {
        expect: {
          toBe: (path, opts) => expectUrl(page, { url: path, ...opts }),
          toMatch: (pattern, opts) => expectUrl(page, { url: pattern, ...opts }),
        },
        value: () => page.url(),
      };
    },

    // URL query locator - ldf.urlQuery('key').do.*/expect.*/value()
    urlQuery(key) {
      return {
        do: {
          set: (value) => setUrlQuery(page, { key, value }),
        },
        expect: {
          toBe: (value, opts) => expectUrlQuery(page, { key, value, ...opts }),
        },
        value: () => new URL(page.url()).searchParams.get(key),
      };
    },

    // Mocking (per-test overrides)
    mock: {
      request: (requestId, options) => {
        const pageId = options?.pageId ?? currentPageId;
        return mockManager?.mockRequest(requestId, { ...options, pageId });
      },
      api: (apiId, options) => mockManager?.mockApi(apiId, options),
      getCapturedRequest: (requestId, opts) => mockManager?.getCapturedRequest(requestId, opts),
      getCapturedApi: (endpointId) => mockManager?.getCapturedApi(endpointId),
      clearCapturedRequests: () => mockManager?.clearCapturedRequests(),
    },
  };
}

export default createPageManager;
