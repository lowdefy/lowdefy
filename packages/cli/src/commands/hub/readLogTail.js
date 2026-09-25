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

// Dev logs carry ANSI colour codes and spinner redraws; agents read plain text.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;

function readLogTail({ logPath, lines = 100, grep }) {
  if (!fs.existsSync(logPath)) {
    return [];
  }
  let logLines = fs
    .readFileSync(logPath, 'utf8')
    .replace(ANSI, '')
    .split(/\r?\n|\r/)
    .filter((line) => line.trim() !== '');
  if (grep) {
    const needle = grep.toLowerCase();
    logLines = logLines.filter((line) => line.toLowerCase().includes(needle));
  }
  return logLines.slice(-lines);
}

export default readLogTail;
