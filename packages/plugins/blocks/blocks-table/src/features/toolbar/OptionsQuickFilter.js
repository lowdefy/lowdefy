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
import { Button, Checkbox, Popover } from 'antd';

import ColumnTitle from './ColumnTitle.js';
import getQuickFilterValues from './getQuickFilterValues.js';
import setQuickFilterValues from './setQuickFilterValues.js';
import ToolbarIcon from './ToolbarIcon.js';
import useSyncedState from '../filtering/useSyncedState.js';

// The checkbox list of an enum column's chip. Filter writes apply in a transition after the rows
// are tested, so the checked values are local state (useSyncedState) that the committed filter
// replaces when it changes from elsewhere.
function OptionsQuickFilter({ api, column }) {
  const { options } = column;
  const [values, setValues] = useSyncedState({
    value: getQuickFilterValues({ filter: api.state.filter, key: column.key }),
    onChange: (next) =>
      api.actions.applyFiltering({
        filter: (filter) => setQuickFilterValues({ filter, key: column.key, values: next }),
      }),
  });
  const checked = options
    .map((option, index) => (values.includes(option.value) ? index : null))
    .filter((index) => index !== null);
  const content = (
    <Checkbox.Group
      className="lf-table-quick-filter-options"
      data-lf-quick-filter-options={column.key}
      onChange={(indices) => setValues(indices.map((index) => options[index].value))}
      options={options.map((option, index) => ({ label: option.label, value: index }))}
      value={checked}
    />
  );
  return (
    <Popover content={content} placement="bottomLeft" trigger="click">
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
