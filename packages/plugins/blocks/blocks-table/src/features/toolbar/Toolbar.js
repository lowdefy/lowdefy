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

import DensityToggle from './DensityToggle.js';
import ExportButton from './ExportButton.js';
import FilterButton from './FilterButton.js';
import LazyColumnManagerPopover from '../columnManager/LazyColumnManagerPopover.js';
import GroupButton from './GroupButton.js';
import QuickFilter from './QuickFilter.js';
import RecordCount from './RecordCount.js';
import SortButton from './SortButton.js';
import ToolbarIcon from './ToolbarIcon.js';
import ToolbarSearch from './ToolbarSearch.js';
import ViewTabs from './ViewTabs.js';

import './toolbar.css';

// The table's own chrome above the grid (D7): view tabs, then one row with the `toolbarStart`
// slot, search, quick filters and the view controls, and at the end the record count, density,
// columns, export, the features' `toolbarItems` (enrichment's CSV import) and the `toolbarEnd`
// slot. antd components: this is chrome, not cells.
function Toolbar({ api, searchRef, toolbar }) {
  const { columnsByKey } = api.config;
  const { content } = api;
  const groupable = api.config.columns.filter((column) => column.groupable);
  const quickFilters = toolbar.quickFilters.map((key) => columnsByKey.get(key));
  const showTabs = toolbar.views && api.views.items.length > 0;
  return (
    <div className="lf-table-toolbar" data-lf-toolbar="">
      {showTabs ? <ViewTabs api={api} /> : null}
      <div className="lf-table-toolbar-row">
        <div className="lf-table-toolbar-start">
          {content.toolbarStart ? content.toolbarStart() : null}
          {toolbar.search ? <ToolbarSearch api={api} searchRef={searchRef} /> : null}
          {quickFilters.map((column) => (
            <QuickFilter api={api} column={column} key={column.key} />
          ))}
          {toolbar.filter ? <FilterButton api={api} /> : null}
          {toolbar.sort ? <SortButton api={api} /> : null}
          {toolbar.group && groupable.length > 0 ? (
            <GroupButton api={api} groupable={groupable} />
          ) : null}
        </div>
        <div className="lf-table-toolbar-end">
          {toolbar.count ? <RecordCount api={api} /> : null}
          {toolbar.density ? <DensityToggle api={api} /> : null}
          {toolbar.columns ? (
            <Button
              data-lf-toolbar-button="columns"
              icon={<ToolbarIcon api={api} name="view" />}
              onClick={() => api.actions.openColumnManager()}
              onFocus={LazyColumnManagerPopover.preload}
              onPointerEnter={LazyColumnManagerPopover.preload}
              size="small"
            >
              Columns
            </Button>
          ) : null}
          {toolbar.export ? <ExportButton api={api} /> : null}
          {api.features.toolbarItems.map((Item, index) => (
            <Item api={api} key={index} />
          ))}
          {content.toolbarEnd ? content.toolbarEnd() : null}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
