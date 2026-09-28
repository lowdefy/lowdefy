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

import React, { useMemo, useRef } from 'react';
import { useTable } from '@tanstack/react-table';

import createApi from './createApi.js';
import createFeatureActions from './createFeatureActions.js';
import createSliceHandlers from './createSliceHandlers.js';
import densityHeights from './densityHeights.js';
import features from '../features/index.js';
import Grid from './Grid.js';
import stabilizeData from './stabilizeData.js';
import TABLE_FEATURES from './tableFeatures.js';
import useFeatureData from './useFeatureData.js';
import useFeatureFragments from './useFeatureFragments.js';
import useFeatureMethods from './useFeatureMethods.js';
import useForeignKeys from './useForeignKeys.js';
import useTableConfig from './useTableConfig.js';
import useTableState from './useTableState.js';

import './table.css';

// The table core: config, data, TanStack state and the feature fragments, composed into the
// window component. `rowWindowStrategy` is a benchmark-only prop (the Lowdefy client never passes
// it) that switches the row window to TanStack Virtual's per-row positioning. `input` is set by
// TableInput only: `{ rows, methods }`, its value (the rows) and the engine methods that write it.
function TableRoot({
  basePath,
  blockId,
  classNames = {},
  components,
  events = {},
  input,
  loading,
  methods,
  pageId,
  properties,
  rowWindowStrategy,
  styles = {},
  value,
}) {
  const config = useTableConfig({ properties });
  const previousData = useRef(null);
  const stable = useMemo(
    () =>
      stabilizeData({
        data: properties.data,
        previous: previousData.current,
        getKey: config.getKey,
        rowVersionField: config.rowVersionField,
      }),
    [properties.data, config.getKey, config.rowVersionField]
  );
  previousData.current = stable;

  const apiRef = useRef(null);
  if (apiRef.current === null) {
    apiRef.current = createApi();
    createFeatureActions(apiRef.current);
  }
  const api = apiRef.current;
  const data = useFeatureData({ api, config, data: stable.rows, input, properties });

  const { isPending, setSliceSilently, state, updateSlice } = useTableState({
    api,
    config,
    data,
    methods,
    value,
  });
  const sliceHandlers = useMemo(() => createSliceHandlers({ updateSlice }), [updateSlice]);
  const tableOptions = useMemo(
    () => Object.assign({}, ...features.map((feature) => feature.tableOptions?.({ config }) ?? {})),
    [config]
  );
  const table = useTable({
    ...tableOptions,
    ...sliceHandlers,
    columns: config.columnDefs,
    data,
    features: TABLE_FEATURES,
    getRowId: config.getId,
    state,
  });
  Object.assign(api, {
    basePath,
    blockId,
    components,
    config,
    events,
    input,
    methods,
    pageId,
    setSliceSilently,
    state,
    table,
    updateSlice,
  });
  useForeignKeys({ api, selected: value?.selected });
  useFeatureMethods({ api, methods });
  const { leadingColumns, regions } = useFeatureFragments({ api, config, data, state, table });

  const rows = table.getRowModel().rows;
  const rowHeight = config.rowHeight ?? densityHeights[state.density];
  const headerHeight = Math.min(Math.max(rowHeight, 32), 48);

  return (
    <Grid
      api={api}
      blockId={blockId}
      classNames={classNames}
      clickable={Boolean(config.rowLink || events.onRowClick)}
      config={config}
      headerHeight={headerHeight}
      isPending={isPending}
      leadingColumns={leadingColumns}
      loading={loading === true || properties.loading === true}
      regions={regions}
      rowHeight={rowHeight}
      rows={rows}
      state={state}
      strategy={rowWindowStrategy}
      styles={styles}
    />
  );
}

export default TableRoot;
