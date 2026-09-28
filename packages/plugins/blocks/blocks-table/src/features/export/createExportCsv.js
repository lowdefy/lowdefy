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

import buildCsv from './buildCsv.js';

// Block method `exportCsv({ filename, formatted })`. `formatted` (default true) exports what the
// cells display; false exports raw values.
function createExportCsv(api) {
  return function exportCsv({ filename, formatted } = {}) {
    const csv = buildCsv({ api, formatted: formatted !== false });
    // The byte order mark makes spreadsheet apps read the file as UTF-8.
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename ?? 'export.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return csv;
  };
}

export default createExportCsv;
