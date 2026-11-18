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

import columnNeedsEditing from '@lowdefy/blocks-antd/table/columnNeedsEditing.js';
import columnNeedsEnrichment from '@lowdefy/blocks-antd/table/columnNeedsEnrichment.js';
import createRowKeyGetter from '@lowdefy/blocks-antd/table/createRowKeyGetter.js';
import readColumnValue from '@lowdefy/blocks-antd/table/readColumnValue.js';
import resolveLink from '@lowdefy/blocks-antd/table/resolveLink.js';
import someColumnConfig from '@lowdefy/blocks-antd/table/someColumnConfig.js';
import { journeyTargetSelectors, type } from '@lowdefy/helpers';

import createGridStandIn from './createGridStandIn.js';
import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import htmlHoldsCellControl from './htmlHoldsCellControl.js';
import listTableControls from './listTableControls.js';
import readHtmlCell from './readHtmlCell.js';
import readTableColumns from './readTableColumns.js';
import registerBrowserOnlyMethods from './registerBrowserOnlyMethods.js';
import TABLE_METHODS from './TABLE_METHODS.js';
import TABLE_PROPERTIES from './TABLE_PROPERTIES.js';

// What blocks-table's Table does for a row or a cell control, headless, through blocks-antd's
// shared table helpers, as blocks-table chains them (useTableConfig, handleRowClick,
// createActivateRow, openRowLink).

const MODELLED = new Set([...TABLE_PROPERTIES.modelled, ...TABLE_PROPERTIES.looksOnly]);

// Cells that draw a link (CellLink, an anchor), which a click on the cell lands on.
const LINK_CELL_TYPES = new Set(['avatar', 'email', 'link', 'phone', 'relation', 'url']);

// Column configs that load one of Table's optional features, which own clicks on their cells or
// edit them, by blocks-table's own rules (needsEnrichment and needsEditing test each column with
// these): an enrichment, ai or extract column, a run state, a user-defined column, an editable one.
// TABLE_COLUMN_KEYS classes every column key by whether it can load one.
const COLUMN_FEATURES = [
  { what: 'enrichment columns', test: columnNeedsEnrichment },
  { what: 'an editable column', test: columnNeedsEditing },
];

// A property set to anything but false turns its feature on.
function isOn(value) {
  return !type.isNone(value) && value !== false;
}

// What makes the rows or columns a person sees differ from the data and columns, or keeps state
// the stand-in does not model: a property outside the modelled and looks-only ones
// (TABLE_PROPERTIES; one no list classes counts too), server data, a column that loads enrichment
// or editing, or a view in the block's value (a sort, filter, search or column change the table
// wrote, or the app set).
function findTableFeature(block) {
  const properties = block.eval.properties ?? {};
  const property = Object.keys(properties).find(
    (name) => !MODELLED.has(name) && isOn(properties[name])
  );
  if (!type.isUndefined(property)) {
    return `\`${property}\``;
  }
  if (!type.isNone(properties.data) && !type.isArray(properties.data)) {
    return 'server data';
  }
  const columnFeature = COLUMN_FEATURES.find(({ test }) => someColumnConfig({ properties, test }));
  if (!type.isUndefined(columnFeature)) {
    return columnFeature.what;
  }
  const view = block.value?.view;
  if (type.isObject(view) && Object.keys(view).length > 0) {
    return 'a view in its value';
  }
  return null;
}

// An html cell's html (HtmlCell) can hold a link or a data-event element, which a click on the
// cell lands on. Plain formatted html leaves the click to the cell.
async function htmlCellBrowserOnly({ block, column, entry }) {
  const html = readHtmlCell({ column: column.column, row: entry.row });
  if (html === null || !(await htmlHoldsCellControl(html))) {
    return null;
  }
  return `Column "${column.id}" of ${describeBlock(block)} has an html cell holding a link or data-event, which the headless stand-in does not model: the step runs in a browser.`;
}

async function columnBrowserOnly({ block, column, entry }) {
  const cellType = column.column.type;
  if (cellType === 'html') {
    return htmlCellBrowserOnly({ block, column, entry });
  }
  if (!LINK_CELL_TYPES.has(cellType)) {
    return null;
  }
  return `Column "${column.id}" of ${describeBlock(block)} is a ${cellType} cell, which draws a link a click lands on: the step runs in a browser.`;
}

// A link the row's values fill in (resolveLink), followed through the engine's link, as Link does.
// A link that opens a new tab leaves this page where it is.
function followRowLink({ block, row, rowLink }) {
  const link = resolveLink({ link: rowLink, row });
  if (link.newTab === true) {
    return;
  }
  block.context._internal.lowdefy._internal.link(link);
}

// onCellClick (when defined), then the row's activation: onRowClick when defined, else the
// rowLink when set (handleRowClick, createActivateRow). index is the row's index in the data.
function clickCell({ actor, block, column, entry }) {
  const { events } = block.Events;
  const { row, rowKey, index } = entry;
  if (Object.hasOwn(events, 'onCellClick')) {
    fireEvent({
      actor,
      block,
      name: 'onCellClick',
      event: {
        row,
        rowKey,
        column: { key: column.column.key, field: column.column.field },
        value: readColumnValue({ column: column.column, row }),
      },
    });
  }
  if (Object.hasOwn(events, 'onRowClick')) {
    fireEvent({ actor, block, name: 'onRowClick', event: { row, rowKey, index } });
    return;
  }
  const { rowLink } = block.eval.properties;
  if (type.isObject(rowLink)) {
    followRowLink({ block, row, rowLink });
  }
}

function readGrid({ actor, block }) {
  const feature = findTableFeature(block);
  const grid = {
    browserOnly: null,
    rows: [],
    columns: [],
    columnBrowserOnly: ({ column, entry }) => columnBrowserOnly({ block, column, entry }),
    listControls: ({ column, entry }) => listTableControls({ actor, block, column, entry }),
    clickCell: ({ column, entry }) => clickCell({ actor, block, column, entry }),
  };
  if (feature !== null) {
    grid.browserOnly = `${describeBlock(block)} uses ${feature}, which the headless stand-in does not model: the step runs in a browser.`;
    return grid;
  }
  const properties = block.eval.properties ?? {};
  const getRowKey = createRowKeyGetter({ rowKey: properties.rowKey });
  grid.rows = (properties.data ?? []).map((row, index) => {
    const rowKey = getRowKey(row);
    return {
      row,
      rowKey,
      key: journeyTargetSelectors.isGeneratedRowKey(rowKey) ? null : rowKey,
      index,
    };
  });
  grid.columns = readTableColumns(properties);
  return grid;
}

function registerMethods({ actor, block }) {
  registerBrowserOnlyMethods({ actor, block, methods: TABLE_METHODS });
}

export default {
  ...createGridStandIn({ fix: 'give rows an `_id` or `id`, or set `rowKey`', readGrid }),
  registerMethods,
};
