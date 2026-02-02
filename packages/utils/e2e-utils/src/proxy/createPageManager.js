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
import { waitForReady } from '../core/navigation.js';
import { getState, getBlockState, expectState } from '../core/state.js';

import createBlockProxy from './createBlockProxy.js';

function createPageManager({ page, manifest, helperRegistry }) {
  let currentBlockMap = null;
  let currentPageId = null;

  return {
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

    get blocks() {
      if (!currentBlockMap) {
        throw new Error('Call goto() before accessing blocks');
      }
      return createBlockProxy({ page, blockMap: currentBlockMap, helperRegistry });
    },

    get pageId() {
      return currentPageId;
    },

    // Core helpers
    block: (blockId) => getBlock(page, blockId),
    getState: () => getState(page),
    getBlockState: (blockId) => getBlockState(page, blockId),
    expectState: (key, value, opts) => expectState(page, key, value, opts),
  };
}

export default createPageManager;
