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

import fs from 'node:fs';
import path from 'node:path';
import { traceIdDate } from '@lowdefy/helpers';

// Appends records as JSON lines to
// <config>/.lowdefy/traces/<source>/<yyyy-mm-dd>/<id>.jsonl. The date comes
// from the id, so a session that crosses midnight stays in one file. Each
// append opens the file afresh, so a file pruned mid-session simply starts
// again. The watchers never see these writes: .lowdefy is a dot-path.
function appendRecords({ configDirectory, source, id, records }) {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', source, traceIdDate(id));
  fs.mkdirSync(directory, { recursive: true });
  const lines = records.map((record) => `${JSON.stringify(record)}\n`).join('');
  fs.appendFileSync(path.join(directory, `${id}.jsonl`), lines);
}

export default appendRecords;
