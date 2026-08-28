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

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import useColDefs from './useColDefs.js';
import assignRowId from './assignRowId.js';
import LoadingOverlay from './LoadingOverlay.js';

// Registration is idempotent, so each core registers independently to stay standalone.
ModuleRegistry.registerModules([AllCommunityModule]);

const AgGrid = ({ components, events, loading, methods, properties, theme }) => {
  const {
    quickFilterValue,
    columnDefs,
    defaultColDef,
    height,
    rowData: newRowData,
    rowId,
    size,
    suppressCellFocus = true,
    themeParams,
    ...someProperties
  } = properties;
  const [rowData, setRowData] = useState(newRowData ?? []);

  const gridRef = useRef();

  const memoDefaultColDef = useMemo(() => defaultColDef);
  const processedColDefs = useColDefs({ columnDefs, methods, components, gridRef });

  const getRowId = useCallback(
    (params) => {
      if (rowId && params.data[rowId] !== undefined) return params.data[rowId];
      return assignRowId(params);
    },
    [rowId]
  );

  const onRowClick = useCallback((event) => {
    if (events.onRowClick) {
      methods.triggerEvent({
        name: 'onRowClick',
        event: {
          row: event.data,
          selected: gridRef.current.api.getSelectedRows(),
          rowIndex: event.rowIndex,
        },
      });
    }
  }, []);
  const onCellClicked = useCallback((event) => {
    if (events.onCellClick) {
      methods.triggerEvent({
        name: 'onCellClick',
        event: {
          cell: { column: event.colDef.field, value: event.value },
          colId: event.column.colId,
          row: event.data,
          rowIndex: event.rowIndex,
          selected: gridRef.current.api.getSelectedRows(),
        },
      });
    }
  }, []);
  const onRowSelected = useCallback((event) => {
    // AG Grid fires onRowSelected for deselection too, which the Lowdefy event does not represent.
    // See https://stackoverflow.com/a/63265775/2453657
    if (!event.node.isSelected()) return;
    if (events.onRowSelected) {
      methods.triggerEvent({
        name: 'onRowSelected',
        event: {
          row: event.data,
          rowIndex: event.rowIndex,
          selected: gridRef.current.api.getSelectedRows(),
        },
      });
    }
  }, []);
  const onSelectionChanged = useCallback(() => {
    if (events.onSelectionChanged) {
      methods.triggerEvent({
        name: 'onSelectionChanged',
        event: { selected: gridRef.current.api.getSelectedRows() },
      });
    }
  }, []);

  const getDisplayedRows = (api) => {
    const rows = [];
    api.forEachNodeAfterFilterAndSort((node) => rows.push(node.data));
    return rows;
  };

  const onFilterChanged = useCallback((event) => {
    if (events.onFilterChanged) {
      methods.triggerEvent({
        name: 'onFilterChanged',
        event: {
          rows: getDisplayedRows(event.api),
          filter: gridRef.current.api.getFilterModel(),
        },
      });
    }
  }, []);

  const onSortChanged = useCallback((event) => {
    if (events.onSortChanged) {
      methods.triggerEvent({
        name: 'onSortChanged',
        event: {
          rows: getDisplayedRows(event.api),
          sort: event.api.getColumnState().filter((col) => Boolean(col.sort)),
        },
      });
    }
  }, []);

  useEffect(() => {
    methods.registerMethod('exportDataAsCsv', (args) => gridRef.current.api.exportDataAsCsv(args));
    methods.registerMethod('sizeColumnsToFit', () => gridRef.current.api.sizeColumnsToFit());
    methods.registerMethod('setFilterModel', (model) => gridRef.current.api.setFilterModel(model));
    methods.registerMethod('setQuickFilter', (value) =>
      gridRef.current.api.setGridOption('quickFilterText', value)
    );
    methods.registerMethod('autoSize', (args = {}) => {
      const { skipHeader, colIds } = args;
      const allColumnIds = colIds || [];
      if (!colIds) {
        gridRef.current.api.getColumns().forEach((column) => {
          allColumnIds.push(column.getId());
        });
      }
      gridRef.current.api.autoSizeColumns(allColumnIds, skipHeader);
    });
  }, []);

  useEffect(() => {
    if (JSON.stringify(rowData) !== JSON.stringify(newRowData)) {
      setRowData(newRowData);
    }
  }, [newRowData]);

  if (quickFilterValue && quickFilterValue === '') {
    gridRef.current.api.setGridOption('quickFilterText', quickFilterValue); // check if empty string matches all
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <AgGridReact
        columnMenu="legacy"
        {...someProperties}
        theme={theme}
        suppressCellFocus={suppressCellFocus}
        rowData={rowData}
        defaultColDef={memoDefaultColDef}
        onFilterChanged={onFilterChanged}
        onSortChanged={onSortChanged}
        onSelectionChanged={onSelectionChanged}
        onRowSelected={onRowSelected}
        onRowClicked={onRowClick}
        onCellClicked={onCellClicked}
        columnDefs={processedColDefs}
        ref={gridRef}
        getRowId={getRowId}
        suppressLoadingOverlay
      />
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default AgGrid;
