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
import { parseTraceLines } from '@lowdefy/node-utils';

// Reads exactly the trace files given, wherever they are, into one list of
// records. Lines that are not JSON are counted across all of them.
function readTraceFiles({ paths }) {
  const records = [];
  let unparsable = 0;
  paths.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Trace file not found at ${filePath}.`);
    }
    const parsed = parseTraceLines({ text: fs.readFileSync(filePath, 'utf8') });
    records.push(...parsed.records);
    unparsable += parsed.unparsable;
  });
  return { records, unparsable };
}

export default readTraceFiles;
