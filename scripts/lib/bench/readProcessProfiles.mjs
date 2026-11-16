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

// Node names a profile CPU.<date>.<time>.<pid>.<thread id>.<sequence>.cpuprofile.
const PROFILE_NAME = /^CPU\.\d+\.\d+\.(\d+)\.(\d+)\.\d+\.cpuprofile$/;

// The CPU profiles of the given processes' main threads (thread id 0), parsed,
// with their file names. A worker thread's profile is left out: it runs beside
// the main thread, whose own profile shows the wait as (idle).
function readProcessProfiles({ directory, pids }) {
  const wanted = new Set(pids);
  return fs
    .readdirSync(directory)
    .sort()
    .filter((name) => {
      const match = PROFILE_NAME.exec(name);
      return match !== null && wanted.has(Number(match[1])) && match[2] === '0';
    })
    .map((name) => ({
      file: name,
      profile: JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')),
    }));
}

export default readProcessProfiles;
