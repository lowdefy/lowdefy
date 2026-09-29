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
import { Button, Popover, Segmented } from 'antd';

import isDefaultSorting from './isDefaultSorting.js';
import ToolbarCount from './ToolbarCount.js';
import ToolbarIcon from './ToolbarIcon.js';
import ToolbarList from './ToolbarList.js';

const DIRECTIONS = [
  { label: 'Asc', value: 'asc' },
  { label: 'Desc', value: 'desc' },
];

// The multi-sort editor: sort levels in order, each with its direction. The button counts the
// sort levels when they differ from `defaultView`'s sort.
function SortButton({ api }) {
  const { sorting } = api.state;
  const keys = sorting.map((entry) => entry.id);
  const available = api.config.columns.filter(
    (column) => column.sortable && !keys.includes(column.key)
  );
  function update(next) {
    api.updateSlice('sorting', () => next, { cause: 'sort' });
  }
  function onChange(nextKeys) {
    const byKey = new Map(sorting.map((entry) => [entry.id, entry]));
    update(nextKeys.map((key) => byKey.get(key) ?? { id: key, desc: false }));
  }
  // The default view's own sort is not counted: the count shows the user changed the sort.
  const sortCount = isDefaultSorting({ config: api.config, sorting }) ? 0 : sorting.length;
  const content = (
    <div className="lf-table-toolbar-popover" data-lf-toolbar-sort="">
      <ToolbarList
        addLabel="Add sort"
        api={api}
        available={available}
        emptyText="No sort"
        keys={keys}
        name="sort"
        onChange={onChange}
        renderExtra={({ index }) => (
          <Segmented
            data-lf-sort-direction=""
            onChange={(direction) =>
              update(
                sorting.map((entry, i) =>
                  i === index ? { ...entry, desc: direction === 'desc' } : entry
                )
              )
            }
            options={DIRECTIONS}
            size="small"
            value={sorting[index].desc ? 'desc' : 'asc'}
          />
        )}
      />
    </div>
  );
  return (
    <Popover content={content} placement="bottomLeft" trigger="click">
      <Button
        data-lf-toolbar-button="sort"
        icon={<ToolbarIcon api={api} name="sort" />}
        size="small"
      >
        Sort
        <ToolbarCount count={sortCount} />
      </Button>
    </Popover>
  );
}

export default SortButton;
