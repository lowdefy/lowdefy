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
import { parseTraceLines } from '@lowdefy/node-utils';

import listWindowDays from './listWindowDays.js';
import parseTraceWindow from './parseTraceWindow.js';

// The production records of a window, read from the per-day cache that
// `lowdefy journeys pull posthog` writes: days in order, records in file
// order, with each day's manifest. A day is in the cache once its manifest is
// written (the pull writes it last). A missing day is an error naming the
// pull that fills it, never a silent gap.
function readProductionTrace({ directories, since, from, to, now = Date.now() }) {
  const window = parseTraceWindow({ since, from, to, now });
  const directory = path.join(directories.traces, 'production');
  const days = listWindowDays(window);
  const missing = days.filter(
    (day) => !fs.existsSync(path.join(directory, `${day}.manifest.json`))
  );
  if (missing.length > 0) {
    const shown = missing.length > 5 ? `${missing.slice(0, 5).join(', ')}, …` : missing.join(', ');
    throw new Error(
      `The production trace cache is missing ${missing.length} day(s) of ${window.from}/${
        window.to
      } (${shown}). Run "lowdefy journeys pull posthog --from ${missing[0]} --to ${
        missing[missing.length - 1]
      }" first.`
    );
  }
  const records = [];
  const manifests = [];
  let unparsable = 0;
  days.forEach((day) => {
    manifests.push(
      JSON.parse(fs.readFileSync(path.join(directory, `${day}.manifest.json`), 'utf8'))
    );
    const parsed = parseTraceLines({
      text: fs.readFileSync(path.join(directory, `${day}.jsonl`), 'utf8'),
    });
    records.push(...parsed.records);
    unparsable += parsed.unparsable;
  });
  return { records, unparsable, window, manifests };
}

export default readProductionTrace;
