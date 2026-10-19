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

// build/invalidatePages tells the dev server that watched files changed: the
// server reads it by value, so every write must differ from the one before,
// even two in one millisecond. The value stays a timestamp, which build status
// reads as the time of the latest edit.
function createChangeSignal({ buildDirectory }) {
  const filePath = path.join(buildDirectory, 'invalidatePages');
  let last = 0;
  try {
    last = Number(fs.readFileSync(filePath, 'utf8')) || 0;
  } catch {
    // No change signalled yet.
  }
  return function writeChangeSignal() {
    last = Math.max(Date.now(), last + 1);
    fs.writeFileSync(filePath, String(last));
    return last;
  };
}

export default createChangeSignal;
