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

import fs from 'fs';
import path from 'path';

// One UTC day of production records and its manifest, written to temporary
// names and renamed, records first: a day is in the cache once its manifest
// lands, so a stopped pull never leaves half a day that reads as whole.
function writeDayFile({ directories, day, records, manifest }) {
  const directory = path.join(directories.traces, 'production');
  fs.mkdirSync(directory, { recursive: true });
  const recordsPath = path.join(directory, `${day}.jsonl`);
  const manifestPath = path.join(directory, `${day}.manifest.json`);
  const text = records.map((record) => JSON.stringify(record)).join('\n');
  fs.writeFileSync(`${recordsPath}.tmp`, text === '' ? '' : `${text}\n`);
  fs.writeFileSync(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(`${recordsPath}.tmp`, recordsPath);
  fs.renameSync(`${manifestPath}.tmp`, manifestPath);
}

export default writeDayFile;
