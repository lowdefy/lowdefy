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

import addColumnLeaf from './addColumnLeaf.js';
import countKeyLeaves from './countKeyLeaves.js';

// Block method `openFilter({ key })`: opens the filter builder anchored to the toolbar's Filter
// button, as clicking it does, for an Edit filter button elsewhere on the page. With `key` it
// first adds an empty condition on that column and focuses it. A table whose toolbar has no
// Filter button has nothing to anchor to, so it warns and does nothing.
function createOpenFilter(api) {
  return function openFilter(params) {
    const key = type.isObject(params) ? params.key : undefined;
    if (!api.config.toolbar?.filter || type.isUndefined(api.filterButton)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Table "${api.blockId}" openFilter needs the toolbar's filter item (toolbar: { filter: true }), so it did nothing.`
      );
      return;
    }
    if (type.isNone(key)) {
      api.filterButton.open({ focus: null });
      return;
    }
    const column = api.config.columnsByKey.get(key);
    if (!column || !column.filterable) {
      throw new Error(
        `Table openFilter "key" should be the key of a filterable column. Received ${JSON.stringify(
          key
        )}.`
      );
    }
    // The new condition is the one past those already on the column, once the filter applies.
    const existing = countKeyLeaves({ condition: api.state.filter ?? null, key });
    api.actions.applyFiltering({
      filter: (current) => addColumnLeaf({ condition: current, column }),
    });
    api.filterButton.open({ focus: { key, existing } });
  };
}

export default createOpenFilter;
