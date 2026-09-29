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

import freezeColumns from './freezeColumns.js';
import getVisibleOrder from './getVisibleOrder.js';
import pinColumn from './pinColumn.js';

function sortItems({ column, api }) {
  if (!column.sortable) return [];
  const sort = api.state.sorting.find((entry) => entry.id === column.key);
  const items = [
    {
      key: 'sortAsc',
      label: 'Sort ascending',
      section: 'sort',
      disabled: sort?.desc === false,
      onClick: () => api.actions.setSort({ key: column.key, desc: false }),
    },
    {
      key: 'sortDesc',
      label: 'Sort descending',
      section: 'sort',
      disabled: sort?.desc === true,
      onClick: () => api.actions.setSort({ key: column.key, desc: true }),
    },
  ];
  if (sort) {
    items.push({
      key: 'clearSort',
      label: 'Clear sort',
      section: 'sort',
      onClick: () => api.actions.clearSort({ key: column.key }),
    });
  }
  return items;
}

function pinItems({ column, api }) {
  const { start, end } = api.state.columnPinning;
  let pinned = null;
  if (start.includes(column.key)) pinned = 'start';
  if (end.includes(column.key)) pinned = 'end';
  const pin = (side) =>
    api.updateSlice('columnPinning', (pinning) => pinColumn({ pinning, key: column.key, side }));
  const items = [];
  if (pinned !== 'start') {
    items.push({ key: 'pinStart', label: 'Pin to start', onClick: () => pin('start') });
  }
  if (pinned !== 'end') {
    items.push({ key: 'pinEnd', label: 'Pin to end', onClick: () => pin('end') });
  }
  if (pinned !== null) {
    items.push({ key: 'unpin', label: 'Unpin', onClick: () => pin(null) });
  }
  items.push({
    key: 'freeze',
    label: 'Freeze up to here',
    onClick: () =>
      api.updateSlice('columnPinning', (pinning) =>
        freezeColumns({ pinning, visibleOrder: getVisibleOrder(api), key: column.key })
      ),
  });
  return items.map((item) => ({ ...item, section: 'pin' }));
}

function columnItems({ column, api }) {
  const items = [];
  if (column.resizable) {
    items.push({
      key: 'autosize',
      label: 'Autosize',
      section: 'column',
      onClick: () => api.actions.autosizeColumn({ key: column.key }),
    });
  }
  items.push({
    key: 'hide',
    label: 'Hide column',
    section: 'column',
    // The last visible column stays: a table without columns has no header menu to undo it.
    disabled: getVisibleOrder(api).length <= 1,
    onClick: () =>
      api.updateSlice('columnVisibility', (visibility) => ({ ...visibility, [column.key]: false })),
  });
  return items;
}

// The header menu's own items (sort, pin, freeze, autosize, hide), contributed through the same
// `headerMenuItems` extension point as every other feature's.
function getChromeMenuItems({ column, api }) {
  return [
    ...sortItems({ column, api }),
    ...pinItems({ column, api }),
    ...columnItems({ column, api }),
  ];
}

export default getChromeMenuItems;
