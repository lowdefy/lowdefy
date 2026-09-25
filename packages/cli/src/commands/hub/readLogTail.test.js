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
import os from 'os';
import path from 'path';

import readLogTail from './readLogTail.js';

let logPath;

beforeEach(() => {
  logPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-log-')), 'dev.log');
});

test('readLogTail returns the last lines without colour codes or blank lines', () => {
  fs.writeFileSync(logPath, 'one\n\n\u001b[32mtwo\u001b[39m\nthree\n');
  expect(readLogTail({ logPath, lines: 2 })).toEqual(['two', 'three']);
});

test('readLogTail keeps only lines containing grep, ignoring case', () => {
  fs.writeFileSync(logPath, 'Built config\nError: bad block\nready\nerror again\n');
  expect(readLogTail({ logPath, grep: 'ERROR' })).toEqual(['Error: bad block', 'error again']);
});

test('readLogTail returns nothing when there is no log', () => {
  expect(readLogTail({ logPath })).toEqual([]);
});
