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

import createCsvReader from './createCsvReader.js';

const MB = 1024 * 1024;
const DEFAULT_MAX_BYTES = 50 * MB;
const DEFAULT_MAX_ROWS = 100000;
const DEFAULT_SLICE_MS = 12;

const numberFormat = new Intl.NumberFormat('en-US');

function yieldToBrowser() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// The records of a CSV file the user chose for an import (the header line first), read in the
// browser. A file over `maxBytes`, or with more than `maxRows` rows under its header, is
// refused with a message the import dialog shows. Parsing runs in slices of about `sliceMs`,
// with a pause between slices (`pause`, a macrotask), so a large file never freezes the page.
async function readCsvFile({
  file,
  maxBytes = DEFAULT_MAX_BYTES,
  maxRows = DEFAULT_MAX_ROWS,
  sliceMs = DEFAULT_SLICE_MS,
  pause = yieldToBrowser,
}) {
  if (file.size > maxBytes) {
    throw new Error(
      `The file is ${Math.ceil(file.size / MB)} MB. Import files of at most ${Math.floor(
        maxBytes / MB
      )} MB: split larger files.`
    );
  }
  const reader = createCsvReader(await file.text());
  const records = [];
  let sliceStart = Date.now();
  for (let record = reader.readRecord(); record !== null; record = reader.readRecord()) {
    records.push(record);
    if (records.length > maxRows + 1) {
      throw new Error(
        `The file has more than ${numberFormat.format(
          maxRows
        )} rows. Import at most ${numberFormat.format(maxRows)} rows at a time: split larger files.`
      );
    }
    if (records.length % 500 === 0 && Date.now() - sliceStart >= sliceMs) {
      await pause();
      sliceStart = Date.now();
    }
  }
  return records;
}

export default readCsvFile;
