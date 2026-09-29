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

import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import buildNewRowValues from './buildNewRowValues.js';
import getInputColumns from './getInputColumns.js';
import NewRowField from './NewRowField.js';

const EMPTY = {};

function isSelectTarget(target) {
  return Boolean(target.closest('.ant-select'));
}

// Table's "+ New row" (`addRow: true`): a row under the grid that opens an inline editor for
// the input columns. Enter (or Add) commits it through addNewRow: the row shows in the table,
// saving, while onRowAdd runs; on success the editor clears for the next row, on failure it
// keeps the values and shows the error. Esc (or Cancel) closes it. The antd controls mount only
// while it is open.
function NewRow({ api }) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(0);
  const { columns } = api.config;
  const inputColumns = useMemo(
    () =>
      getInputColumns(columns).map((column) => ({ ...column, title: htmlToText(column.title) })),
    [columns]
  );
  const text = api.config.enrichment.addRowText ?? 'New row';

  if (!open) {
    return (
      <button
        className="lf-table-add-row"
        data-lf-new-row=""
        onClick={() => setOpen(true)}
        type="button"
      >
        <span aria-hidden="true" className="lf-table-add-row-icon">
          +
        </span>
        {text}
      </button>
    );
  }

  async function commit() {
    const built = buildNewRowValues({ columns: inputColumns, drafts });
    if (built.error) {
      setError(built.error);
      return;
    }
    if (Object.keys(built.values).length === 0) {
      setError('Enter a value first.');
      return;
    }
    const submitted = drafts;
    setDrafts(EMPTY);
    setError(null);
    setSaving((count) => count + 1);
    const failure = await api.actions.addNewRow({ values: built.values });
    setSaving((count) => count - 1);
    if (failure !== null) {
      setDrafts(submitted);
      setError(failure);
    }
  }
  function close() {
    setOpen(false);
    setDrafts(EMPTY);
    setError(null);
  }
  function onKeyDown(event) {
    if (event.key === 'Escape' && !isSelectTarget(event.target)) {
      event.preventDefault();
      close();
    } else if (event.key === 'Enter' && !isSelectTarget(event.target)) {
      event.preventDefault();
      commit();
    }
  }

  return (
    <div
      aria-label="New row"
      className="lf-enrich-new-row"
      data-lf-new-row-editor=""
      onKeyDown={onKeyDown}
      role="group"
    >
      <div className="lf-enrich-new-row-fields">
        {inputColumns.map((column, index) => (
          <label
            className="lf-enrich-new-row-field"
            data-lf-new-row-field={column.key}
            key={column.key}
          >
            <span className="lf-enrich-new-row-label">{column.title}</span>
            <NewRowField
              autoFocus={index === 0}
              column={column}
              onChange={(value) => setDrafts((current) => ({ ...current, [column.key]: value }))}
              value={drafts[column.key]}
            />
          </label>
        ))}
      </div>
      <div className="lf-enrich-new-row-actions">
        <Button data-lf-new-row-submit="" onClick={commit} size="small" type="primary">
          Add
        </Button>
        <Button data-lf-new-row-cancel="" onClick={close} size="small">
          Cancel
        </Button>
        {saving > 0 ? (
          <span className="lf-enrich-new-row-saving" data-lf-new-row-saving="">
            <span aria-hidden="true" className="lf-enrich-spinner" />
            Saving…
          </span>
        ) : null}
        {error ? (
          <span className="lf-enrich-new-row-error" data-lf-new-row-error="" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default NewRow;
