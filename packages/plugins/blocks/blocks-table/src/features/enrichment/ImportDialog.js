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
import { Alert, Button, Modal, Progress, Select } from 'antd';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import buildImportRows from './buildImportRows.js';
import getInputColumns from './getInputColumns.js';
import matchCsvHeaders, { NEW_COLUMN, SKIP_COLUMN } from './matchCsvHeaders.js';
import readCsvFile from './readCsvFile.js';

const numberFormat = new Intl.NumberFormat();

function FileStep({ onParsed }) {
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(false);
  async function onChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setReading(true);
    let records;
    // The file is the user's: one too large, with too many rows, or unreadable is a message.
    try {
      records = await readCsvFile({ file });
    } catch (readError) {
      setError(readError.message);
      return;
    } finally {
      setReading(false);
    }
    if (records.length < 2) {
      setError('The file has no rows under its header line.');
      return;
    }
    onParsed({ name: file.name, headers: records[0], records: records.slice(1) });
  }
  return (
    <div className="lf-enrich-import-file">
      <p>Choose a CSV file. Its first line names the columns.</p>
      <input
        accept=".csv,text/csv"
        data-lf-import-file=""
        disabled={reading}
        onChange={onChange}
        type="file"
      />
      {reading ? <p data-lf-import-reading="">Reading the file…</p> : null}
      {error ? <Alert data-lf-import-error="" showIcon title={error} type="error" /> : null}
    </div>
  );
}

const SUGGESTION_LABELS = {
  synonym: 'Suggested',
  similar: 'Close match',
};

// A note beside a header's column while it still holds a suggestion that is not the column's own
// name: "Suggested" (a synonym, "Website" for "Company domain") or "Close match" (a spelling).
// Choosing another column in the select removes it.
function SuggestionNote({ suggestion, target }) {
  const label = SUGGESTION_LABELS[suggestion?.reason];
  if (label === undefined || suggestion.target !== target) return null;
  return (
    <span
      className="lf-enrich-import-suggestion"
      data-lf-import-suggestion={suggestion.reason}
      title="Matched from the CSV header. Choose another column to change it."
    >
      {label}
    </span>
  );
}

function MappingStep({ columns, csv, mapping, setMapping, suggestions }) {
  const options = [
    ...columns.map((column) => ({ value: column.key, label: htmlToText(column.title) })),
    { value: NEW_COLUMN, label: 'New text column' },
    { value: SKIP_COLUMN, label: 'Skip' },
  ];
  return (
    <div className="lf-enrich-import-map">
      <p>
        {numberFormat.format(csv.records.length)} rows in {csv.name}. Choose where each CSV column
        goes.
      </p>
      <table className="lf-enrich-import-table">
        <thead>
          <tr>
            <th>CSV column</th>
            <th>First row</th>
            <th>Column</th>
          </tr>
        </thead>
        <tbody>
          {csv.headers.map((header, index) => (
            <tr data-lf-import-header={header} key={index}>
              <td>{header || <em>(no header)</em>}</td>
              <td className="lf-enrich-muted">{csv.records[0]?.[index] ?? ''}</td>
              <td>
                <div className="lf-enrich-import-target">
                  <Select
                    aria-label={`Column for ${header}`}
                    data-lf-import-map={index}
                    onChange={(target) => {
                      const next = [...mapping];
                      next[index] = target;
                      setMapping(next);
                    }}
                    options={options}
                    popupMatchSelectWidth={false}
                    showSearch={{ optionFilterProp: 'label' }}
                    size="small"
                    style={{ minWidth: 180 }}
                    value={mapping[index]}
                  />
                  <SuggestionNote suggestion={suggestions[index]} target={mapping[index]} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The CSV import dialog (`importCsv: true`, design E6): parse the file in the browser in slices
// (readCsvFile: at most 50 MB and 100,000 rows), map its headers to input columns or new text columns (matchCsvHeaders suggests
// a column by its key or title, a synonym or a close spelling, marked until changed), then send the rows through onImport in batches of 500 with progress, stopping at the
// first failed batch with its error. Loaded and mounted only while open.
function ImportDialog({ api }) {
  const inputColumns = useMemo(() => getInputColumns(api.config.columns), [api.config.columns]);
  const [csv, setCsv] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const running = progress !== null && result === null;
  const close = () => api.actions.closeOverlay({ name: 'importing' });

  function onParsed(parsed) {
    setCsv(parsed);
    const matches = matchCsvHeaders({ headers: parsed.headers, columns: inputColumns });
    setSuggestions(matches);
    setMapping(matches.map((match) => match.target));
  }
  async function start() {
    const built = buildImportRows({
      records: csv.records,
      headers: csv.headers,
      mapping,
      columnsByKey: api.config.columnsByKey,
      existingKeys: [...api.config.columnsByKey.keys()],
      inputFieldPrefix: api.config.enrichment.inputFieldPrefix,
    });
    setProgress({ imported: 0, total: built.rows.length });
    const outcome = await api.actions.importRows({
      rows: built.rows,
      newColumns: built.newColumns,
      onProgress: setProgress,
    });
    setResult(outcome);
  }

  let footer = [
    <Button key="cancel" onClick={close}>
      Cancel
    </Button>,
  ];
  if (csv && progress === null) {
    footer = [
      ...footer,
      <Button data-lf-import-submit="" key="import" onClick={start} type="primary">
        Import {numberFormat.format(csv.records.length)} rows
      </Button>,
    ];
  }
  if (running) footer = [];
  if (result) {
    footer = [
      <Button data-lf-import-close="" key="close" onClick={close} type="primary">
        Close
      </Button>,
    ];
  }

  return (
    <Modal
      closable={!running}
      footer={footer}
      mask={{ closable: !running }}
      onCancel={running ? undefined : close}
      open
      title="Import CSV"
      width={640}
    >
      <div className="lf-enrich-import" data-lf-import-dialog="">
        {csv === null ? <FileStep onParsed={onParsed} /> : null}
        {csv !== null && progress === null ? (
          <MappingStep
            columns={inputColumns}
            csv={csv}
            mapping={mapping}
            setMapping={setMapping}
            suggestions={suggestions}
          />
        ) : null}
        {progress !== null ? (
          <div data-lf-import-progress={`${progress.imported}/${progress.total}`}>
            <Progress
              percent={
                progress.total === 0 ? 100 : Math.round((progress.imported / progress.total) * 100)
              }
              status={result?.error ? 'exception' : undefined}
            />
            <p>
              Imported {numberFormat.format(progress.imported)} of{' '}
              {numberFormat.format(progress.total)} rows.
            </p>
          </div>
        ) : null}
        {result?.error ? (
          <Alert data-lf-import-error="" showIcon title={result.error} type="error" />
        ) : null}
        {result && result.error === null ? (
          <Alert
            data-lf-import-done=""
            showIcon
            title={`Imported ${numberFormat.format(result.imported)} rows.`}
            type="success"
          />
        ) : null}
      </div>
    </Modal>
  );
}

export default ImportDialog;
