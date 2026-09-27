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

// A long-lived dev server's log grows for its whole life; only its end is ever
// read, so only its end is loaded. The window holds MAX_LINES lines of any
// reasonable length.
const TAIL_BYTES = 1024 * 1024;
const MAX_LINES = 1000;

function readTailText({ logPath }) {
  const fd = fs.openSync(logPath, 'r');
  try {
    const { size } = fs.fstatSync(fd);
    const length = Math.min(size, TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    const text = buffer.toString('utf8');
    // Read from the middle of the file, the first line is a fragment.
    return length < size ? text.slice(text.indexOf('\n') + 1) : text;
  } finally {
    fs.closeSync(fd);
  }
}

function readLogTail({ logPath, lines = 100, grep }) {
  if (!fs.existsSync(logPath)) {
    return [];
  }
  let logLines = readTailText({ logPath })
    .replace(ANSI, '')
    .split(/\r?\n|\r/)
    .filter((line) => line.trim() !== '');
  if (grep) {
    const needle = grep.toLowerCase();
    logLines = logLines.filter((line) => line.toLowerCase().includes(needle));
  }
  return logLines.slice(-Math.min(lines, MAX_LINES));
}

export { MAX_LINES };
export default readLogTail;
