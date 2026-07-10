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

// Core helpers (runner-agnostic - also available from the "./runtime" subpath)
import { escapeId } from './core/escapeId.js';
import { getBlock } from './core/locators.js';
import { goto, waitForReady, waitForPage } from './core/navigation.js';
import { getRequestState, getRequestResponse } from './core/requests.js';
import { getState, getBlockState, setState } from './core/state.js';
import { getValidation } from './core/validation.js';
import { setUrlQuery } from './core/url.js';

export { escapeId };
export { getBlock };
export { goto, waitForReady, waitForPage };
export { getRequestState, getRequestResponse };
export { getState, getBlockState, setState };
export { getValidation };
export { setUrlQuery };

// Assertions (coupled to @playwright/test)
import { expectNavigation } from './assertions/navigation.js';
import { expectRequest } from './assertions/requests.js';
import { expectState } from './assertions/state.js';
import {
  expectValidationStatus,
  expectValidationError,
  expectValidationWarning,
  expectValidationSuccess,
} from './assertions/validation.js';
import { expectUrl, expectUrlQuery } from './assertions/url.js';

export { expectNavigation };
export { expectRequest };
export { expectState };
export {
  expectValidationStatus,
  expectValidationError,
  expectValidationWarning,
  expectValidationSuccess,
};
export { expectUrl, expectUrlQuery };

// Test prep utilities
import { generateManifest, loadManifest } from './testPrep/generateManifest.js';
export { generateManifest, loadManifest };

// Proxy utilities
import createBlockHelper from './proxy/createBlockHelper.js';
import createHelperRegistry from './proxy/createHelperRegistry.js';
import createBlockMethodProxy from './proxy/createBlockMethodProxy.js';
import createPageManager from './proxy/createPageManager.js';
export { createBlockHelper, createHelperRegistry, createBlockMethodProxy, createPageManager };

// Mocking utilities
import { createMockManager, loadStaticMocks } from './mocking/index.js';
export { createMockManager, loadStaticMocks };
