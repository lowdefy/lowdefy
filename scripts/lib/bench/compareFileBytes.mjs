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

import compareText from './compareText.mjs';

// The default comparer: byte for byte, after each side's server directory is
// replaced with <server>. Files whose bytes match are never decoded.
async function compareFileBytes({ file, baseline, current }) {
  const left = fs.readFileSync(path.join(baseline.serverDirectory, file));
  const right = fs.readFileSync(path.join(current.serverDirectory, file));
  if (left.equals(right)) {
    return { identical: true, lines: [] };
  }
  return compareText({
    file,
    baseline: baseline.replacePath(left.toString('utf8')),
    current: current.replacePath(right.toString('utf8')),
  });
}

export default compareFileBytes;
