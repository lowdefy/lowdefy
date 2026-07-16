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

// Runner-agnostic surface: reading/writing a Lowdefy Page via the Playwright
// `page` interface, with no dependency on @playwright/test. Useful for driving
// a page from tooling that isn't a Playwright test run (e.g. headless
// inspection). The `expect*` assertion helpers live in "./assertions" and the
// full test-authoring API (which does depend on @playwright/test) is exported
// from "." and "./fixtures".

export { escapeId } from './core/escapeId.js';
export { getBlock } from './core/locators.js';
export { goto, waitForReady, waitForPage } from './core/navigation.js';
export { getRequestState, getRequestResponse } from './core/requests.js';
export { getApiState, getApiResponse } from './core/api.js';
export { getState, getBlockState, setState } from './core/state.js';
export { getValidation } from './core/validation.js';
export { setUrlQuery } from './core/url.js';
export { setUserCookie, clearUserCookie } from './core/userCookie.js';

export { generateManifest, loadManifest } from './testPrep/generateManifest.js';

export { createMockManager, loadStaticMocks } from './mocking/index.js';

export { default as createPageManager } from './proxy/createPageManager.js';
