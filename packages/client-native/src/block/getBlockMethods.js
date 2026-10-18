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

import getReportingMethods from './getReportingMethods.js';

const INPUT_CATEGORIES = new Set(['input', 'input-container']);
const LIST_CATEGORIES = new Set(['list', 'input-container']);

// The methods a block component gets, by its category, as the web renderer gives them. Its
// triggerEvent and setValue report presses and changes for Lowdefy Dev's recorder. streamFetch
// is native only: the server call a block reads as a stream (createStreamFetch).
function getBlockMethods({ block, category, lowdefy }) {
  const reporting = getReportingMethods({ block, lowdefy });
  const methods = Object.assign(block.methods, {
    getAppStorageKey: lowdefy._internal.storage.appKey,
    getLocale: () => lowdefy.i18n?.active ?? lowdefy.i18n?.defaultLocale,
    getUserStorageKey: lowdefy._internal.storage.userKey,
    registerEvent: block.registerEvent,
    registerMethod: block.registerMethod,
    streamFetch: lowdefy._internal.streamFetch,
    translate: lowdefy._internal.translate,
    triggerEvent: reporting.triggerEvent,
  });
  if (INPUT_CATEGORIES.has(category)) {
    methods.setValue = reporting.setValue;
  }
  if (LIST_CATEGORIES.has(category)) {
    Object.assign(methods, {
      moveItemDown: block.moveItemDown,
      moveItemUp: block.moveItemUp,
      pushItem: block.pushItem,
      removeItem: block.removeItem,
      unshiftItem: block.unshiftItem,
    });
  }
  return methods;
}

export default getBlockMethods;
