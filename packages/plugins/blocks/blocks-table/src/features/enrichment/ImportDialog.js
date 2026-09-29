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
import parseCsv from './parseCsv.js';

const numberFormat = new Intl.NumberFormat();

function FileStep({ onParsed }) {
  const [error, setError] = useState(null);
  async function onChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const records = parseCsv(await file.text());
    if (records.length < 2) {
      setError('The file has no rows under its header line.');
      return;
    }
    onParsed({ name: file.name, headers: records[0], records: records.slice(1) });
  }
  return (
    <div className="lf-enrich-import-file">
      <p>Choose a CSV file. Its first line names the columns.</p>
      <input accept=".csv,text/csv" data-lf-import-file="" onChange={onChange} type="file" />
      {error ? <Alert data-lf-import-error="" showIcon title={error} type="error" /> : null}
    </div>
  );
}

function MappingStep({ columns, csv, mapping, setMapping }) {
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
                  size="small"
                  style={{ minWidth: 180 }}
                  value={mapping[index]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The CSV import dialog (`importCsv: true`, design E6): parse the file in the browser
// (parseCsv), map its headers to input columns or new text columns (matched by key or title
// first), then send the rows through onImport in batches of 500 with progress, stopping at the
// first failed batch with its error. Loaded and mounted only while open.
function ImportDialog({ api }) {
  const inputColumns = useMemo(() => getInputColumns(api.config.columns), [api.config.columns]);
  const [csv, setCsv] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const running = progress !== null && result === null;
  const close = () => api.actions.closeOverlay({ name: 'importing' });

  function onParsed(parsed) {
    setCsv(parsed);
    setMapping(matchCsvHeaders({ headers: parsed.headers, columns: inputColumns }));
  }
  async function start() {
    const built = buildImportRows({
      records: csv.records,
      headers: csv.headers,
      mapping,
      columnsByKey: api.config.columnsByKey,
      existingKeys: [...api.config.columnsByKey.keys()],
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
          <MappingStep columns={inputColumns} csv={csv} mapping={mapping} setMapping={setMapping} />
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
