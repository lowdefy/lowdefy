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

import React, { useRef, useState } from 'react';
import { Button, Checkbox, Input, Popover } from 'antd';

import ColumnTitle from './ColumnTitle.js';
import getQuickFilterValues from './getQuickFilterValues.js';
import getVisibleQuickFilterOptions from './getVisibleQuickFilterOptions.js';
import setQuickFilterValues from './setQuickFilterValues.js';
import ToolbarIcon from './ToolbarIcon.js';
import useSyncedState from '../filtering/useSyncedState.js';

// A list longer than this gets a search box at its top.
const MAX_OPTIONS_WITHOUT_SEARCH = 8;

// The checkbox list of an enum column's chip. Filter writes apply in a transition after the rows
// are tested, so the checked values are local state (useSyncedState) that the committed filter
// replaces when it changes from elsewhere.
function OptionsQuickFilter({ api, column }) {
  const { options } = column;
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const [values, setValues] = useSyncedState({
    value: getQuickFilterValues({ filter: api.state.filter, key: column.key }),
    onChange: (next) =>
      api.actions.applyFiltering({
        filter: (filter) => setQuickFilterValues({ filter, key: column.key, values: next }),
      }),
  });
  const searchable = options.length > MAX_OPTIONS_WITHOUT_SEARCH;
  const visible = getVisibleQuickFilterOptions({
    options,
    search: searchable ? search : '',
    values,
  });
  const checked = options
    .map((option, index) => (values.includes(option.value) ? index : null))
    .filter((index) => index !== null);

  function onSearchKeyDown(event) {
    if (event.key !== 'Escape' || search === '') return;
    // The popover closes on an Escape that reaches window; with text in the box, Escape only
    // clears it.
    event.stopPropagation();
    setSearch('');
  }

  const content = (
    <div className="lf-table-quick-filter-panel" data-lf-quick-filter-options={column.key}>
      {searchable ? (
        <Input
          allowClear
          aria-label="Search options"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search"
          prefix={<ToolbarIcon api={api} name="search" />}
          ref={searchRef}
          size="small"
          value={search}
        />
      ) : null}
      <Checkbox.Group
        className="lf-table-quick-filter-options"
        onChange={(indices) => setValues(indices.map((index) => options[index].value))}
        options={visible.map((index) => ({ label: options[index].label, value: index }))}
        value={checked}
      />
      {searchable && visible.length === 0 ? (
        <div className="lf-table-quick-filter-empty">No matches</div>
      ) : null}
    </div>
  );
  return (
    <Popover
      afterOpenChange={(open) => {
        if (open) searchRef.current?.focus();
        else setSearch('');
      }}
      content={content}
      placement="bottomLeft"
      trigger="click"
    >
      <Button
        className="lf-table-quick-filter"
        color={values.length > 0 ? 'primary' : 'default'}
        data-active={values.length > 0 ? '' : undefined}
        data-lf-quick-filter={column.key}
        size="small"
        variant="outlined"
      >
        <ColumnTitle api={api} column={column} />
        {values.length > 0 ? (
          <span className="lf-table-toolbar-count lf-table-quick-filter-count">
            {values.length}
          </span>
        ) : null}
        <ToolbarIcon api={api} name="chevron-down" />
      </Button>
    </Popover>
  );
}

export default OptionsQuickFilter;
