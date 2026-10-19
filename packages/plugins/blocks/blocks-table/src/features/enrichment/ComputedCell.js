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
import SkeletonCell from '@lowdefy/blocks-antd/table/SkeletonCell.js';

import EnrichmentCell from './EnrichmentCell.js';
import renderColumnValue from './renderColumnValue.js';

// The enrichment module's cell renderer, for the columns the server or the browser computes
// from other columns (enrichment and ai columns with their run state, extract columns) and for
// error columns. In an optimistic new row that is still saving (`api.savingRows`), nothing is
// computed yet, whatever the column's type: every computed cell shows the same placeholder, its
// type's skeleton shape (never a type's empty "—" in some cells and blank in others). Once the
// row is saved it renders from the app's data: the run states autoRun queued, or the value.
function ComputedCell({ api, col, lead, original, rowKey }) {
  const { column } = col;
  if (column.invalid === undefined && api.savingRows?.has(original)) {
    return (
      <div className="lf-enrich-cell" data-lf-enrich-pending="">
        <SkeletonCell column={column} rowIndex={0} />
      </div>
    );
  }
  if (column.kind === 'extract') return renderColumnValue({ api, col, lead, original, rowKey });
  return <EnrichmentCell api={api} col={col} lead={lead} original={original} rowKey={rowKey} />;
}

export default ComputedCell;
