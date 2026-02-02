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

// Core helpers
import { getBlock } from './core/locators.js';
import { goto, waitForReady, expectNavigation, waitForPage } from './core/navigation.js';
import { waitForRequest, getRequestResponse } from './core/requests.js';
import { getState, getBlockState, expectState } from './core/state.js';

export { getBlock };
export { goto, waitForReady, expectNavigation, waitForPage };
export { waitForRequest, getRequestResponse };
export { getState, getBlockState, expectState };

// Test prep utilities
import { generateManifest, loadManifest } from './testPrep/generateManifest.js';
export { generateManifest, loadManifest };

// Proxy utilities
import createHelperRegistry from './proxy/createHelperRegistry.js';
import createBlockProxy from './proxy/createBlockProxy.js';
import createPageManager from './proxy/createPageManager.js';
export { createHelperRegistry, createBlockProxy, createPageManager };
