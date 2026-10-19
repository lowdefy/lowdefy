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

const KEEP_DAYS = 400;
const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.(jsonl|manifest\.json)$/;

// Removes production day files older than 400 days, so a yearly flow stays
// visible and the cache does not grow without end. Only the pull prunes
// production/; the dev trace pruner never touches it.
function pruneDayFiles({ directories, now }) {
  const directory = path.join(directories.traces, 'production');
  if (!fs.existsSync(directory)) return [];
  const cutoff = new Date(now - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const removed = [];
  fs.readdirSync(directory).forEach((name) => {
    const match = DAY_FILE.exec(name);
    if (match === null || match[1] >= cutoff) return;
    fs.rmSync(path.join(directory, name));
    removed.push(name);
  });
  return removed.sort();
}

export default pruneDayFiles;
