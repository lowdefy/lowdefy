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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Empty, Table } from 'antd';
import { cn, getHtmlEnhancements, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';

import compileColumns from '../../table/compileColumns.js';
import compileRules from '../../table/compileRules.js';
import createRowKeyGetter from '../../table/createRowKeyGetter.js';
import getSkeletonRowCount from '../../table/getSkeletonRowCount.js';
import isControlTarget from '../../table/isControlTarget.js';
import LoadingAnnouncer from '../../table/LoadingAnnouncer.js';
import normalizeColumns from '../../table/normalizeColumns.js';
import resolveLink from '../../table/resolveLink.js';
import resolveLoadingState from '../../table/resolveLoadingState.js';
import useHeldRows from '../../table/useHeldRows.js';
import useSkeletonTiming from '../../table/useSkeletonTiming.js';
import buildAntdColumns from './buildAntdColumns.js';
import sortRows from './sortRows.js';
import TableLightSummary from './TableLightSummary.js';
import useHeaderBottom from './useHeaderBottom.js';
import validateTableLightProperties from './validateTableLightProperties.js';
import './tableLight.css';

// Table's density names mapped to antd Table sizes.
const ANTD_SIZES = { compact: 'small', default: 'middle', comfortable: 'large' };
// antd's row heights at each size (cell padding, one 22px line and the row border), for the
// number of skeleton rows that fill the body.
const ANTD_ROW_HEIGHTS = { small: 39, middle: 47, large: 55 };
// The height a table without `height` fills with skeleton rows: Table's default `maxHeight`, so
// both types show the same skeleton.
const DEFAULT_SKELETON_HEIGHT = 600;
const DEV_ROW_LIMIT = 1000;

const DRAG_DISTANCE = 4;

function getSelectedText() {
  const selection = window.getSelection();
  if (selection === null || selection.isCollapsed) return '';
  return selection.toString();
}

// Dragging to select text (or double-clicking a word) ends in a click; that
// click must not open the row. A click that only clears an earlier selection
// still counts, so the selection is compared with the one at pointer down.
function isSelectingClick({ event, pointerDown }) {
  if (
    pointerDown !== null &&
    Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > DRAG_DISTANCE
  ) {
    return true;
  }
  const selected = getSelectedText();
  return selected !== '' && selected !== (pointerDown?.selected ?? '');
}

function getPagination(properties) {
  if (properties.pagination === false) return false;
  return {
    pageSize: properties.pageSize ?? 50,
    // Auto: the pager shows only when the rows need more than one page.
    hideOnSinglePage: properties.pagination !== true,
    showSizeChanger: false,
  };
}

function getSkeletonRows({ properties, size }) {
  const rowHeight = ANTD_ROW_HEIGHTS[size];
  const height = type.isNumber(properties.height) ? properties.height : DEFAULT_SKELETON_HEIGHT;
  const count = getSkeletonRowCount({
    bodyHeight: height - rowHeight,
    rowHeight,
    pageSize: properties.pagination === false ? null : properties.pageSize ?? 50,
  });
  return Array.from({ length: count }, (_, index) => ({ __lfSkeleton: `__skeleton_${index}` }));
}

function getEmptyText({ properties, methods }) {
  return (
    <Empty
      description={renderHtml({ html: properties.emptyText ?? 'No rows', methods })}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  );
}

// Loading follows Table's model (D17) with antd's Table: no spinner overlay. With no rows yet the
// real header sits over type-shaped skeleton rows (shown after 120 ms, for at least 300 ms); with
// rows, a refetch keeps them (held while `data` is null) and a progress bar runs under the header.
// Switching `type` between TableLight and Table therefore looks the same.
function TableLightBlock({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  methods,
  properties,
  styles = {},
}) {
  validateTableLightProperties({ properties });
  const loadingSignal = loading === true || properties.loading === true;
  const data = useHeldRows({ data: properties.data, loading: loadingSignal });
  const loadingState = resolveLoadingState({
    loading: loadingSignal,
    sourceCount: data.length,
    displayCount: data.length,
  });
  const skeletonPhase = useSkeletonTiming({ active: loadingState === 'initial', id: blockId });
  const showSkeleton = loadingState === 'initial' || skeletonPhase === 'holding';
  const busy = loadingState === 'refreshing';
  const size = ANTD_SIZES[properties.size ?? 'default'];
  const blockRef = useRef(null);
  const headerBottom = useHeaderBottom({ ref: blockRef, active: busy || showSkeleton });

  // The engine hands the block new property objects whenever anything in them
  // changes, so the columns are compiled per config content, not per object.
  const configKey = JSON.stringify([
    properties.columns,
    properties.defaultColumn,
    properties.rowRules,
    properties.user,
  ]);
  const config = useMemo(() => {
    const normalized = normalizeColumns({
      columns: properties.columns,
      defaultColumn: properties.defaultColumn,
    });
    // Blocks do not see the session: `$user` in conditions reads the `user` property.
    const columns = compileColumns({
      columns: normalized.columns,
      columnsByKey: normalized.columnsByKey,
      user: properties.user,
    });
    return {
      columns,
      compiledByKey: Object.fromEntries(columns.map((column) => [column.key, column])),
      headerGroups: normalized.headerGroups,
      rowRules: compileRules({
        rules: properties.rowRules,
        columnsByKey: normalized.columnsByKey,
        user: properties.user,
      }),
    };
  }, [configKey]);

  const getRowKey = useMemo(
    () => createRowKeyGetter({ rowKey: properties.rowKey }),
    [properties.rowKey]
  );
  const [sort, setSort] = useState(null);
  const pointerDownRef = useRef(null);

  const rows = useMemo(
    () => sortRows({ rows: data, sort, columnsByKey: config.compiledByKey }),
    [data, sort, config]
  );
  const rowsByKey = useMemo(() => {
    const map = new Map();
    data.forEach((row, index) => {
      const rowKey = getRowKey(row);
      map.set(String(rowKey), { row, rowKey, index });
    });
    return map;
  }, [data, getRowKey]);

  const onEvent = useCallback(
    ({ name, event }) => methods.triggerEvent({ name, event }),
    [methods]
  );

  const columns = useMemo(
    () =>
      buildAntdColumns({
        nodes: config.headerGroups,
        compiledByKey: config.compiledByKey,
        sort,
        getRowKey,
        methods,
        components,
        onEvent,
        skeleton: showSkeleton,
      }),
    [config, sort, getRowKey, methods, components, onEvent, showSkeleton]
  );
  const skeletonRows = useMemo(
    () => (showSkeleton ? getSkeletonRows({ properties, size }) : null),
    [showSkeleton, properties.height, properties.pageSize, properties.pagination, size]
  );

  const overRowLimit = data.length > DEV_ROW_LIMIT;
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !overRowLimit) return;
    // eslint-disable-next-line no-console
    console.warn(
      `TableLight "${blockId}" renders every row; use Table above ~1,000 rows (this one has ${data.length}).`
    );
  }, [overRowLimit, blockId]);

  const hasRowLink = type.isObject(properties.rowLink);
  const hasRowClick = !type.isNone(events.onRowClick);

  function openRowLink({ row, newTab }) {
    const link = resolveLink({ link: properties.rowLink, row });
    // The client registers the same link function the Link action uses, so router navigation,
    // new tabs and page input behave as they do for a Link.
    getHtmlEnhancements().link({ ...link, newTab: newTab || link.newTab === true });
  }

  function getRowEntry(event) {
    const rowElement = event.target.closest('tr[data-row-key]');
    if (rowElement === null || !event.currentTarget.contains(rowElement)) return null;
    if (isControlTarget({ target: event.target, container: rowElement })) return null;
    if (isSelectingClick({ event, pointerDown: pointerDownRef.current })) return null;
    const entry = rowsByKey.get(rowElement.getAttribute('data-row-key'));
    if (type.isUndefined(entry)) return null;
    return { ...entry, rowElement };
  }

  // One listener for the whole table resolves the row and cell from the DOM,
  // instead of a handler per row or cell.
  function handleClick(event) {
    const entry = getRowEntry(event);
    if (entry === null) return;
    const { row, rowKey, index, rowElement } = entry;
    const cellElement = event.target.closest('td[data-col-key]');
    if (
      !type.isNone(events.onCellClick) &&
      cellElement !== null &&
      rowElement.contains(cellElement)
    ) {
      const column = config.compiledByKey[cellElement.getAttribute('data-col-key')];
      methods.triggerEvent({
        name: 'onCellClick',
        event: {
          row,
          rowKey,
          column: { key: column.key, field: column.field },
          value: get(row, column.field),
        },
      });
    }
    if (hasRowClick) {
      methods.triggerEvent({ name: 'onRowClick', event: { row, rowKey, index } });
    }
    if (hasRowLink) {
      const newTab = event.metaKey || event.ctrlKey || event.shiftKey;
      // With onRowClick as well, a plain click is the app's (a peek, say) and
      // only a modified click follows the link.
      if (newTab || !hasRowClick) openRowLink({ row, newTab });
    }
  }

  function handleAuxClick(event) {
    if (event.button !== 1 || !hasRowLink) return;
    const entry = getRowEntry(event);
    if (entry === null) return;
    event.preventDefault();
    openRowLink({ row: entry.row, newTab: true });
  }

  const rowClassName = cn('lf-table-row', (hasRowLink || hasRowClick) && 'lf-table-row-clickable');
  const visibleColumns = config.columns.filter((column) => !column.hidden);
  const showSummary =
    !showSkeleton &&
    properties.summary !== false &&
    visibleColumns.some((column) => !type.isNone(column.aggregate));
  const hasHeight = !type.isNone(properties.height);

  return (
    <div
      aria-busy={showSkeleton || busy ? true : undefined}
      id={blockId}
      className={cn('lf-table-light-block', classNames.element)}
      data-busy={busy ? '' : undefined}
      data-loading-state={showSkeleton ? 'initial' : loadingState}
      data-skeleton-hidden={showSkeleton && skeletonPhase === 'hidden' ? '' : undefined}
      ref={blockRef}
      style={styles.element}
      onMouseDown={(event) => {
        pointerDownRef.current = {
          x: event.clientX,
          y: event.clientY,
          selected: getSelectedText(),
        };
      }}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
    >
      <Table
        className="lf-table-light"
        columns={columns}
        dataSource={showSkeleton ? skeletonRows : rows}
        rowKey={showSkeleton ? '__lfSkeleton' : getRowKey}
        rowHoverable={false}
        rowClassName={
          showSkeleton || config.rowRules === null
            ? rowClassName
            : (row) => cn(rowClassName, config.rowRules(row)?.className)
        }
        onRow={
          showSkeleton || config.rowRules === null
            ? undefined
            : (row) => ({ style: config.rowRules(row)?.style })
        }
        onChange={(pagination, filters, sorter, extra) => {
          if (extra.action !== 'sort' || showSkeleton) return;
          if (type.isNone(sorter.order)) {
            setSort(null);
            return;
          }
          setSort({ key: sorter.columnKey, desc: sorter.order === 'descend' });
        }}
        showSorterTooltip={{ target: 'sorter-icon' }}
        pagination={getPagination(properties)}
        size={size}
        bordered={properties.bordered === true}
        scroll={{ x: true, y: properties.height }}
        locale={{ emptyText: getEmptyText({ properties, methods }) }}
        summary={
          showSummary
            ? () => <TableLightSummary columns={visibleColumns} rows={rows} fixed={hasHeight} />
            : undefined
        }
      />
      {showSkeleton && headerBottom !== null ? (
        <div
          className="lf-table-shimmer"
          style={{ top: headerBottom, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}
      {busy && headerBottom !== null ? (
        <div className="lf-table-light-bar" style={{ top: headerBottom - 2 }}>
          <div className="lf-table-loading-bar" />
        </div>
      ) : null}
      <LoadingAnnouncer count={data.length} state={showSkeleton ? 'initial' : loadingState} />
    </div>
  );
}

export default withBlockDefaults(TableLightBlock);
