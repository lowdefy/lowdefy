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

// Appends one walk's log as a line of walks.jsonl in the run directory.
async function appendWalkLog({ runDirectory, log }) {
  await fs.promises.mkdir(runDirectory, { recursive: true });
  await fs.promises.appendFile(path.join(runDirectory, 'walks.jsonl'), `${JSON.stringify(log)}\n`);
}

export default appendWalkLog;
