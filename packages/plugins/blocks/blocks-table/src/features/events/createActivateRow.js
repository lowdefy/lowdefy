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

import resolveRowLink from './resolveRowLink.js';

// A row "activation" (click, or Enter on a focused cell) fires onRowClick and follows rowLink.
// Cmd/Ctrl/Shift open the link in a new tab, as a link would.
function createActivateRow(api) {
  return function activateRow({ id, event, newTab }) {
    const row = api.table.getRow(id, true);
    if (!row) return false;
    api.methods.triggerEvent({
      name: 'onRowClick',
      event: { row: row.original, rowKey: api.config.getKey(row.original), index: row.index },
    });
    const { rowLink } = api.config;
    if (!rowLink) return true;
    const modified = event?.metaKey || event?.ctrlKey || event?.shiftKey;
    const link = resolveRowLink({ rowLink, row: row.original });
    if (newTab || modified) link.newTab = true;
    api.methods.triggerEvent({ name: '__rowLink', event: { link } });
    return true;
  };
}

export default createActivateRow;
