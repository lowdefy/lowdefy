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

import getRowIndex from './getRowIndex.js';
import openRowLink from './openRowLink.js';
import findRow from '../../core/findRow.js';

// A row "activation" (click, or Enter on a focused cell), with TableLight's semantics: onRowClick
// fires, and rowLink is followed unless onRowClick is defined too, in which case a plain click is
// the app's (a peek, say) and only a modified click (Cmd/Ctrl/Shift) follows the link, in a new
// tab.
function createActivateRow(api) {
  return function activateRow({ id, event, newTab }) {
    const row = findRow({ table: api.table, id });
    if (!row) return false;
    const hasRowClick = Boolean(api.events.onRowClick);
    if (hasRowClick) {
      const rowKey = api.config.getKey(row.original);
      api.methods.triggerEvent({
        name: 'onRowClick',
        event: {
          row: row.original,
          rowKey,
          index: getRowIndex({ api, rowKey }),
        },
      });
    }
    const { rowLink } = api.config;
    if (!rowLink) return true;
    const modified = event?.metaKey || event?.ctrlKey || event?.shiftKey;
    const openInNewTab = newTab === true || modified === true;
    if (openInNewTab || !hasRowClick) {
      openRowLink({ rowLink, row: row.original, newTab: openInNewTab });
    }
    return true;
  };
}

export default createActivateRow;
