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

import initColumnOrder from '../ordering/initColumnOrder.js';
import initColumnPinning from '../pinning/initColumnPinning.js';
import initColumnSizing from '../sizing/initColumnSizing.js';
import initColumnVisibility from '../visibility/initColumnVisibility.js';
import resolveViewColumns from '../../core/resolveViewColumns.js';

// Action `resetColumns()`: order, widths, pinning and visibility back to `defaultView.columns`
// (then the column defaults), as one `columns` change.
function createResetColumns(api) {
  return function resetColumns() {
    const viewColumns = resolveViewColumns({
      value: null,
      defaultView: api.config.defaultView,
      columns: api.config.columns,
    });
    api.updateSlice('columnOrder', () => initColumnOrder({ viewColumns }));
    api.updateSlice('columnPinning', () => initColumnPinning({ viewColumns }));
    api.updateSlice('columnSizing', () => initColumnSizing({ viewColumns }));
    api.updateSlice('columnVisibility', () => initColumnVisibility({ viewColumns }));
  };
}

export default createResetColumns;
