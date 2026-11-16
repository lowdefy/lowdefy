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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A build artifact can be one line of many megabytes.
const MAX_LINE_LENGTH = 200;

// The first maxLines lines of a unified diff of two texts, headed
// a/baseline/<label> and b/current/<label>. git does the diffing, with
// --no-index so the files need not be in a repository.
function diffText({ baseline, current, label, maxLines = 40 }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-diff-'));
  const baselinePath = path.join('baseline', label);
  const currentPath = path.join('current', label);
  try {
    for (const [filePath, content] of [
      [baselinePath, baseline],
      [currentPath, current],
    ]) {
      fs.mkdirSync(path.dirname(path.join(directory, filePath)), { recursive: true });
      fs.writeFileSync(path.join(directory, filePath), content);
    }
    const result = spawnSync(
      'git',
      ['diff', '--no-index', '--no-color', '--no-ext-diff', baselinePath, currentPath],
      { cwd: directory, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 }
    );
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`git diff failed: ${result.stderr}`);
    }
    return result.stdout
      .trimEnd()
      .split('\n')
      .filter((line) => !line.startsWith('diff --git'))
      .slice(0, maxLines)
      .map((line) => (line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH)}…` : line));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

export default diffText;
