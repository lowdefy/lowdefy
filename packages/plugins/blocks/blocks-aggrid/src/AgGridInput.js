/*
  Copyright 2021 Lowdefy, Inc

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
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';

import processColDefs from './processColDefs.js';

const AgGridInput = ({ properties, methods, loading, events, value }) => {
  const { quickFilterValue, columnDefs, defaultColDef, ...someProperties } = properties;
  const [rowData, setRowData] = useState(value ?? []);

  const gridRef = useRef();

  const memoDefaultColDef = useMemo(() => defaultColDef);

  const getRowId = useCallback(
    (params) =>
      params.data[properties.rowId] ??
      params.data.id ??
      params.data._id ??
      JSON.stringify(params.data),
    []
  );

  const onRowClick = useCallback((event) => {
    if (events.onRowClick) {
      methods.triggerEvent({
        name: 'onRowClick',
        event: {
          row: event.data,
          selected: gridRef.current.api.getSelectedRows(),
          index: parseInt(event.node.id),
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
          index: parseInt(event.node.id),
          row: event.data,
          rowIndex: event.rowIndex,
          selected: gridRef.current.api.getSelectedRows(),
        },
      });
    }
  }, []);
  const onRowSelected = useCallback((event) => {
    if (!event.node.selected) return; // see https://stackoverflow.com/a/63265775/2453657
    if (events.onRowSelected) {
      methods.triggerEvent({
        name: 'onRowSelected',
        event: {
          index: parseInt(event.node.id),
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

  const onFilterChanged = useCallback((event) => {
    if (events.onFilterChanged) {
      methods.triggerEvent({
        name: 'onFilterChanged',
        event: {
          rows: event.api.rowModel.rowsToDisplay.map((row) => row.data),
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
          rows: event.api.rowModel.rowsToDisplay.map((row) => row.data),
          sort: event.columnApi.getColumnState().filter((col) => Boolean(col.sort)),
        },
      });
    }
  }, []);

  const onCellValueChanged = useCallback(
    (event) => {
      rowData[parseInt(event.node.id)][event.colDef.field] = event.newValue;
      methods.setValue(rowData);
      setRowData(rowData);
      methods.triggerEvent({
        name: 'onCellValueChanged',
        event: {
          field: event.colDef.field,
          index: parseInt(event.node.id),
          newRowData: rowData,
          newValue: event.newValue,
          oldValue: event.oldValue,
          rowData: event.data,
          rowIndex: event.rowIndex,
        },
      });
    },
    [rowData, value]
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
        setRowData(rowData);
        gridRef.current.api.setRowData(value);
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
    [rowData, value]
  );

  useEffect(() => {
    methods.registerMethod('exportDataAsCsv', (args) => gridRef.current.api.exportDataAsCsv(args));
    methods.registerMethod('exportDataAsCsv', (args) => gridRef.current.api.exportDataAsCsv(args));
    methods.registerMethod('sizeColumnsToFit', () => gridRef.current.api.sizeColumnsToFit());
    methods.registerMethod('setFilterModel', (model) => gridRef.current.api.setFilterModel(model));
    methods.registerMethod('setQuickFilter', (filter) =>
      gridRef.current.api.setQuickFilter(filter)
    );
    methods.registerMethod('autoSize', (args = {}) => {
      const { skipHeader, colIds } = args;
      const allColumnIds = colIds || [];
      if (!colIds) {
        gridRef.current.columnApi.getAllColumns().forEach((column) => {
          allColumnIds.push(column.getId());
        });
      }
      gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
    });
    if (gridRef.current.api) {
      if (loading) {
        gridRef.current.api.showLoadingOverlay();
      }
      if (!loading) {
        gridRef.current.api.hideOverlay();
      }
    }
  }, []);

  useEffect(() => {
    if (JSON.stringify(rowData) !== JSON.stringify(value)) {
      setRowData(value);
    }
  }, [value]);

  if (quickFilterValue && quickFilterValue === '') {
    gridRef.current.api.setQuickFilter(quickFilterValue); // check if empty string matches all
  }
  return (
    <AgGridReact
      {...someProperties}
      rowData={rowData}
      onCellClicked={onCellClicked}
      onCellValueChanged={onCellValueChanged}
      onFilterChanged={onFilterChanged}
      onRowClicked={onRowClick}
      onRowSelected={onRowSelected}
      onSelectionChanged={onSelectionChanged}
      onSortChanged={onSortChanged}
      onRowDragEnd={onRowDragEnd}
      defaultColDef={memoDefaultColDef}
      modules={[ClientSideRowModelModule, CsvExportModule]}
      columnDefs={processColDefs(columnDefs, methods)}
      ref={gridRef}
      getRowId={getRowId}
    />
  );
};

export default AgGridInput;
