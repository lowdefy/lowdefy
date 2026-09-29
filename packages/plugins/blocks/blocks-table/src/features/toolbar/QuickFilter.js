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

import React from 'react';
import { Button } from 'antd';

import ColumnTitle from './ColumnTitle.js';
import OptionsQuickFilter from './OptionsQuickFilter.js';
import ToolbarIcon from './ToolbarIcon.js';

// A quick filter chip (HubSpot-style) for one column. Enum columns (with `options`, normalised by
// the shared core) get a checkbox list that writes one `in` leaf through applyFiltering; other
// columns open the column's own filter.
function QuickFilter({ api, column }) {
  if (column.options) return <OptionsQuickFilter api={api} column={column} />;
  return (
    <Button
      className="lf-table-quick-filter"
      data-lf-quick-filter={column.key}
      onClick={() => api.actions.openColumnFilter({ key: column.key })}
      size="small"
    >
      <ColumnTitle api={api} column={column} />
      <ToolbarIcon api={api} name="chevron-down" />
    </Button>
  );
}

export default QuickFilter;
