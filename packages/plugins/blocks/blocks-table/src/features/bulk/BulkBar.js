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

import React from 'react';
import { Button } from 'antd';

import renderSlot from '../../core/renderSlot.js';

import './bulk.css';

const numberFormat = new Intl.NumberFormat();

// "N selected · Select all M matching · Clear", the features' `bulkItems` (enrichment's "Run
// selected"), plus the `bulkActions` slot (Linear, Attio). It sits below the grid, so rows never
// move under the pointer when it appears. Bulk actions need rows, so the bar waits while the
// table loads its first rows.
function BulkBar({ api, matching, selected, selectionMode }) {
  const { content } = api;
  if (api.loadingState === 'initial') return null;
  const canSelectAll =
    api.config.rowSelection.type === 'checkbox' && selectionMode !== 'all' && selected < matching;
  return (
    <div aria-label="Bulk actions" className="lf-table-bulk-bar" data-lf-bulk-bar="" role="toolbar">
      <span className="lf-table-bulk-count" data-lf-bulk-count="">
        {numberFormat.format(selected)} selected
      </span>
      {canSelectAll ? (
        <Button
          data-lf-bulk-action="select-all"
          onClick={() => api.actions.selectAllMatching()}
          size="small"
          type="link"
        >
          Select all {numberFormat.format(matching)} matching
        </Button>
      ) : null}
      <Button
        data-lf-bulk-action="clear"
        onClick={() => api.actions.clearSelection()}
        size="small"
        type="link"
      >
        Clear
      </Button>
      {api.features.bulkItems.map((Item, index) => (
        <Item api={api} key={index} />
      ))}
      {content.bulkActions ? (
        <div className="lf-table-bulk-actions">{renderSlot({ content, slot: 'bulkActions' })}</div>
      ) : null}
    </div>
  );
}

export default BulkBar;
