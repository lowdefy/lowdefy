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
import renderCell from '@lowdefy/blocks-antd/table/renderCell.js';

import getRunState from './getRunState.js';
import LAZY_CELL_TYPES from '../../core/lazyCellTypes.js';
import LazyCell from '../../core/LazyCell.js';
import RunError from './RunError.js';
import RunIcon from './RunIcon.js';

const ERROR_FALLBACK = 'The run failed.';

function renderValue({ api, col, original, rowKey }) {
  if (LAZY_CELL_TYPES.has(col.column.type)) {
    return <LazyCell api={api} col={col} original={original} rowKey={rowKey} />;
  }
  return renderCell({
    column: col.column,
    row: original,
    rowKey,
    methods: api.methods,
    components: api.components,
    onEvent: api.onCellEvent,
  });
}

function renderRerun({ api, col }) {
  const label = 'Inputs changed since this ran. Rerun';
  if (!api.events.onCellRun) {
    return (
      <span aria-label="Inputs changed since this ran" className="lf-enrich-stale-mark" role="img">
        <RunIcon name="rerun" />
      </span>
    );
  }
  return (
    <button
      aria-label={label}
      className="lf-enrich-rerun"
      data-lf-enrich-rerun={col.key}
      tabIndex={-1}
      title={label}
      type="button"
    >
      <RunIcon name="rerun" />
    </button>
  );
}

function renderState({ api, col, original, rowKey, run }) {
  switch (run.status) {
    case 'queued': {
      // Queued behind a column it reads (the server's `waitingFor`): it runs once that is done.
      const waitingFor = run.state.waitingFor ?? [];
      const waiting = waitingFor.length > 0;
      return (
        <span
          className="lf-enrich-state"
          title={waiting ? `Waiting for ${waitingFor.join(', ')}` : undefined}
        >
          <RunIcon name="queued" />
          <span className="lf-enrich-label">{waiting ? 'Waiting' : 'Queued'}</span>
        </span>
      );
    }
    case 'running':
      return (
        <span className="lf-enrich-state">
          <span aria-hidden="true" className="lf-enrich-spinner" />
          <span className="lf-enrich-label">Running</span>
        </span>
      );
    case 'error':
      return (
        <RunError api={api} message={run.state.error ?? ERROR_FALLBACK} rowId={String(rowKey)} />
      );
    case 'empty':
      // A missing input leaves the cell empty with the reason (`Missing input: <column>`).
      return (
        <span className="lf-enrich-state lf-enrich-label" title={run.state.error ?? undefined}>
          No result
        </span>
      );
    default:
      return renderValue({ api, col, original, rowKey });
  }
}

// An enrichment or ai cell (design E6), tier 0: the value through the column's type when the run
// is done (`ok`, or a cell that never ran), otherwise its state: a clock (queued, or "Waiting"
// while it waits for a column it reads), a spinner
// (running), a red marker with the message on hover (error) or "No result" (empty). A done cell
// whose inputs changed since it ran (stale: its `inputHash` differs from the row's current
// inputs) shows dimmed with a rerun button. `data-lf-enrich-status` carries the state. An error
// column (`invalid`: a user-defined column whose config is invalid) shows the reason instead.
function EnrichmentCell({ api, col, original, rowKey }) {
  const reason = col.column.invalid;
  if (reason !== undefined) {
    return (
      <div className="lf-enrich-cell" data-lf-enrich-invalid="">
        <span className="lf-enrich-invalid" title={reason}>
          Invalid column: {reason}
        </span>
      </div>
    );
  }
  const run = getRunState({ column: col.column, row: original });
  return (
    <div
      className="lf-enrich-cell"
      data-lf-enrich-stale={run.stale ? '' : undefined}
      data-lf-enrich-status={run.status}
    >
      {renderState({ api, col, original, rowKey, run })}
      {run.stale ? renderRerun({ api, col }) : null}
    </div>
  );
}

export default EnrichmentCell;
