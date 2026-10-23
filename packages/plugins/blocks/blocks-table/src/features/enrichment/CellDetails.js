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

import React, { useEffect, useState } from 'react';
import { Button, Drawer } from 'antd';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';
import renderCell from '@lowdefy/blocks-antd/table/renderCell.js';

import fetchCellRaw from './fetchCellRaw.js';
import formatCost from './formatCost.js';
import formatJsonPreview from './formatJsonPreview.js';
import formatRunDuration from './formatRunDuration.js';
import formatRunTime from './formatRunTime.js';
import getInputRows from './getInputRows.js';
import getRunState from './getRunState.js';
import JsonTree from './JsonTree.js';

const STATUS_LABELS = {
  none: 'Not run',
  queued: 'Queued',
  running: 'Running',
  ok: 'Done',
  error: 'Error',
  empty: 'No result',
};

function Section({ children, name, title }) {
  return (
    <section className="lf-enrich-details-section" data-lf-details-section={name}>
      <h4 className="lf-enrich-details-heading">{title}</h4>
      {children}
    </section>
  );
}

// The run's times, with how long it took beside its finish time ("took 1.2 s").
function Timings({ state }) {
  const duration = formatRunDuration({
    startedAt: state?.startedAt,
    finishedAt: state?.finishedAt,
  });
  const rows = [
    ['Queued', formatRunTime(state?.queuedAt)],
    ['Started', formatRunTime(state?.startedAt)],
    ['Finished', formatRunTime(state?.finishedAt), duration],
    ['Attempts', state?.attempts ?? null],
    ['Cost', formatCost(state?.cost)],
  ].filter(([, value]) => value !== null && value !== undefined);
  if (rows.length === 0) return <p className="lf-enrich-muted">Not run yet.</p>;
  return (
    <dl className="lf-enrich-details-list" data-lf-details-timings="">
      {rows.map(([label, value, took]) => (
        <React.Fragment key={label}>
          <dt>{label}</dt>
          <dd>
            <span data-lf-details-timing={label.toLowerCase()}>{value}</span>
            {took ? (
              <span className="lf-enrich-muted" data-lf-details-duration="">
                {` · took ${took}`}
              </span>
            ) : null}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function Inputs({ rows }) {
  if (rows.length === 0) return <p className="lf-enrich-muted">No inputs.</p>;
  return (
    <dl className="lf-enrich-details-list" data-lf-details-inputs="">
      {rows.map((input) => (
        <React.Fragment key={input.param}>
          <dt data-lf-details-input-label={input.param}>
            {input.label}
            <span className="lf-enrich-details-source">
              {input.literal ? ' =' : ` ← ${input.columnTitle}`}
            </span>
          </dt>
          <dd data-lf-details-input={input.param}>
            {input.missing ? (
              <span className="lf-enrich-muted">Missing</span>
            ) : (
              formatJsonPreview(input.value)
            )}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number') return 'unknown size';
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

// A raw result over the server's size cap is stored as `{ _truncated, bytes, maxBytes, preview }`.
function TruncatedRaw({ raw }) {
  const preview =
    typeof raw.preview === 'string' ? raw.preview : JSON.stringify(raw.preview, null, 2);
  return (
    <div data-lf-details-truncated="">
      <p className="lf-enrich-muted">
        {`The raw result was too large to keep (${formatBytes(
          raw.bytes
        )}; the limit is ${formatBytes(
          raw.maxBytes
        )}). Only its start is stored, so its values cannot be added as columns.`}
      </p>
      {preview ? <pre className="lf-enrich-details-preview">{preview}</pre> : null}
    </div>
  );
}

// The raw result tree, its root named after the column that ran (the extract source for an
// extract cell).
function RawResult({ api, raw, source }) {
  if (raw === undefined || raw === null) return <p className="lf-enrich-muted">No raw result.</p>;
  if (raw._truncated === true) return <TruncatedRaw raw={raw} />;
  return (
    <JsonTree
      label={htmlToText(source.title)}
      onAdd={({ path, value }) => api.actions.addExtractColumn({ source: source.key, path, value })}
      value={raw}
    />
  );
}

const FINISHED = new Set(['ok', 'empty', 'error']);

// The raw result as the row holds it, or, for a table with a `rawEndpoint` whose rows carry their
// cells without it, loaded from that endpoint when the panel opens and again when the cell
// finishes a new run.
function RawSection({ api, run, rowKey, source }) {
  const endpoint = api.config.enrichment.rawEndpoint;
  const stored = run.state ? run.state.raw : undefined;
  const fetchable = endpoint !== null && stored === undefined && FINISHED.has(run.status);
  const finishedAt = run.state?.finishedAt ?? null;
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (!fetchable) return undefined;
    let live = true;
    setFetched(null);
    fetchCellRaw({ api, endpoint, rowKey, key: source.key }).then((answer) => {
      if (live) setFetched(answer);
    });
    return () => {
      live = false;
    };
  }, [fetchable, endpoint, rowKey, source.key, finishedAt]);
  if (!fetchable) return <RawResult api={api} raw={stored} source={source} />;
  if (fetched === null) {
    return (
      <p className="lf-enrich-muted" data-lf-details-raw-loading="">
        Loading the raw result…
      </p>
    );
  }
  if (fetched.error) {
    return (
      <p className="lf-enrich-details-error" data-lf-details-raw-error="">
        {fetched.error}
      </p>
    );
  }
  return <RawResult api={api} raw={fetched.raw} source={source} />;
}

function renderBody({ api, column, row, rowId }) {
  const { columnsByKey } = api.config;
  const runColumn = column.kind === 'extract' ? columnsByKey.get(column.source) : column;
  const run = getRunState({ column: runColumn, row });
  const inputRows = getInputRows({
    column: runColumn,
    row,
    columnsByKey,
    provider: api.config.enrichment.providersById.get(runColumn.provider),
  });
  const rowKey = api.config.getKey(row);
  return (
    <>
      <Section name="status" title="Status">
        <span className="lf-enrich-details-status" data-lf-details-status={run.status}>
          {STATUS_LABELS[run.status]}
          {run.stale ? ' · inputs changed since it ran' : null}
        </span>
        {api.events.onCellRun ? (
          <Button
            data-lf-details-rerun=""
            onClick={() => api.actions.runCell({ rowId, key: runColumn.key })}
            size="small"
          >
            Rerun
          </Button>
        ) : null}
      </Section>
      {column.kind === 'extract' ? (
        <p className="lf-enrich-muted" data-lf-details-extract="">
          {`Extracts "${column.extractPath || 'the whole result'}" from ${htmlToText(
            runColumn.title
          )}.`}
        </p>
      ) : null}
      <Section name="value" title="Value">
        <div className="lf-enrich-details-value" data-lf-details-value="">
          {renderCell({
            column,
            row,
            rowKey,
            methods: api.methods,
            components: api.components,
            onEvent: api.onCellEvent,
          })}
        </div>
      </Section>
      {run.state?.error ? (
        <Section name="error" title="Error">
          <p className="lf-enrich-details-error" data-lf-details-error="">
            {run.state.error}
          </p>
        </Section>
      ) : null}
      <Section name="timings" title="Timings">
        <Timings state={run.state} />
      </Section>
      <Section name="inputs" title="Inputs">
        <Inputs rows={inputRows} />
      </Section>
      <Section name="raw" title="Raw result">
        <RawSection api={api} run={run} rowKey={rowKey} source={runColumn} />
      </Section>
    </>
  );
}

// The cell details panel (design E6): an antd Drawer beside the table, loaded and mounted only
// while open, reading the row live (a push update shows at once). It shows the run's status
// (with Rerun, onCellRun), the value through the column's type, the error, the timings and
// cost, the inputs the value was computed from, and the raw result as a JSON tree whose nodes
// can each be added as an extract column (onColumnAdd), loaded from `rawEndpoint` when the rows
// leave it out. For an extract cell it shows its source column's run.
function CellDetails({ api, details }) {
  const column = api.config.columnsByKey.get(details.key);
  const row = api.table.getRow(details.rowId, true)?.original;
  const close = () => api.actions.closeOverlay({ name: 'details' });
  return (
    <Drawer
      mask={false}
      onClose={close}
      open
      rootClassName="lf-enrich-drawer"
      size={440}
      title={column ? htmlToText(column.title) : 'Cell'}
    >
      <div
        className="lf-enrich-details"
        data-lf-cell-details={details.key}
        data-row-id={details.rowId}
      >
        {column && row ? (
          renderBody({ api, column, row, rowId: details.rowId })
        ) : (
          <p className="lf-enrich-muted">This row is no longer loaded.</p>
        )}
      </div>
    </Drawer>
  );
}

export default CellDetails;
