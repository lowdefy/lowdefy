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

const BROWSER_OPTIONS = [
  { name: 'pagination', what: 'pagination' },
  { name: 'quickFilterValue', what: 'a quick filter (quickFilterValue)' },
  { name: 'quickFilterText', what: 'a quick filter (quickFilterText)' },
  { name: 'rowSelection', what: 'row selection' },
  { name: 'treeData', what: 'tree data' },
  { name: 'masterDetail', what: 'master/detail rows' },
  { name: 'pivotMode', what: 'pivoting' },
  { name: 'pinnedTopRowData', what: 'pinned rows' },
  { name: 'pinnedBottomRowData', what: 'pinned rows' },
  { name: 'initialState', what: 'an initial grid state (initialState)' },
  { name: 'isExternalFilterPresent', what: 'an external filter' },
];

const BROWSER_COLUMN_KEYS = [
  { names: ['sort', 'initialSort'], what: 'a sort' },
  {
    names: ['rowGroup', 'initialRowGroup', 'rowGroupIndex', 'initialRowGroupIndex'],
    what: 'grouping',
  },
  { names: ['pivot', 'initialPivot', 'pivotIndex', 'initialPivotIndex'], what: 'pivoting' },
  { names: ['checkboxSelection', 'headerCheckboxSelection'], what: 'row selection' },
];

// Whether a grid option or column key is set to anything that turns its feature on: false, null,
// an empty string and an empty list turn none on.
function isOn(value) {
  if (type.isNone(value) || value === false || value === '') {
    return false;
  }
  return !type.isArray(value) || value.length > 0;
}

// Why an AgGrid block's rows, as a person sees them, can differ from its rowData, or it keeps
// state the stand-in does not model: a grid option (pagination, a quick filter, row selection,
// tree data, ...), a column key on any column, defaultColDef included (a sort, grouping,
// pivoting, selection), a client-side row model given up, or a filter set by a method
// (state.filteredBy). Null when none does.
function findAgGridFeature({ columns, properties, state }) {
  if (!type.isNone(state.filteredBy)) {
    return state.filteredBy;
  }
  if (isOn(properties.rowModelType) && properties.rowModelType !== 'clientSide') {
    return `the ${properties.rowModelType} row model`;
  }
  const option = BROWSER_OPTIONS.find(({ name }) => isOn(properties[name]));
  if (!type.isUndefined(option)) {
    return option.what;
  }
  for (const column of columns) {
    const key = BROWSER_COLUMN_KEYS.find(({ names }) =>
      names.some((name) => isOn(column.colDef[name]))
    );
    if (!type.isUndefined(key)) {
      return `${key.what} on column "${column.id}"`;
    }
  }
  return null;
}

export default findAgGridFeature;
