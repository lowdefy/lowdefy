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

// Every property of blocks-table's Table (its meta), by what the Table stand-in does with it. A
// test reads Table's meta and fails on a property not listed here, so a new Table feature starts
// out of the stand-in's reach until it is classed.
// - modelled: the stand-in reads it as the component does.
// - looksOnly: it changes only how the table looks or moves focus, never which rows and columns a
//   person sees or what a click on them fires.
// - browserOnly: it changes the rows or columns a person sees, or keeps state the stand-in does
//   not model; a Table that sets one leaves its row steps to the browser.
const TABLE_PROPERTIES = {
  modelled: ['columns', 'data', 'defaultColumn', 'rowKey', 'rowLink', 'user'],
  looksOnly: [
    'bordered',
    'emptyText',
    'headerMenu',
    'height',
    'keyboard',
    'loading',
    'maxHeight',
    'reorderable',
    'rowHeight',
    'rowRules',
    'rowVersionField',
    'size',
    'stickyHeader',
    'summary',
    'summaryRow',
    'toolbar',
    'virtual',
  ],
  browserOnly: [
    'activeView',
    'addColumn',
    'addRow',
    'addRowText',
    'defaultView',
    'expandable',
    'importCsv',
    'inputFieldPrefix',
    'pageSize',
    'pagination',
    'persist',
    'providers',
    'rawEndpoint',
    'rowDrag',
    'rowSelection',
    'tree',
    'viewMenu',
    'views',
  ],
};

export default TABLE_PROPERTIES;
