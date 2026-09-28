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
import useFeatureItems from './useFeatureItems.js';
import useFeatureRows from './useFeatureRows.js';
import useFeatureMethods from './useFeatureMethods.js';
import useForeignKeys from './useForeignKeys.js';
import useTableConfig from './useTableConfig.js';
import useTableState from './useTableState.js';

import './table.css';

// The table core: config, data, TanStack state and the feature fragments, composed into the
// window component. `rowWindowStrategy` is a benchmark-only prop (the Lowdefy client never passes
// it) that switches the row window to TanStack Virtual's per-row positioning.
function TableRoot({
  basePath,
  blockId,
  classNames = {},
  components,
  events = {},
  loading,
  methods,
  pageId,
  properties,
  rowWindowStrategy,
  styles = {},
  value,
}) {
  const config = useTableConfig({ properties });
  const apiRef = useRef(null);
  if (apiRef.current === null) {
    apiRef.current = createApi();
    createFeatureActions(apiRef.current);
  }
  const api = apiRef.current;

  const sourceData = useFeatureData({ api, config, properties });
  const previousData = useRef(null);
  const stable = useMemo(
    () =>
      stabilizeData({
        data: sourceData,
        previous: previousData.current,
        getKey: config.getKey,
        rowVersionField: config.rowVersionField,
      }),
    [sourceData, config.getKey, config.rowVersionField]
  );
  previousData.current = stable;
  const data = useFeatureRows({ api, config, rows: stable.rows });

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
    methods,
    pageId,
    setSliceSilently,
    state,
    table,
    updateSlice,
  });
  useForeignKeys({ api, selected: value?.selected });
  useFeatureMethods({ api, methods });
  const fragments = useFeatureFragments({ api, config, data, state, table });
  const { leadingColumns, regions } = fragments;

  const rowHeight = config.rowHeight ?? densityHeights[state.density];
  const headerHeight = Math.min(Math.max(rowHeight, 32), 48);
  const { rows, rowOffsets } = useFeatureItems({
    api,
    config,
    rowHeight,
    rows: table.getRowModel().rows,
    state,
    table,
  });

  return (
    <Grid
      api={api}
      blockId={blockId}
      classNames={classNames}
      clickable={Boolean(config.rowLink || events.onRowClick)}
      config={config}
      headerHeight={headerHeight}
      isPending={isPending || fragments.pending}
      leadingColumns={leadingColumns}
      loading={loading === true || properties.loading === true || fragments.loading}
      regions={regions}
      rowHeight={rowHeight}
      rowOffsets={rowOffsets}
      rows={rows}
      state={state}
      strategy={rowWindowStrategy}
      styles={styles}
    />
  );
}

export default TableRoot;
