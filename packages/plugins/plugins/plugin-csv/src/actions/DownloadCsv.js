/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function DownloadCsv({ params }) {
  const { filename, data, fields: flds } = params;
  if (!Array.isArray(data) || typeof data[0] !== 'object') {
    throw new Error('csvMake data takes an array of objects');
  }
  let fields = flds;
  if (!fields) {
    fields = Object.keys(data[0]);
  }
  const arrays = [fields];
  data.forEach((obj) => arrays.push(fields.map((field) => obj[field])));
  const csv = arrays
    .map((row) =>
      row
        .map((cell) => (typeof cell === 'undefined' || cell === null ? '' : cell))
        .map(String)
        .map((v) => v.replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(',')
    )
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.setAttribute('download', filename);
  el.click();
  return;
}

export default DownloadCsv;
