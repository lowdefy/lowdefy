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

import React, { Suspense } from 'react';
import { Button, Popover } from 'antd';

import countConditions from './countConditions.js';
import LazyFilterBuilder from '../filtering/LazyFilterBuilder.js';
import ToolbarCount from './ToolbarCount.js';
import ToolbarIcon from './ToolbarIcon.js';

// Opens the filter builder on the whole `view.filter`; the button counts its conditions. Edits go
// through applyFiltering, the one filter write path.
function FilterButton({ api }) {
  const filter = api.state.filter ?? null;
  const columns = api.config.columns.filter((column) => column.filterable);
  const content = (
    <div className="lf-table-toolbar-popover" data-lf-toolbar-filter="">
      <Suspense fallback={null}>
        <LazyFilterBuilder
          columns={columns}
          condition={filter}
          onChange={(condition) => api.actions.applyFiltering({ filter: condition ?? null })}
          user={api.config.user}
        />
      </Suspense>
    </div>
  );
  return (
    <Popover content={content} placement="bottomLeft" trigger="click">
      <Button
        data-lf-toolbar-button="filter"
        icon={<ToolbarIcon api={api} name="filter" />}
        onFocus={LazyFilterBuilder.preload}
        onPointerEnter={LazyFilterBuilder.preload}
        size="small"
      >
        Filter
        <ToolbarCount count={countConditions(filter)} />
      </Button>
    </Popover>
  );
}

export default FilterButton;
