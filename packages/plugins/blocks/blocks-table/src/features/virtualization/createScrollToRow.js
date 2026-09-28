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

import { type } from '@lowdefy/helpers';

import scrollToCell from './scrollToCell.js';

// Block method `scrollToRow({ rowKey, align })`; returns false when no loaded row has that key.
function createScrollToRow(api) {
  return function scrollToRow({ rowKey, align } = {}) {
    if (type.isNone(rowKey)) {
      throw new Error('scrollToRow requires "rowKey".');
    }
    const id = String(rowKey);
    const index = api.rows.findIndex((row) => row?.id === id && (row.kind ?? 'row') === 'row');
    if (index === -1) return false;
    scrollToCell({ api, row: index, col: -1, align: align ?? 'center' });
    return true;
  };
}

export default createScrollToRow;
