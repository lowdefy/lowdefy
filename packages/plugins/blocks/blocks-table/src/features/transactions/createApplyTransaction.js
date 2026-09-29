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

import normalizeTransaction from './normalizeTransaction.js';

// Block method `applyTransaction({ add, update, remove, addIndex })` for push updates without
// replacing `data`. Returns the counts `{ added, updated, removed }`. In server mode it applies
// to the loaded blocks (see serverData).
function createApplyTransaction(api) {
  return function applyTransaction(params) {
    const transaction = normalizeTransaction(params);
    if (api.config.server) return api.serverStore.applyTransaction(transaction);
    return api.applyClientTransaction(transaction);
  };
}

export default createApplyTransaction;
