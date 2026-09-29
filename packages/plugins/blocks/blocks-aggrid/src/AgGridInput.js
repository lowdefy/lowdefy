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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import useColDefs from './useColDefs.js';
import assignRowId from './assignRowId.js';
import LoadingOverlay from './LoadingOverlay.js';
import isCellControlClick from './isCellControlClick.js';

// Registration is idempotent, so each core registers independently to stay standalone.
ModuleRegistry.registerModules([AllCommunityModule]);

const AgGridInput = ({ components, events, loading, methods, properties, theme, value }) => {
  const {
    quickFilterValue,
    columnDefs,
    defaultColDef,
    height,
    rowId,
    size,
    themeParams,
    ...someProperties
  } = properties;
  const [rowData, setRowData] = useState(value ?? []);

  const gridRef = useRef();
  // The handlers below are created once, so they read events through a ref to see the current
  // render's events rather than the first render's.
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const processedColDefs = useColDefs({ columnDefs, methods, components, gridRef });

  const getRowId = useCallback(
    (params) => {
      if (rowId && params.data[rowId] !== undefined) return params.data[rowId];
      return assignRowId(params);
    },
    [rowId]
  );

  const onRowClick = useCallback((event) => {
    if (eventsRef.current.onRowClick && !isCellControlClick(event)) {
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
    if (eventsRef.current.onCellClick && !isCellControlClick(event)) {
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
    if (eventsRef.current.onRowSelected) {
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
    if (eventsRef.current.onSelectionChanged) {
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
    if (eventsRef.current.onFilterChanged) {
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
    if (eventsRef.current.onSortChanged) {
      methods.triggerEvent({
        name: 'onSortChanged',
        event: {
          rows: getDisplayedRows(event.api),
          sort: event.api.getColumnState().filter((col) => Boolean(col.sort)),
        },
      });
    }
  }, []);

  const onCellValueChanged = useCallback(
    (event) => {
      // ag-grid has already written the edit into event.data, the edited row's own object in rowData,
      // so no write is needed here. event.rowIndex must not be used to find the row: it is the
      // displayed position, a different row once the grid is sorted or filtered.
      const newRowData = rowData.slice();
      methods.setValue(newRowData);
      setRowData(newRowData);
      methods.triggerEvent({
        name: 'onCellValueChanged',
        event: {
          field: event.colDef.field,
          newRowData,
          newValue: event.newValue,
          oldValue: event.oldValue,
          rowData: event.data,
          rowIndex: event.rowIndex,
        },
      });
    },
    [rowData]
  );

  const onRowDragEnd = useCallback(
    (event) => {
      if (event.overNode !== event.node) {
        const fromData = event.node.data;
        const toData = event.overNode.data;
        const fromIndex = rowData.indexOf(fromData);
        const toIndex = rowData.indexOf(toData);
        const newRowData = rowData.slice();
        const element = newRowData[fromIndex];
        newRowData.splice(fromIndex, 1);
        newRowData.splice(toIndex, 0, element);
        methods.setValue(newRowData);
        setRowData(newRowData);
        gridRef.current.api.clearFocusedCell();
        methods.triggerEvent({
          name: 'onRowDragEnd',
          event: {
            fromData,
            toData,
            fromIndex,
            toIndex,
            newRowData,
          },
        });
      }
    },
    [rowData]
  );

  useEffect(() => {
    methods.registerMethod('exportDataAsCsv', (args) => gridRef.current.api.exportDataAsCsv(args));
    methods.registerMethod('sizeColumnsToFit', () => gridRef.current.api.sizeColumnsToFit());
    methods.registerMethod('setFilterModel', (model) => gridRef.current.api.setFilterModel(model));
    methods.registerMethod('setQuickFilter', (filter) =>
      gridRef.current.api.setGridOption('quickFilterText', filter)
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
    if (JSON.stringify(rowData) !== JSON.stringify(value)) {
      setRowData(value);
    }
  }, [value]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <AgGridReact
        columnMenu="legacy"
        quickFilterText={quickFilterValue}
        {...someProperties}
        theme={theme}
        rowData={rowData}
        onCellClicked={onCellClicked}
        onCellValueChanged={onCellValueChanged}
        onFilterChanged={onFilterChanged}
        onRowClicked={onRowClick}
        onRowSelected={onRowSelected}
        onSelectionChanged={onSelectionChanged}
        onSortChanged={onSortChanged}
        onRowDragEnd={onRowDragEnd}
        defaultColDef={defaultColDef}
        columnDefs={processedColDefs}
        ref={gridRef}
        getRowId={getRowId}
        suppressLoadingOverlay
      />
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default AgGridInput;
