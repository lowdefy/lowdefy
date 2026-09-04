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
import { type } from '@lowdefy/helpers';

// The ref arrives from a tool argument, so it is never interpolated into a
// shell string — git is spawned with an argv array. A value starting with "-"
// would still be read by git as a flag rather than a ref, so ref shape is
// checked before spawning.
const REF_PATTERN = /^[\w./@^~-]+$/;

// Paths come back relative to the config directory (--relative), which is what
// keyMap/refMap resolve config keys to, so the two sides join without any path
// arithmetic.
function getChangedConfigFiles({ since, configDirectory }) {
  if (!type.isString(since) || since.length === 0 || since.startsWith('-')) {
    return { error: `"since" is not a git ref. Received ${JSON.stringify(since)}.` };
  }
  if (!REF_PATTERN.test(since)) {
    return { error: `"since" is not a git ref. Received ${JSON.stringify(since)}.` };
  }
  const result = spawnSync('git', ['diff', '--name-only', '--relative', since], {
    cwd: configDirectory,
    encoding: 'utf8',
  });
  if (!type.isNone(result.error)) {
    return { error: `Could not run git diff ${since}: ${result.error.message}` };
  }
  if (result.status !== 0) {
    return { error: `git diff ${since} failed: ${(result.stderr ?? '').trim()}` };
  }
  const files = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort();
  return { files };
}

export { REF_PATTERN };
export default getChangedConfigFiles;
