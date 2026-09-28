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

import findNextRowId from './findNextRowId.js';

// Action `afterRowAction({ id, result })`, called when a row button, menu item or single-key
// action fires. With `keyboard.next`, focus moves to the next row once the event's actions
// finish (triage: act, and the next item is ready). The next row is picked before the actions
// run: an action that removes the row from the list still lands on the row that followed it.
function createAfterRowAction(api) {
  return function afterRowAction({ id, result }) {
    if (!api.config.keyboardNext) return;
    const nextId = findNextRowId({ rows: api.rows, id });
    const { col } = api.keyboard.activeCell;
    Promise.resolve(result).then((outcome) => {
      if (outcome?.success === false) return;
      const index = api.rows.findIndex((row) => !row.kind && row.id === nextId);
      if (index === -1) return;
      api.keyboard.moveTo({ row: index, col });
    });
  };
}

export default createAfterRowAction;
